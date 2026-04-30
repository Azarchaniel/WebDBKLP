import { useEffect, useState } from "react";

const readVar = (name: string, fallback: string): string => {
    if (typeof document === "undefined") return fallback;
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
};

/**
 * Reads a CSS custom property from :root and updates whenever the
 * `data-theme` attribute on <html> changes (theme switch).
 */
export const useThemeColor = (cssVarName: string, fallback: string = "#111827"): string => {
    const [color, setColor] = useState<string>(() => readVar(cssVarName, fallback));

    useEffect(() => {
        if (typeof document === "undefined") return;
        const root = document.documentElement;
        const update = () => setColor(readVar(cssVarName, fallback));
        update();

        const observer = new MutationObserver(update);
        observer.observe(root, { attributes: true, attributeFilter: ["data-theme", "class", "style"] });

        return () => observer.disconnect();
    }, [cssVarName, fallback]);

    return color;
};
