import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

type ResourceKey = "kamen" | "zbrane" | "papier";

interface Player {
    name: string;
    resources: Record<ResourceKey, number>;
}

const RESOURCES: { key: ResourceKey; label: string; emoji: string }[] = [
    { key: "kamen", label: "Kámen", emoji: "🪨" },
    { key: "zbrane", label: "Zbraně", emoji: "⚔️" },
    { key: "papier", label: "Papír", emoji: "📄" },
];

const DEFAULT_PLAYER = (): Player => ({
    name: "",
    resources: { kamen: 0, zbrane: 0, papier: 0 },
});

export default function KzpPage() {
    const [wakeLockActive, setWakeLockActive] = useState(false);
    const wakeLockRef = useRef<any>(null);

    const toggleWakeLock = async () => {
        if (!('wakeLock' in navigator)) return;
        if (wakeLockRef.current) {
            await wakeLockRef.current.release();
            wakeLockRef.current = null;
            setWakeLockActive(false);
        } else {
            try {
                const sentinel = await (navigator as any).wakeLock.request('screen');
                wakeLockRef.current = sentinel;
                setWakeLockActive(true);
                sentinel.addEventListener('release', () => {
                    wakeLockRef.current = null;
                    setWakeLockActive(false);
                });
            } catch {
                setWakeLockActive(false);
            }
        }
    };

    // Re-acquire wake lock when tab becomes visible again
    useEffect(() => {
        const handleVisibility = async () => {
            if (document.visibilityState === 'visible' && wakeLockActive && !wakeLockRef.current) {
                try {
                    wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
                } catch { /* ignore */ }
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [wakeLockActive]);

    const [players, setPlayers] = useState<Player[]>([
        { ...DEFAULT_PLAYER(), name: "Žaneta" },
        { ...DEFAULT_PLAYER(), name: "Ľuboš" },
    ]);

    const updateName = (index: number, name: string) => {
        setPlayers((prev) =>
            prev.map((p, i) => (i === index ? { ...p, name } : p))
        );
    };

    const updateResource = (playerIndex: number, key: ResourceKey, delta: number) => {
        setPlayers((prev) =>
            prev.map((p, i) => {
                if (i !== playerIndex) return p;
                return {
                    ...p,
                    resources: {
                        ...p.resources,
                        [key]: Math.max(0, p.resources[key] + delta),
                    },
                };
            })
        );
    };

    const setResource = (playerIndex: number, key: ResourceKey, value: number) => {
        setPlayers((prev) =>
            prev.map((p, i) => {
                if (i !== playerIndex) return p;
                return {
                    ...p,
                    resources: {
                        ...p.resources,
                        [key]: Math.max(0, isNaN(value) ? 0 : value),
                    },
                };
            })
        );
    };

    const addPlayer = () => {
        setPlayers((prev) => [
            ...prev,
            { ...DEFAULT_PLAYER(), name: `Hráč ${prev.length + 1}` },
        ]);
    };

    const removePlayer = (index: number) => {
        setPlayers((prev) => prev.filter((_, i) => i !== index));
    };

    const resetAll = () => {
        setPlayers((prev) =>
            prev.map((p) => ({
                ...p,
                resources: { kamen: 0, zbrane: 0, papier: 0 },
            }))
        );
    };

    return (
        <div style={styles.page}>
            <Link to="/utils" style={styles.backLink}>{"< Utilities"}</Link>
            <div style={styles.titleRow}>
                <h1 style={styles.title}>Kámen, zbraně, papír</h1>
                {'wakeLock' in navigator && (
                    <button
                        onClick={toggleWakeLock}
                        style={{
                            ...styles.wakeLockBtn,
                            background: wakeLockActive ? '#f59e0b' : '#e0e0e0',
                            color: wakeLockActive ? '#fff' : '#333',
                        }}
                    >
                        {wakeLockActive ? '☀️ Obrazovka zapnutá' : '🌙 Nechat zapnutou obrazovku'}
                    </button>
                )}
            </div>
            <p style={styles.subtitle}>Počítadlo zdrojů pro hráče</p>

            <div style={styles.playerGrid}>
                {players.map((player, pi) => (
                    <div key={pi} style={styles.card}>
                        <div style={styles.cardHeader}>
                            <input
                                value={player.name}
                                onChange={(e) => updateName(pi, e.target.value)}
                                style={styles.nameInput}
                            />
                            {players.length > 1 && (
                                <button
                                    onClick={() => removePlayer(pi)}
                                    style={styles.removeBtn}
                                    title="Odebrat hráče"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {RESOURCES.map(({ key, label, emoji }) => (
                            <div key={key} style={styles.resourceRow}>
                                <span style={styles.resourceLabel}>
                                    {emoji} {label}
                                </span>
                                <div style={styles.counter}>
                                    <button
                                        style={styles.counterBtn}
                                        onClick={() => updateResource(pi, key, -3)}
                                    >
                                        −3
                                    </button>
                                    <button
                                        style={styles.counterBtn}
                                        onClick={() => updateResource(pi, key, -1)}
                                    >
                                        −
                                    </button>
                                    <input
                                        type="number"
                                        min={0}
                                        value={player.resources[key]}
                                        onChange={(e) =>
                                            setResource(pi, key, parseInt(e.target.value, 10))
                                        }
                                        style={styles.counterInput}
                                    />
                                    <button
                                        style={styles.counterBtn}
                                        onClick={() => updateResource(pi, key, 1)}
                                    >
                                        +
                                    </button>
                                    <button
                                        style={styles.counterBtn}
                                        onClick={() => updateResource(pi, key, 3)}
                                    >
                                        +3
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div style={styles.actions}>
                <button onClick={addPlayer} style={styles.addBtn}>
                    + Přidat hráče
                </button>
                <button onClick={resetAll} style={styles.resetBtn}>
                    ↺ Reset všech zdrojů
                </button>
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    page: {
        padding: "24px",
        maxWidth: "900px",
        margin: "0 auto",
        color: "black",
        fontFamily: "sans-serif",
    },
    titleRow: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
        flexWrap: "wrap",
        marginBottom: "4px",
    },
    wakeLockBtn: {
        padding: "6px 14px",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "0.9rem",
        whiteSpace: "nowrap" as const,
    },
    backLink: {
        textDecoration: "none",
        color: "black",
        display: "inline-block",
        marginBottom: "16px",
    },
    title: {
        margin: "0 0 4px",
    },
    subtitle: {
        color: "#666",
        marginBottom: "24px",
    },
    playerGrid: {
        display: "flex",
        flexWrap: "wrap",
        gap: "16px",
    },
    card: {
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        flex: "1 1 220px",
        minWidth: "200px",
        background: "#fafafa",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    },
    cardHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "14px",
        gap: "8px",
    },
    nameInput: {
        fontSize: "1rem",
        fontWeight: 600,
        border: "none",
        borderBottom: "1px solid #bbb",
        background: "transparent",
        outline: "none",
        flex: 1,
        minWidth: 0,
        color: "black",
    },
    removeBtn: {
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "#c00",
        fontSize: "1rem",
        lineHeight: 1,
        padding: "2px 4px",
    },
    resourceRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "10px",
    },
    resourceLabel: {
        fontSize: "0.95rem",
        minWidth: "90px",
    },
    counter: {
        display: "flex",
        alignItems: "center",
        gap: "4px",
    },
    counterBtn: {
        width: "32px",
        height: "32px",
        fontSize: "1.2rem",
        lineHeight: 1,
        cursor: "pointer",
        border: "1px solid #bbb",
        borderRadius: "4px",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    counterInput: {
        width: "52px",
        textAlign: "center",
        fontSize: "1rem",
        border: "1px solid #bbb",
        borderRadius: "4px",
        padding: "4px 0",
    },
    actions: {
        display: "flex",
        gap: "12px",
        marginTop: "24px",
        flexWrap: "wrap",
    },
    addBtn: {
        padding: "8px 18px",
        background: "#3a7bd5",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "0.95rem",
    },
    resetBtn: {
        padding: "8px 18px",
        background: "#e0e0e0",
        color: "#333",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "0.95rem",
    },
};
