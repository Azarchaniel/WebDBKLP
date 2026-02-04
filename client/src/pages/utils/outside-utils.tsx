import React, { useMemo, useState } from "react";
import { Link } from "react-router";

// This pages doesn't belong to any specific category, it contains various utility functions and tools.
// It is not supposed to fit the rest of the WebDBKLP structure.
export default function UtilPage() {
    const [input, setInput] = useState("");
    const [lang, setLang] = useState<"cs" | "sk">("cs");
    const [swapYZ, setSwapYZ] = useState(true);

    const output = useMemo(() => convertMistypedText(input, lang, swapYZ), [input, lang, swapYZ]);

    return (
        <div style={{ padding: '20px', color: "black" }}>
            <Link to='/' style={{ textDecoration: 'none', color: 'black', marginBottom: '25px' }}>{"< WebDBKLP"}</Link>
            <h1>Utilities Page</h1>

            <p>This page contains various utility functions and tools that do not fit into the main categories of WebDBKLP.</p>

            <h3>Fix Slovak/Czech language</h3>

            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginTop: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Input (mistyped on EN keyboard)</label>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type or paste wrong text here..."
                        rows={6}
                        style={{ width: '100%', fontSize: 14, padding: 8 }}
                    />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Output (correct {lang === 'cs' ? 'Czech' : 'Slovak'})</label>
                    <textarea
                        readOnly
                        value={output}
                        rows={6}
                        style={{ width: '100%', fontSize: 14, padding: 8, background: '#f6f6f6' }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 10 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 600 }}>Language:</span>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <input
                            type="radio"
                            name="lang"
                            value="cs"
                            checked={lang === 'cs'}
                            onChange={() => setLang('cs')}
                        />
                        Czech (čeština)
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <input
                            type="radio"
                            name="lang"
                            value="sk"
                            checked={lang === 'sk'}
                            onChange={() => setLang('sk')}
                        />
                        Slovak (slovenčina)
                    </label>
                </div>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" checked={swapYZ} onChange={(e) => setSwapYZ(e.target.checked)} />
                    Swap Y/Z (QWERTY ↔ QWERTZ)
                </label>
                <button
                    onClick={() => setInput("")}
                    style={{ padding: '6px 10px', cursor: 'pointer' }}
                >Clear</button>
            </div>
        </div>
    )
}

type Lang = "cs" | "sk";

function convertMistypedText(text: string, lang: Lang, swapYZ: boolean): string {
    // Dead-key markers assumed in wrong input:
    // '+' = caron (háček) applied to next letter
    // '=' = acute accent (čárka/dĺžeň) applied to next letter
    // ';' = special: Czech 'ů', Slovak 'ô' (case inferred from next letter)

    const caronMapCs: Record<string, string> = {
        c: 'č', s: 'š', z: 'ž', r: 'ř', t: 'ť', d: 'ď', n: 'ň', l: 'ľ', e: 'ě'
    };
    const caronMapSk: Record<string, string> = {
        c: 'č', s: 'š', z: 'ž', t: 'ť', d: 'ď', n: 'ň', l: 'ľ'
    };
    const acuteMap: Record<string, string> = {
        a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', y: 'ý', l: 'ĺ', r: 'ŕ'
    };

    const isUpper = (ch: string) => ch.toUpperCase() === ch && ch.toLowerCase() !== ch;
    const upperIfNeeded = (out: string, original: string, locale: Lang) => {
        if (!out) return original;
        if (isUpper(original)) return out.toLocaleUpperCase(locale === 'cs' ? 'cs-CZ' : 'sk-SK');
        return out;
    };

    const swapYZChar = (ch: string) => {
        if (ch === 'y') return 'z';
        if (ch === 'Y') return 'Z';
        if (ch === 'z') return 'y';
        if (ch === 'Z') return 'Y';
        return ch;
    };

    const nextIsUpper = (i: number) => {
        for (let j = i + 1; j < text.length; j++) {
            const nj = text[j];
            if (nj === '+' || nj === '=') continue;
            return isUpper(nj);
        }
        return false;
    };

    const EN_PUNCT = `\`1234567890-=[]\\;',./~!@#$%^&*()_+{}|:"<>?`;
    const CS_PUNCT = `;+ěščřžýáíé=´ú)¨ů§,.-°1234567890%ˇ/('"!?:_`;
    const SK_PUNCT = `;+ľščťžýáíé=´úäňô§,.-°1234567890%ˇ/()"!?:_`;

    const punctMap: Record<string, string> = {};
    {
        const target = lang === 'cs' ? CS_PUNCT : SK_PUNCT;
        for (let i = 0; i < EN_PUNCT.length && i < target.length; i++) {
            punctMap[EN_PUNCT[i]] = target[i];
        }
    }

    const res: string[] = [];
    let caron = false;
    let acute = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '+') { caron = true; continue; }
        if (ch === '=') { acute = true; continue; }
        if (ch === ';') {
            const special = lang === 'cs' ? 'ů' : 'ô';
            const makeUpper = nextIsUpper(i);
            res.push(makeUpper ? special.toLocaleUpperCase(lang === 'cs' ? 'cs-CZ' : 'sk-SK') : special);
            // do not alter caron/acute state
            continue;
        }

        // Determine base letter with optional Y/Z swap. For caron case, do NOT swap (e.g., +z -> ž).
        const base = (caron || !swapYZ) ? ch : swapYZChar(ch);

        if (caron) {
            const map = lang === 'cs' ? caronMapCs : caronMapSk;
            const lower = base.toLowerCase();
            const out = map[lower] || base; // if not mappable, keep base
            res.push(upperIfNeeded(out, base, lang));
            caron = false; acute = false;
            continue;
        }

        if (acute) {
            const lower = base.toLowerCase();
            const out = acuteMap[lower] || base;
            res.push(upperIfNeeded(out, base, lang));
            acute = false; caron = false;
            continue;
        }

        // Apply punctuation/number mapping if present. Letters not in EN_PUNCT remain unchanged here.
        if (punctMap[base] !== undefined) {
            res.push(punctMap[base]);
        } else {
            res.push(base);
        }
    }

    return res.join('');
}
