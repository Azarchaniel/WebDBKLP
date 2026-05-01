import { useState, useRef, useCallback } from "react";
import { formatNumberLocale } from "@utils";

interface Props {
    labels: string[];
    values: number[];
    colors: string[];
    locale: string;
    textColor: string;
    title?: string;
}

interface TooltipState {
    x: number;
    y: number;
    label: string;
    value: number;
}

/** Build an SVG arc path for a pie slice.
 *  cx,cy = centre; r = radius; startAngle,endAngle in radians */
function slicePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

export const PieChart = ({ labels, values, colors, locale, textColor, title }: Props) => {
    const [hidden, setHidden] = useState<Set<number>>(new Set());
    const [tooltip, setTooltip] = useState<TooltipState | null>(null);
    const wrapRef = useRef<HTMLDivElement>(null);

    const toggleIndex = useCallback((i: number) => {
        setHidden(prev => {
            const next = new Set(prev);
            next.has(i) ? next.delete(i) : next.add(i);
            return next;
        });
    }, []);

    // Only consider visible slices with non-zero values
    const visibleIndices = labels
        .map((_, i) => i)
        .filter(i => !hidden.has(i) && values[i] > 0);

    const total = visibleIndices.reduce((sum, i) => sum + values[i], 0);

    // Build slices
    const CX = 100, CY = 100, R = 85;
    let angle = -Math.PI / 2; // start at top
    const slices = visibleIndices.map(i => {
        const fraction = values[i] / total;
        const startAngle = angle;
        const endAngle = angle + fraction * 2 * Math.PI;
        angle = endAngle;
        return { i, startAngle, endAngle };
    });

    const handleMouseMove = useCallback((e: React.MouseEvent<SVGPathElement>, i: number) => {
        const rect = wrapRef.current?.getBoundingClientRect();
        if (!rect) return;
        setTooltip({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            label: labels[i],
            value: values[i],
        });
    }, [labels, values]);

    const handleMouseLeave = useCallback(() => setTooltip(null), []);

    return (
        <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
            {/* SVG pie */}
            <div ref={wrapRef} style={{ position: "relative", flex: "1 1 0", minHeight: 0 }}>
                <svg viewBox="0 0 200 200" width="100%" height="100%">
                    {slices.length === 0 ? (
                        <circle cx={CX} cy={CY} r={R} fill="#ccc" />
                    ) : slices.length === 1 ? (
                        // Full circle for single visible slice
                        <circle cx={CX} cy={CY} r={R} fill={colors[slices[0].i % colors.length]}
                            onMouseMove={e => handleMouseMove(e, slices[0].i)}
                            onMouseLeave={handleMouseLeave}
                            style={{ cursor: "default" }}
                        />
                    ) : (
                        slices.map(({ i, startAngle, endAngle }) => (
                            <path
                                key={i}
                                d={slicePath(CX, CY, R, startAngle, endAngle)}
                                fill={colors[i % colors.length]}
                                stroke="#fff"
                                strokeWidth={1}
                                onMouseMove={e => handleMouseMove(e, i)}
                                onMouseLeave={handleMouseLeave}
                                style={{ cursor: "default" }}
                            />
                        ))
                    )}
                </svg>

                {tooltip && (
                    <div style={{
                        position: "absolute",
                        top: tooltip.y + 12,
                        left: tooltip.x + 12,
                        background: "var(--surface, #fff)",
                        border: "1px solid var(--input-border, #ccc)",
                        borderRadius: "4px",
                        padding: "4px 8px",
                        fontSize: "0.75rem",
                        color: textColor,
                        pointerEvents: "none",
                        whiteSpace: "nowrap",
                        zIndex: 10,
                    }}>
                        {tooltip.label}: {formatNumberLocale(tooltip.value, locale, 0)}
                    </div>
                )}
            </div>

            {/* Legend */}
            <div style={{
                padding: "0 0.5rem",
                flexShrink: 0,
            }}>
                {title && (
                    <div style={{
                        textAlign: "center",
                        fontWeight: "bold",
                        fontSize: "0.75rem",
                        color: textColor,
                        marginBottom: "0.25rem"
                    }}>
                        {title}
                    </div>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.25rem 0.75rem" }}>
                    {labels.map((label, i) => {
                        const isHidden = hidden.has(i);
                        return (
                            <div
                                key={i}
                                onClick={() => toggleIndex(i)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.3rem",
                                    cursor: "pointer",
                                    fontSize: "0.72rem",
                                    color: textColor,
                                    opacity: isHidden ? 0.4 : 1,
                                    textDecoration: isHidden ? "line-through" : "none",
                                }}
                            >
                                <span style={{
                                    display: "inline-block",
                                    width: "10px",
                                    height: "10px",
                                    borderRadius: "2px",
                                    background: colors[i % colors.length],
                                    flexShrink: 0,
                                    border: "1px solid #fff",
                                }} />
                                {label} ({formatNumberLocale(values[i], locale, 0)})
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
