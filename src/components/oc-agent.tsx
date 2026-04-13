'use client'

import React, { useEffect, useState } from "react";

interface CatColors {
    crypto: string;
    finance: string;
    sports: string;
    politics: string;
    custom: string;
    [key: string]: string;
}

const catColors: CatColors = {
    crypto:   "text-[#CCFF00] border-[#CCFF00]/60",
    finance:  "text-blue-400 border-blue-400/60",
    sports:   "text-emerald-400 border-emerald-400/60",
    politics: "text-red-400 border-red-400/60",
    custom:   "text-purple-400 border-purple-400/60",
};

const fmt = (n: number | string | undefined | null) => {
    if (n === null || n === undefined) return "0";
    const num = Number(n);
    if (isNaN(num)) return "0";
    return num.toLocaleString("en-US", { maximumFractionDigits: 0 });
};

interface Market {
    id: string;
    criteria: string;
    category: string;
    status?: 'open' | 'closed' | 'resolved';
    current_prices?: { yes_price?: number };
    total_volume?: number;
}

interface Position {
    id: string;
    side: string;
    market_criteria: string;
    amount: number;
    timestamp: number;
}

interface Metrics {
    active_markets?: number;
    closed_markets?: number;
    resolved_markets?: number;
    voided_markets?: number;
    anchored_markets?: number;
    vault_balance_usdc?: number;
    treasury_balance_usdc?: number;
    vault_utilization?: number;
    vault_net_pnl_usdc?: number;
    total_users?: number;
    total_usdc_bet?: number;
    vault_payout_to_winners_usdc?: number;
    user_losses_usdc?: number;
}

export default function Dashboard() {
    const [markets, setMarkets] = useState<Market[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        let ws: WebSocket | undefined;

        const connect = () => {
            ws = new WebSocket("ws://10.44.44.25:8765");

            ws!.onopen = () => {
                setConnected(true);
                ws!.send(JSON.stringify({ type: "subscribe", subscription: "markets" }));
                ws!.send(JSON.stringify({ type: "subscribe", subscription: "metrics" }));
                ws!.send(JSON.stringify({ type: "get_markets" }));
                ws!.send(JSON.stringify({ type: "get_positions" }));
                ws!.send(JSON.stringify({ type: "get_metrics" }));
            };

            ws!.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                switch (msg.type) {
                    case "markets_data":
                    case "market_update":
                        setMarkets(msg.data || []);
                        break;
                    case "positions_data":
                        setPositions(msg.data || []);
                        break;
                    case "metrics_data":
                    case "metrics_update":
                        setMetrics(msg.data);
                        break;
                }
            };

            ws!.onclose = () => {
                setConnected(false);
                setTimeout(connect, 2000);
            };

            ws!.onerror = () => { if (ws) ws!.close(); };
        };

        connect();
        return () => { if (ws) ws.close(); };
    }, []);

    return (
        <div
            className="h-screen flex flex-col w-full overflow-hidden text-sm"
            style={{ background: "#0a0f0a", color: "rgba(255,255,255,0.75)", fontFamily: "'Inter', sans-serif" }}
        >
            {/* ── HEADER ── */}
            <header
                className="flex h-11 flex-shrink-0 items-center"
                style={{ borderBottom: "1px solid rgba(204,255,0,0.15)" }}
            >
                {/* Logo */}
                <div
                    className="px-5 flex items-center gap-1 h-full"
                    style={{ borderRight: "1px solid rgba(204,255,0,0.12)" }}
                >
                    {/* Claw icon */}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" stroke="#CCFF00" strokeWidth="1.2"/>
                        <path d="M8 4v4l3 2" stroke="#CCFF00" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    <span className="font-mono text-[11px] tracking-[0.2em] text-white font-medium ml-1">
                        OC/<span style={{ color: "#CCFF00" }}>AGENT</span>
                    </span>
                </div>

                <HeaderStat label="Open Markets" value={markets.length} />
                <HeaderStat label="Positions" value={positions.length} />

                <div className="flex-1" />

                {/* Live indicator */}
                <div className="flex items-center gap-2 px-5">
                    <span
                        className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-widest px-2 py-0.5 rounded-sm"
                        style={{
                            color: connected ? "#CCFF00" : "#ff4444",
                            border: `1px solid ${connected ? "rgba(204,255,0,0.4)" : "rgba(255,68,68,0.4)"}`,
                            background: connected ? "rgba(204,255,0,0.06)" : "rgba(255,68,68,0.06)",
                        }}
                    >
                        <span
                            className="inline-block w-1.5 h-1.5 rounded-full"
                            style={{
                                background: connected ? "#CCFF00" : "#ff4444",
                                boxShadow: connected ? "0 0 6px #CCFF00" : "0 0 6px #ff4444",
                                animation: "pulse 1.5s ease-in-out infinite",
                            }}
                        />
                        {connected ? "LIVE" : "RECONNECTING"}
                    </span>
                </div>
            </header>

            {/* ── MAIN GRID ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] grid-rows-[1fr_240px] flex-1 min-h-0">

                {/* ── MARKETS TABLE ── */}
                <section className="flex flex-col min-h-0 lg:border-r" style={{ borderColor: "rgba(204,255,0,0.1)" }}>
                    <SectionHeader label="Markets" accent="Live" />

                    <div className="flex-1 overflow-y-auto">
                        {/* Desktop таблиця */}
                        <div className="hidden lg:block">
                            <table className="w-full table-fixed">
                                <thead
                                    className="sticky top-0 z-10 text-[10px] font-mono uppercase tracking-wider"
                                    style={{
                                        background: "#0a0f0a",
                                        color: "rgba(255,255,255,0.35)",
                                        borderBottom: "1px solid rgba(204,255,0,0.1)",
                                    }}
                                >
                                <tr>
                                    <th className="text-left px-4 py-2 w-[60px]">Status</th>
                                    <th className="text-left px-4 py-2 w-[240px]">Event</th>
                                    <th className="w-[90px] text-center">Cat</th>
                                    <th className="w-[200px]">Probability</th>
                                    <th className="px-4 w-[110px] text-right">Volume</th>
                                </tr>
                                </thead>
                                <tbody>
                                {markets.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center font-mono text-xs" style={{ color: "rgba(204,255,0,0.3)" }}>
                                            Waiting for market data...
                                        </td>
                                    </tr>
                                ) : markets.map((m) => {
                                    const y = Math.round((m.current_prices?.yes_price || 0) * 100);
                                    const isHigh = y >= 70;
                                    const isLow = y <= 30;
                                    const barColor = isHigh ? "#CCFF00" : isLow ? "#ff4f4f" : "#4ade80";
                                    const isOpen = m.status !== 'closed' && m.status !== 'resolved';

                                    return (
                                        <tr
                                            key={m.id}
                                            style={{
                                                borderBottom: "1px solid rgba(255,255,255,0.05)",
                                                opacity: isOpen ? 1 : 0.5
                                            }}
                                            className="group transition-colors duration-100"
                                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(204,255,0,0.03)")}
                                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                        >
                                            <td className="px-4 py-2.5 text-start">
                                                <span
                                                    className={`text-[9px] uppercase border px-1.5 py-0.5 font-mono tracking-wide rounded-sm ${
                                                        isOpen 
                                                            ? "text-green-400 border-green-400/60" 
                                                            : "text-red-400 border-red-400/60"
                                                    }`}
                                                >
                                                    {isOpen ? "OPEN" : "CLOSED"}
                                                </span>
                                            </td>

                                            <td className="px-4 py-2.5 truncate text-[13px]" style={{ color: "rgba(255,255,255,0.85)" }}>
                                                {m.criteria}
                                            </td>

                                            <td className="text-center py-2.5">
                                                    <span className={`text-[9px] uppercase border px-1.5 py-0.5 font-mono tracking-wide rounded-sm ${catColors[m.category] || "text-white/40 border-white/20"}`}>
                                                        {m.category}
                                                    </span>
                                            </td>

                                            <td className="py-2.5 pr-4">
                                                <div className="flex items-center gap-2">
                                                        {y > 0 && (
                                                            <span
                                                                className="font-mono text-[12px] w-[34px] text-right flex-shrink-0"
                                                                style={{ color: barColor }}
                                                            >
                                                                {y}%
                                                            </span>
                                                        )}
                                                    <div className="flex-1 h-[3px] rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                                                        {y > 0 && (
                                                            <div
                                                                className="h-full rounded-full transition-all duration-500"
                                                                style={{ width: `${y}%`, background: barColor }}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="text-right px-4 font-mono text-[12px]" style={{
                                                color: (m.total_volume || 0) > 0 ? "#CCFF00" : "rgba(255,255,255,0.3)"
                                            }}>
                                                {(m.total_volume || 0) > 0 ? `$${fmt(m.total_volume)}` : '$0'}
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile картки */}
                        <div className="lg:hidden space-y-3 p-4">
                            {markets.length === 0 ? (
                                <div className="text-center font-mono text-xs py-8" style={{ color: "rgba(204,255,0,0.3)" }}>
                                    Waiting for market data...
                                </div>
                            ) : markets.map((m) => {
                                const y = Math.round((m.current_prices?.yes_price || 0) * 100);
                                const isHigh = y >= 70;
                                const isLow = y <= 30;
                                const barColor = isHigh ? "#CCFF00" : isLow ? "#ff4f4f" : "#4ade80";
                                const isOpen = m.status !== 'closed' && m.status !== 'resolved';

                                return (
                                    <div
                                        key={m.id}
                                        className={`border rounded-lg p-4 transition-colors ${
                                            isOpen ? 'border-white/20' : 'border-white/10 opacity-50'
                                        }`}
                                        style={{ background: "rgba(0,0,0,0.3)" }}
                                    >
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span
                                                        className={`text-[9px] uppercase border px-1.5 py-0.5 font-mono tracking-wide rounded-sm ${
                                                            isOpen 
                                                                ? "text-green-400 border-green-400/60" 
                                                                : "text-red-400 border-red-400/60"
                                                        }`}
                                                    >
                                                        {isOpen ? "OPEN" : "CLOSED"}
                                                    </span>
                                                    <span className={`text-[9px] uppercase border px-1.5 py-0.5 font-mono tracking-wide rounded-sm ${catColors[m.category] || "text-white/40 border-white/20"}`}>
                                                        {m.category}
                                                    </span>
                                                </div>
                                                <div className="text-sm font-mono" style={{ color: "rgba(255,255,255,0.85)" }}>
                                                    {m.criteria}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Probability */}
                                        {y > 0 && (
                                            <div className="mb-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span
                                                        className="font-mono text-[12px]"
                                                        style={{ color: barColor }}
                                                    >
                                                        {y}%
                                                    </span>
                                                </div>
                                                <div className="h-[3px] rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{ width: `${y}%`, background: barColor }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Volume */}
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>Volume</span>
                                            <span className="font-mono text-sm" style={{
                                                color: (m.total_volume || 0) > 0 ? "#CCFF00" : "rgba(255,255,255,0.3)"
                                            }}>
                                                {(m.total_volume || 0) > 0 ? `$${fmt(m.total_volume)}` : '$0'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ── SIDEBAR ── */}
                <aside
                    className="hidden lg:flex flex-col row-span-2 overflow-y-auto"
                    style={{ borderLeft: "1px solid rgba(204,255,0,0.1)" }}
                >
                    <SectionHeader label="Metrics" />

                    <div className="p-4 flex flex-col gap-1">
                        <MetricsGroup>
                            <MetricRow label="Active" value={metrics?.active_markets ?? "—"} accent />
                            <MetricRow label="Closed" value={metrics?.closed_markets ?? "—"} />
                            <MetricRow label="Resolved" value={metrics?.resolved_markets ?? "—"} />
                            <MetricRow label="Voided" value={metrics?.voided_markets ?? "—"} />
                            <MetricRow label="Anchored" value={metrics?.anchored_markets ?? "—"} />
                        </MetricsGroup>

                        <Divider />

                        <MetricsGroup>
                            <MetricRow label="Vault" value={`$${fmt(metrics?.vault_balance_usdc)}`} accent />
                            <MetricRow label="Treasury" value={`$${fmt(metrics?.treasury_balance_usdc)}`} />
                            <MetricRow label="Utilization" value={metrics?.vault_utilization?.toFixed(5) ?? "—"} />
                            <MetricRow label="Net PnL" value={`$${fmt(metrics?.vault_net_pnl_usdc)}`} pnl />
                        </MetricsGroup>

                        <Divider />

                        <MetricsGroup>
                            <MetricRow label="Users" value={metrics?.total_users ?? "—"} />
                            <MetricRow label="Volume" value={`$${fmt(metrics?.total_usdc_bet)}`} accent />
                            <MetricRow label="Payouts" value={`$${fmt(metrics?.vault_payout_to_winners_usdc)}`} />
                            <MetricRow label="Losses" value={`$${fmt(metrics?.user_losses_usdc)}`} />
                        </MetricsGroup>
                    </div>
                </aside>

                {/* ── POSITIONS FEED ── */}
                <section
                    className="flex flex-col min-h-0 lg:border-t"
                    style={{ borderColor: "rgba(204,255,0,0.1)" }}
                >
                    <SectionHeader label="Positions" accent="Live" />

                    <div className="flex-1 overflow-y-auto">
                        {/* Desktop таблиця */}
                        <div className="hidden lg:block">
                            {positions.length === 0 ? (
                                <div className="px-4 py-6 text-center font-mono text-xs" style={{ color: "rgba(204,255,0,0.3)" }}>
                                    No positions yet...
                                </div>
                            ) : positions.slice(0, 20).map((p) => (
                                <div
                                    key={p.id}
                                    className="grid grid-cols-[44px_1fr_72px_38px] items-center px-4 py-1.5 text-[12px]"
                                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                                >
                                    <div
                                        className="font-mono font-medium text-[10px] tracking-wider"
                                        style={{ color: p.side === "yes" ? "#CCFF00" : "#ff5252" }}
                                    >
                                        {p.side.toUpperCase()}
                                    </div>

                                    <div className="truncate" style={{ color: "rgba(255,255,255,0.7)" }}>
                                        {p.market_criteria}
                                    </div>

                                    <div className="text-right font-mono" style={{ color: "#CCFF00" }}>
                                        ${fmt(p.amount)}
                                    </div>

                                    <div className="text-right font-mono text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                                        <TimeAgo timestamp={p.timestamp} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Mobile картки */}
                        <div className="lg:hidden space-y-2 p-4">
                            {positions.length === 0 ? (
                                <div className="text-center font-mono text-xs py-6" style={{ color: "rgba(204,255,0,0.3)" }}>
                                    No positions yet...
                                </div>
                            ) : positions.slice(0, 20).map((p) => (
                                <div
                                    key={p.id}
                                    className="border border-white/20 rounded-lg p-3"
                                    style={{ background: "rgba(0,0,0,0.3)" }}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div
                                            className="font-mono font-medium text-[10px] tracking-wider"
                                            style={{ color: p.side === "yes" ? "#CCFF00" : "#ff5252" }}
                                        >
                                            {p.side.toUpperCase()}
                                        </div>
                                        <div className="text-right font-mono" style={{ color: "#CCFF00" }}>
                                            ${fmt(p.amount)}
                                        </div>
                                    </div>
                                    <div className="text-xs font-mono truncate" style={{ color: "rgba(255,255,255,0.7)" }}>
                                        {p.market_criteria}
                                    </div>
                                    <div className="text-right font-mono text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
                                        <TimeAgo timestamp={p.timestamp} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {/* pulse animation */}
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        </div>
    );
}

/* ─── Sub-components ─── */

const HeaderStat = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div
        className="px-4 flex flex-col justify-center h-full"
        style={{ borderRight: "1px solid rgba(204,255,0,0.1)" }}
    >
        <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</span>
        <span className="text-[13px] font-mono font-medium text-white">{value}</span>
    </div>
);

const SectionHeader = ({ label, accent }: { label: string; accent?: string }) => (
    <div
        className="px-4 h-8 flex items-center flex-shrink-0 text-[10px] font-mono uppercase tracking-widest"
        style={{ borderBottom: "1px solid rgba(204,255,0,0.1)", color: "rgba(255,255,255,0.35)" }}
    >
        {label}
        {accent && <span className="ml-1.5" style={{ color: "#CCFF00" }}>{accent}</span>}
    </div>
);

const MetricsGroup = ({ children }: { children: React.ReactNode }) => (
    <div className="flex flex-col gap-3 py-2">{children}</div>
);

const Divider = () => (
    <div className="my-1" style={{ borderTop: "1px solid rgba(204,255,0,0.08)" }} />
);

const MetricRow = ({
                       label,
                       value,
                       accent,
                       pnl,
                   }: {
    label: string;
    value: React.ReactNode;
    accent?: boolean;
    pnl?: boolean;
}) => {
    const valStr = String(value);
    const isNeg = pnl && valStr.startsWith("-");
    const color = accent
        ? "#CCFF00"
        : pnl
            ? isNeg ? "#ff5252" : "#4ade80"
            : "rgba(255,255,255,0.85)";

    return (
        <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>
                {label}
            </span>
            <span className="text-[15px] font-mono font-medium" style={{ color }}>
                {value}
            </span>
        </div>
    );
};

const TimeAgo = ({ timestamp }: { timestamp: number }) => {
    const [ago, setAgo] = useState(() => {
        const now = Date.now();
        const diff = timestamp < 10000000000 ? now - timestamp * 1000 : now - timestamp;
        return Math.max(0, Math.floor(diff / 1000));
    });
    useEffect(() => {
        const id = setInterval(() => {
            const now = Date.now();
            const diff = timestamp < 10000000000 ? now - timestamp * 1000 : now - timestamp;
            setAgo(Math.max(0, Math.floor(diff / 1000)));
        }, 1000);
        return () => clearInterval(id);
    }, [timestamp]);

    if (ago < 60) return <>{ago}s</>;
    if (ago < 3600) return <>{Math.floor(ago / 60)}m</>;
    if (ago < 86400) return <>{Math.floor(ago / 3600)}h</>;
    return <>{Math.floor(ago / 86400)}d</>;
};
