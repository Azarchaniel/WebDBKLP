export interface Point { x: number; y: number }
export interface PixelImage { width: number; height: number; data: Uint8ClampedArray }
export type MatMarkers = [Point, Point, Point, Point];
export interface BookMeasurement {
    widthMm: number;
    heightMm: number;
    corners: Point[];
}

export function measureBookCorners(corners: MatMarkers, markers: MatMarkers): BookMeasurement {
    const toMat = perspectiveTransform(markers, MAT_POINTS);
    const points = corners.map(toMat);
    const turns = points.map((point, index) => cross(point, points[(index + 1) % 4], points[(index + 2) % 4]));
    if (!turns.every(turn => turn > 1) && !turns.every(turn => turn < -1)) {
        throw new Error("Book outline must be a convex quadrilateral.");
    }
    const edge = (index: number) => Math.hypot(
        points[index].x - points[(index + 1) % 4].x, points[index].y - points[(index + 1) % 4].y
    );
    const width = (edge(0) + edge(2)) / 2, height = (edge(1) + edge(3)) / 2;
    return { widthMm: Math.round(Math.min(width, height)), heightMm: Math.round(Math.max(width, height)), corners: points };
}

export function compensateBookHeight(
    dimensions: { widthMm: number; heightMm: number }, cameraHeightMm: number, bookThicknessMm: number
): { widthMm: number; heightMm: number } {
    if (!Number.isFinite(cameraHeightMm) || !Number.isFinite(bookThicknessMm) ||
        cameraHeightMm <= 0 || bookThicknessMm < 0 || bookThicknessMm >= cameraHeightMm) {
        throw new Error("Invalid camera height or book thickness.");
    }
    // The mat and cover are parallel planes, with the camera approximately perpendicular to both.
    const scale = (cameraHeightMm - bookThicknessMm) / cameraHeightMm;
    return {
        widthMm: Math.round(dimensions.widthMm * scale),
        heightMm: Math.round(dimensions.heightMm * scale)
    };
}

// Marker centers on the A4 template, clockwise from marker 1 at the top left.
export const MAT_POINTS: MatMarkers = [
    { x: 10, y: 10 }, { x: 200, y: 10 },
    { x: 200, y: 287 }, { x: 10, y: 287 }
];
export const MAT_WIDTH = 380;
export const MAT_HEIGHT = 554;
const PIXELS_PER_MM = 2;

const MARKER_CELLS = [[4], [0, 8], [0, 4, 8], [0, 2, 6, 8]];

function readMarker(image: PixelImage, dark: Uint8Array, corners: MatMarkers): { id: number; point: Point } | null {
    const project = perspectiveTransform(
        [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }, { x: 0, y: 5 }], corners
    );
    const cells: boolean[][] = [];
    for (let y = 0; y < 5; y++) {
        cells[y] = [];
        for (let x = 0; x < 5; x++) {
            let blackSamples = 0;
            for (const dy of [0.3, 0.5, 0.7]) {
                for (const dx of [0.3, 0.5, 0.7]) {
                    const p = project({ x: x + dx, y: y + dy });
                    blackSamples += dark[Math.round(p.y) * image.width + Math.round(p.x)];
                }
            }
            cells[y][x] = blackSamples >= 5;
            if ((x === 0 || y === 0 || x === 4 || y === 4) && !cells[y][x]) return null;
        }
    }
    for (let rotation = 0; rotation < 4; rotation++) {
        for (let id = 0; id < MARKER_CELLS.length; id++) {
            let matches = true;
            for (let y = 0; y < 3; y++) {
                for (let x = 0; x < 3; x++) {
                    let rx = x, ry = y;
                    for (let turn = 0; turn < rotation; turn++) [rx, ry] = [2 - ry, rx];
                    if (cells[ry + 1][rx + 1] !== MARKER_CELLS[id].includes(y * 3 + x)) matches = false;
                }
            }
            if (matches) return { id, point: project({ x: 2.5, y: 2.5 }) };
        }
    }
    return null;
}

export function findMatMarkers(image: PixelImage, previous?: MatMarkers): MatMarkers | null {
    const { width, height, data } = image;
    const gray = new Uint8Array(width * height);
    const stride = width + 1;
    const integral = new Float64Array(stride * (height + 1));
    for (let y = 0; y < height; y++) {
        let rowSum = 0;
        for (let x = 0; x < width; x++) {
            const i = y * width + x;
            gray[i] = (data[i * 4] + 2 * data[i * 4 + 1] + data[i * 4 + 2]) / 4;
            rowSum += gray[i];
            integral[(y + 1) * stride + x + 1] = integral[y * stride + x + 1] + rowSum;
        }
    }
    const dark = new Uint8Array(width * height);
    const radius = Math.max(12, Math.round(Math.min(width, height) * 0.035));
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const left = Math.max(0, x - radius), right = Math.min(width, x + radius + 1);
            const top = Math.max(0, y - radius), bottom = Math.min(height, y + radius + 1);
            const mean = (integral[bottom * stride + right] - integral[top * stride + right] -
                integral[bottom * stride + left] + integral[top * stride + left]) / ((right - left) * (bottom - top));
            dark[y * width + x] = gray[y * width + x] < mean - Math.max(6, mean * 0.04) ? 1 : 0;
        }
    }
    const labels = dark.slice();
    const candidates: { point: Point; area: number }[][] = [[], [], [], []];
    const queue = new Int32Array(labels.length);
    for (let start = 0; start < labels.length; start++) {
        if (!labels[start]) continue;
        let head = 0, tail = 1;
        const boundary: Point[] = [];
        let minX = width, maxX = 0, minY = height, maxY = 0;
        queue[0] = start;
        labels[start] = 0;
        while (head < tail) {
            const i = queue[head++];
            const x = i % width, y = Math.floor(i / width);
            if (x === 0 || x === width - 1 || y === 0 || y === height - 1 ||
                !labels[i - 1] || !labels[i + 1] || !labels[i - width] || !labels[i + width]) boundary.push({ x, y });
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
            for (const next of [x > 0 ? i - 1 : -1, x + 1 < width ? i + 1 : -1,
                y > 0 ? i - width : -1, y + 1 < height ? i + width : -1]) {
                if (next >= 0 && labels[next]) {
                    labels[next] = 0;
                    queue[tail++] = next;
                }
            }
        }
        const boxWidth = maxX - minX + 1, boxHeight = maxY - minY + 1;
        if (tail < 40 || tail > width * height * 0.015 ||
            boxWidth < 12 || boxHeight < 12 ||
            boxWidth / boxHeight < 0.4 || boxWidth / boxHeight > 2.5 ||
            tail / (boxWidth * boxHeight) < 0.25 ||
            minX === 0 || minY === 0 || maxX === width - 1 || maxY === height - 1) continue;
        const hull = convexHull(boundary);
        while (hull.length > 4) {
            let smallest = 0;
            for (let i = 1; i < hull.length; i++) {
                const triangle = (index: number) => Math.abs(cross(hull[(index + hull.length - 1) % hull.length],
                    hull[index], hull[(index + 1) % hull.length]));
                if (triangle(i) < triangle(smallest)) smallest = i;
            }
            hull.splice(smallest, 1);
        }
        if (hull.length !== 4) continue;
        const corners: MatMarkers = [hull[0], hull[1], hull[2], hull[3]];
        if (corners.some((p, i) => cross(p, corners[(i + 1) % 4], corners[(i + 2) % 4]) < 25)) continue;
        const marker = readMarker(image, dark, corners);
        if (!marker) continue;
        const { id, point } = marker;
        if (previous && Math.hypot(point.x - previous[id].x, point.y - previous[id].y) > width * 0.04) continue;
        candidates[id].push({ point, area: boxWidth * boxHeight });
    }
    // Duplicate marker IDs must not silently become calibration points.
    if (candidates.some(points => points.length !== 1)) return null;
    const areas = candidates.map(points => points[0].area);
    if (Math.max(...areas) / Math.min(...areas) > 3) return null;
    const markers: MatMarkers = [
        candidates[0][0].point, candidates[1][0].point,
        candidates[2][0].point, candidates[3][0].point
    ];
    const crosses = markers.map((a, i) => cross(a, markers[(i + 1) % 4], markers[(i + 2) % 4]));
    if (!crosses.every(value => value > width * height * 0.02)) return null;
    return markers;
}

function cross(a: Point, b: Point, c: Point): number {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

export function perspectiveTransform(from: MatMarkers, to: MatMarkers): (point: Point) => Point {
    const rows: number[][] = [];
    from.forEach(({ x, y }, i) => {
        const target = to[i];
        rows.push([x, y, 1, 0, 0, 0, -target.x * x, -target.x * y, target.x]);
        rows.push([0, 0, 0, x, y, 1, -target.y * x, -target.y * y, target.y]);
    });
    for (let col = 0; col < 8; col++) {
        let pivot = col;
        for (let row = col + 1; row < 8; row++) {
            if (Math.abs(rows[row][col]) > Math.abs(rows[pivot][col])) pivot = row;
        }
        [rows[col], rows[pivot]] = [rows[pivot], rows[col]];
        const divisor = rows[col][col];
        if (Math.abs(divisor) < 1e-10) throw new Error("Degenerate measurement calibration.");
        for (let j = col; j <= 8; j++) rows[col][j] /= divisor;
        for (let row = 0; row < 8; row++) {
            if (row === col) continue;
            const factor = rows[row][col];
            for (let j = col; j <= 8; j++) rows[row][j] -= factor * rows[col][j];
        }
    }
    const h = rows.map(row => row[8]);
    return ({ x, y }) => {
        const denominator = h[6] * x + h[7] * y + 1;
        if (Math.abs(denominator) < 1e-10) throw new Error("Invalid measurement projection.");
        return {
            x: (h[0] * x + h[1] * y + h[2]) / denominator,
            y: (h[3] * x + h[4] * y + h[5]) / denominator
        };
    };
}

export function rectifyMat(image: PixelImage, markers: MatMarkers): PixelImage {
    const project = perspectiveTransform(MAT_POINTS, markers);
    const data = new Uint8ClampedArray(MAT_WIDTH * MAT_HEIGHT * 4);
    for (let y = 0; y < MAT_HEIGHT; y++) {
        for (let x = 0; x < MAT_WIDTH; x++) {
            const channels = [0, 0, 0, 0];
            // Area sampling avoids aliasing a 1 mm grid onto the rectified 2 px/mm image.
            for (const dy of [-0.125, 0.125]) {
                for (const dx of [-0.125, 0.125]) {
                    const source = project({ x: 10 + x / PIXELS_PER_MM + dx, y: 10 + y / PIXELS_PER_MM + dy });
                    const sx = Math.floor(source.x), sy = Math.floor(source.y);
                    if (sx < 0 || sy < 0 || sx + 1 >= image.width || sy + 1 >= image.height) {
                        throw new Error("Measurement mat is outside the camera frame.");
                    }
                    const fx = source.x - sx, fy = source.y - sy;
                    for (let c = 0; c < 4; c++) {
                        const offset = (sy * image.width + sx) * 4 + c;
                        channels[c] += image.data[offset] * (1 - fx) * (1 - fy) +
                            image.data[offset + 4] * fx * (1 - fy) +
                            image.data[offset + image.width * 4] * (1 - fx) * fy +
                            image.data[offset + image.width * 4 + 4] * fx * fy;
                    }
                }
            }
            for (let c = 0; c < 4; c++) data[(y * MAT_WIDTH + x) * 4 + c] = channels[c] / 4;
        }
    }
    return { width: MAT_WIDTH, height: MAT_HEIGHT, data };
}

function convexHull(points: Point[]): Point[] {
    const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
    const half = (values: Point[]) => {
        const result: Point[] = [];
        for (const point of values) {
            while (result.length > 1 && cross(result[result.length - 2], result[result.length - 1], point) <= 0) result.pop();
            result.push(point);
        }
        result.pop();
        return result;
    };
    return [...half(sorted), ...half([...sorted].reverse())];
}

export function measureBook(reference: PixelImage, current: PixelImage): BookMeasurement | null {
    if (reference.width !== MAT_WIDTH || reference.height !== MAT_HEIGHT ||
        current.width !== MAT_WIDTH || current.height !== MAT_HEIGHT ||
        reference.data.length !== current.data.length || current.data.length !== MAT_WIDTH * MAT_HEIGHT * 4) {
        throw new Error("Invalid measurement image dimensions.");
    }
    const mask = new Uint8Array(MAT_WIDTH * MAT_HEIGHT);
    // Exclude markers and the outside border; the entire book must be inside this area.
    const inset = 16;
    // The exposed margin estimates camera exposure drift without sampling the book.
    const marginPixels: number[] = [];
    for (let y = 32; y < MAT_HEIGHT - 32; y += 3) {
        for (const x of [10, 12, MAT_WIDTH - 13, MAT_WIDTH - 11]) marginPixels.push(y * MAT_WIDTH + x);
    }
    for (let x = 32; x < MAT_WIDTH - 32; x += 3) {
        for (const y of [10, 12, MAT_HEIGHT - 13, MAT_HEIGHT - 11]) marginPixels.push(y * MAT_WIDTH + x);
    }
    for (let y = 1; y < 14; y += 2) {
        for (let x = 1; x < 14; x += 2) {
            for (const row of [y, MAT_HEIGHT - y - 1]) {
                for (const col of [x, MAT_WIDTH - x - 1]) marginPixels.push(row * MAT_WIDTH + col);
            }
        }
    }
    const percentile = (values: number[], fraction: number) => {
        values.sort((a, b) => a - b);
        return values[Math.floor((values.length - 1) * fraction)];
    };
    const exposure = [0, 1, 2].map(c => {
        const values = marginPixels.map(i => reference.data[i * 4 + c]);
        const low = percentile(values, 0.02), high = percentile(values, 0.95);
        if (high - low >= 40) {
            const dark = marginPixels.filter(i => reference.data[i * 4 + c] <= low);
            const light = marginPixels.filter(i => reference.data[i * 4 + c] >= high);
            const median = (pixels: number[], image: PixelImage) =>
                percentile(pixels.map(i => image.data[i * 4 + c]), 0.5);
            const fromDark = median(dark, reference), fromLight = median(light, reference);
            const toDark = median(dark, current), toLight = median(light, current);
            if (toLight - toDark >= 15) {
                const gain = (toLight - toDark) / (fromLight - fromDark);
                return { gain, offset: toDark - gain * fromDark };
            }
        }
        return { gain: 1, offset: percentile(marginPixels.map(i =>
            current.data[i * 4 + c] - reference.data[i * 4 + c]), 0.5) };
    });
    const differenceAt = (i: number) => Math.max(...[0, 1, 2].map(c =>
        Math.abs(current.data[i * 4 + c] -
            Math.min(255, Math.max(0, reference.data[i * 4 + c] * exposure[c].gain + exposure[c].offset)))));
    let threshold = Math.max(5, percentile(marginPixels.map(differenceAt), 0.95) * 3 + 2);
    const differences = new Float32Array(mask.length);
    const expected = new Uint8ClampedArray(reference.data.length);
    for (let i = 0; i < mask.length; i++) {
        for (let c = 0; c < 3; c++) expected[i * 4 + c] = reference.data[i * 4 + c] * exposure[c].gain + exposure[c].offset;
    }
    for (let y = inset; y < MAT_HEIGHT - inset; y++) {
        for (let x = inset; x < MAT_WIDTH - inset; x++) {
            const i = y * MAT_WIDTH + x;
            let difference = 0;
            // Average over several grid pixels to suppress phase changes during resampling.
            for (let c = 0; c < 3; c++) {
                let referenceSum = 0, currentSum = 0;
                for (let dy = -2; dy <= 2; dy++) {
                    for (let dx = -2; dx <= 2; dx++) {
                        const offset = ((y + dy) * MAT_WIDTH + x + dx) * 4 + c;
                        referenceSum += expected[offset];
                        currentSum += current.data[offset];
                    }
                }
                difference = Math.max(difference, Math.abs(currentSum - referenceSum) / 25);
            }
            differences[i] = difference;
        }
    }
    const gridNoise: number[] = [];
    for (let y = 32; y < MAT_HEIGHT - 32; y += 3) {
        for (const x of [18, 21, MAT_WIDTH - 22, MAT_WIDTH - 19]) gridNoise.push(differences[y * MAT_WIDTH + x]);
    }
    for (let x = 32; x < MAT_WIDTH - 32; x += 3) {
        for (const y of [18, 21, MAT_HEIGHT - 22, MAT_HEIGHT - 19]) gridNoise.push(differences[y * MAT_WIDTH + x]);
    }
    threshold = Math.max(threshold, percentile(gridNoise, 0.8) * 2 + 2);
    for (let i = 0; i < mask.length; i++) mask[i] = differences[i] > threshold ? 1 : 0;
    // A one-pixel dilation bridges small gaps without joining distant objects.
    const dilated = new Uint8Array(mask.length);
    for (let y = 1; y < MAT_HEIGHT - 1; y++) {
        for (let x = 1; x < MAT_WIDTH - 1; x++) {
            const i = y * MAT_WIDTH + x;
            dilated[i] = mask[i] || mask[i - 1] || mask[i + 1] || mask[i - MAT_WIDTH] || mask[i + MAT_WIDTH];
        }
    }
    const queue = new Int32Array(mask.length);
    // A white cover can match the paper but hides its grid. Fill the enclosed grid cells.
    const outside = new Uint8Array(mask.length);
    let head = 0, tail = 1;
    outside[0] = 1;
    queue[0] = 0;
    while (head < tail) {
        const i = queue[head++], x = i % MAT_WIDTH, y = Math.floor(i / MAT_WIDTH);
        for (const next of [x > 0 ? i - 1 : -1, x + 1 < MAT_WIDTH ? i + 1 : -1,
            y > 0 ? i - MAT_WIDTH : -1, y + 1 < MAT_HEIGHT ? i + MAT_WIDTH : -1]) {
            if (next >= 0 && !outside[next] && !dilated[next]) {
                outside[next] = 1;
                queue[tail++] = next;
            }
        }
    }
    for (let i = 0; i < dilated.length; i++) {
        if (!outside[i]) dilated[i] = 1;
    }
    // Remove thin residual grid lines caused by subpixel alignment after camera movement.
    const eroded = new Uint8Array(mask.length);
    for (let y = 2; y < MAT_HEIGHT - 2; y++) {
        for (let x = 2; x < MAT_WIDTH - 2; x++) {
            let solid = true;
            for (let dy = -2; dy <= 2 && solid; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    if (!dilated[(y + dy) * MAT_WIDTH + x + dx]) { solid = false; break; }
                }
            }
            if (solid) eroded[y * MAT_WIDTH + x] = 1;
        }
    }
    dilated.fill(0);
    for (let y = 2; y < MAT_HEIGHT - 2; y++) {
        for (let x = 2; x < MAT_WIDTH - 2; x++) {
            if (!eroded[y * MAT_WIDTH + x]) continue;
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) dilated[(y + dy) * MAT_WIDTH + x + dx] = 1;
            }
        }
    }
    const components: { count: number; boundary: Point[]; clipped: boolean }[] = [];
    for (let start = 0; start < dilated.length; start++) {
        if (!dilated[start]) continue;
        let head = 0, tail = 1, clipped = false;
        const boundary: Point[] = [];
        queue[0] = start;
        dilated[start] = 0;
        while (head < tail) {
            const i = queue[head++], x = i % MAT_WIDTH, y = Math.floor(i / MAT_WIDTH);
            if (x <= inset || x >= MAT_WIDTH - inset - 1 || y <= inset || y >= MAT_HEIGHT - inset - 1) clipped = true;
            if (!mask[i - 1] || !mask[i + 1] || !mask[i - MAT_WIDTH] || !mask[i + MAT_WIDTH]) boundary.push({ x, y });
            for (const next of [x > 0 ? i - 1 : -1, x + 1 < MAT_WIDTH ? i + 1 : -1,
                y > 0 ? i - MAT_WIDTH : -1, y + 1 < MAT_HEIGHT ? i + MAT_WIDTH : -1]) {
                if (next >= 0 && dilated[next]) {
                    dilated[next] = 0;
                    queue[tail++] = next;
                }
            }
        }
        if (tail > 1600) components.push({ count: tail, boundary, clipped });
    }
    components.sort((a, b) => b.count - a.count);
    const object = components[0];
    if (!object || object.clipped || (components[1] && components[1].count > object.count * 0.1)) return null;
    const hull = convexHull(object.boundary);
    let best: { area: number; width: number; height: number; corners: Point[] } | null = null;
    for (let i = 0; i < hull.length; i++) {
        const point = hull[i];
        const next = hull[(i + 1) % hull.length];
        const angle = Math.atan2(next.y - point.y, next.x - point.x);
        const cos = Math.cos(angle), sin = Math.sin(angle);
        const xs = hull.map(p => p.x * cos + p.y * sin);
        const ys = hull.map(p => -p.x * sin + p.y * cos);
        const left = Math.min(...xs), right = Math.max(...xs), top = Math.min(...ys), bottom = Math.max(...ys);
        const width = right - left, height = bottom - top, area = width * height;
        if (!best || area < best.area) {
            best = {
                area, width, height,
                corners: [{ x: left, y: top }, { x: right, y: top }, { x: right, y: bottom }, { x: left, y: bottom }]
                    .map(p => ({ x: (p.x * cos - p.y * sin) / 2 + 10, y: (p.x * sin + p.y * cos) / 2 + 10 }))
            };
        }
    }
    const rectangle = best;
    if (!rectangle || object.count / rectangle.area < 0.75 ||
        Math.min(rectangle.width, rectangle.height) < 40) return null;
    // Compensate the two-pixel averaging radius and one-pixel dilation at both edges.
    return {
        widthMm: Math.round((Math.min(rectangle.width, rectangle.height) - 5) / PIXELS_PER_MM),
        heightMm: Math.round((Math.max(rectangle.width, rectangle.height) - 5) / PIXELS_PER_MM),
        corners: rectangle.corners
    };
}
