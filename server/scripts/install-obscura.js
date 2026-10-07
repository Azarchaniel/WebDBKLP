const fs = require('fs');
const https = require('https');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const repo = 'h4ckf0r0day/obscura';
const vendorDir = path.resolve(__dirname, '..', 'vendor', 'obscura');
const executableName = process.platform === 'win32' ? 'obscura.exe' : 'obscura';

const getAssetName = () => {
    const arch = process.arch === 'x64'
        ? 'x86_64'
        : process.arch === 'arm64'
            ? 'aarch64'
            : null;

    const platform = process.platform === 'win32'
        ? 'windows'
        : process.platform === 'darwin'
            ? 'macos'
            : process.platform === 'linux'
                ? 'linux'
                : null;

    if (!arch || !platform) {
        throw new Error(`Unsupported platform for Obscura: ${process.platform}/${process.arch}`);
    }

    return `obscura-${arch}-${platform}.${platform === 'windows' ? 'zip' : 'tar.gz'}`;
};

const download = (url, target) =>
    new Promise((resolve, reject) => {
        const request = https.get(url, {
            headers: { 'User-Agent': 'WebDBKLP-obscura-installer' },
        }, response => {
            if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
                response.resume();
                download(response.headers.location, target).then(resolve, reject);
                return;
            }

            if (response.statusCode !== 200) {
                response.resume();
                reject(new Error(`Download failed with HTTP ${response.statusCode}: ${url}`));
                return;
            }

            const file = fs.createWriteStream(target);
            response.pipe(file);
            file.on('finish', () => file.close(resolve));
            file.on('error', reject);
        });
        request.on('error', reject);
    });

const findFile = (dir, fileName) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            const found = findFile(fullPath, fileName);
            if (found) return found;
        } else if (entry.name === fileName) {
            return fullPath;
        }
    }
    return undefined;
};

const copyIfPresent = (extractDir, fileName) => {
    const found = findFile(extractDir, fileName);
    if (!found) return;
    const target = path.join(vendorDir, fileName);
    fs.copyFileSync(found, target);
    if (process.platform !== 'win32') {
        fs.chmodSync(target, 0o755);
    }
};

const main = async () => {
    fs.mkdirSync(vendorDir, { recursive: true });

    const existing = path.join(vendorDir, executableName);
    if (fs.existsSync(existing)) {
        console.log(`Obscura already installed at ${existing}`);
        return;
    }

    const assetName = getAssetName();
    const url = `https://github.com/${repo}/releases/latest/download/${assetName}`;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'obscura-'));
    const archivePath = path.join(tempDir, assetName);

    console.log(`Downloading Obscura from ${url}`);
    await download(url, archivePath);

    if (assetName.endsWith('.zip')) {
        execFileSync('powershell.exe', [
            '-NoProfile',
            '-Command',
            `Expand-Archive -LiteralPath ${JSON.stringify(archivePath)} -DestinationPath ${JSON.stringify(tempDir)} -Force`,
        ], { stdio: 'inherit' });
    } else {
        execFileSync('tar', ['-xzf', archivePath, '-C', tempDir], { stdio: 'inherit' });
    }

    copyIfPresent(tempDir, executableName);
    copyIfPresent(tempDir, process.platform === 'win32' ? 'obscura-worker.exe' : 'obscura-worker');

    if (!fs.existsSync(existing)) {
        throw new Error(`Obscura executable was not found in ${assetName}`);
    }

    console.log(`Installed Obscura to ${vendorDir}`);
};

main().catch(error => {
    console.error(error);
    process.exit(1);
});
