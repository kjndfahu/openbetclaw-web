'use client'

import React, { useEffect, useState, useMemo } from "react";

interface CatColors {
    crypto: string;
    finance: string;
    sports: string;
    politics: string;
    custom: string;
    [key: string]: string;
}

const catColors: CatColors = {
    crypto: "text-yellow-400 border-yellow-400",
    finance: "text-blue-400 border-blue-400",
    sports: "text-green-400 border-green-400",
    politics: "text-red-400 border-red-400",
    custom: "text-purple-400 border-purple-400",
};

const fmt = (n: number | string | undefined | null) => (n === 0 ? 0 : n ? Number(n).toFixed(0) : "-");

interface Market {
    id: string;
    criteria: string;
    category: string;
    current_prices?: {
        yes_price?: number;
    };
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

    useEffect(() => {
        let ws: WebSocket | undefined;

        const connect = () => {
            ws = new WebSocket("ws://10.44.44.25:8765");

            ws!.onopen = () => {
                console.log("WS connected");

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

                    default:
                        console.log("WS message:", msg);
                }
            };

            ws!.onclose = () => {
                console.log("WS disconnected, reconnecting...");
                setTimeout(connect, 2000);
            };

            ws!.onerror = (err) => {
                console.error("WS error", err);
                if (ws) ws!.close();
            };
        };

        connect();

        return () => {
            if (ws) ws.close();
        };
    }, []);

    return (
        <div className="bg-black text-white/70 text-sm h-screen flex flex-col w-full overflow-hidden">

            {/* HEADER */}
            <div className="flex h-10 border-b border-white/10 flex-shrink-0">
                <div className="px-4 flex items-center border-r border-white/10 font-mono text-[10px] tracking-widest text-white whitespace-nowrap">
                    OC/<span className="text-yellow-400">AGENT</span>
                </div>

                <Stat label="Open Markets" value={markets.length} />
                <Stat label="Positions" value={positions.length} />

                <div className="flex-1" />

                <div className="flex items-center gap-2 px-4 text-green-400 text-[10px] font-mono">
                    <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                    LIVE
                </div>
            </div>

            {/* MAIN */}
            <div className="grid grid-cols-[1fr_300px] grid-rows-[1fr_auto] flex-1 min-h-0">

                {/* MARKETS */}
                <div className="bg-black flex flex-col min-h-0">

                    <div className="px-3 h-7 flex items-center border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-white/40 flex-shrink-0">
                        Markets <span className="text-yellow-400 ml-1">Live</span>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full table-fixed">
                            <thead className="text-[10px] text-white/40 font-mono sticky top-0 bg-black z-10">
                            <tr>
                                <th className="text-left px-3 py-2 w-[220px]">Event</th>
                                <th className="w-[80px]">Cat</th>
                                <th className="w-[180px]">Price</th>
                                <th className="px-3 w-[100px]">Volume</th>
                            </tr>
                            </thead>

                            <tbody>
                            {markets.map((m) => {
                                const y = Math.round((m.current_prices?.yes_price || 0) * 100);

                                return (
                                    <tr key={m.id} className="border-b border-white/10 hover:bg-white/5">
                                        <td className="px-3 py-2 truncate">{m.criteria}</td>

                                        <td className="text-center">
                                                <span className={`text-[9px] uppercase border px-1 ${catColors[m.category]}`}>
                                                    {m.category}
                                                </span>
                                        </td>

                                        <td>
                                            <div className="flex items-center gap-2">
                                                <span className="text-green-400 font-mono w-[30px]">{y}%</span>
                                                <div className="flex-1 h-[3px] bg-white/10">
                                                    <div className="h-full bg-green-400" style={{ width: `${y}%` }} />
                                                </div>
                                            </div>
                                        </td>

                                        <td className="text-center px-3 text-yellow-400 font-mono">
                                            ${fmt(m.total_volume)}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* SIDEBAR */}
                <div className="bg-black flex flex-col p-4 gap-3 border-l border-white/10 row-span-2 w-[300px]">

                    <StatBlock label="Active" value={metrics?.active_markets ?? "-"} />
                    <StatBlock label="Closed" value={metrics?.closed_markets ?? "-"} />
                    <StatBlock label="Resolved" value={metrics?.resolved_markets ?? "-"} />
                    <StatBlock label="Voided" value={metrics?.voided_markets ?? "-"} />
                    <StatBlock label="Anchored" value={metrics?.anchored_markets ?? "-"} />

                    <div className="border-t border-white/10 my-2" />

                    <StatBlock label="Vault" value={`$${fmt(metrics?.vault_balance_usdc)}`} />
                    <StatBlock label="Treasury" value={`$${fmt(metrics?.treasury_balance_usdc)}`} />
                    <StatBlock label="Utilization" value={metrics?.vault_utilization ?? "-"} />
                    <StatBlock label="PnL" value={`$${fmt(metrics?.vault_net_pnl_usdc)}`} />

                    <div className="border-t border-white/10 my-2" />

                    <StatBlock label="Users" value={metrics?.total_users ?? "-"} />
                    <StatBlock label="Volume" value={`$${fmt(metrics?.total_usdc_bet)}`} />
                    <StatBlock label="Payouts" value={`$${fmt(metrics?.vault_payout_to_winners_usdc)}`} />
                    <StatBlock label="Losses" value={`$${fmt(metrics?.user_losses_usdc)}`} />
                </div>

                {/* FEED */}
                <div className="bg-black flex flex-col border-t border-white/10 h-[250px]">

                    <div className="px-3 h-7 flex items-center border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-white/40 flex-shrink-0">
                        Positions <span className="text-yellow-400 ml-1">Live</span>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {positions.slice(0, 20).map((p) => (
                            <div
                                key={p.id}
                                className="grid grid-cols-[40px_1fr_60px_36px] px-3 py-1 border-b border-white/10 text-sm"
                            >
                                <div className={p.side === "yes" ? "text-green-400 font-mono" : "text-red-400 font-mono"}>
                                    {p.side.toUpperCase()}
                                </div>

                                <div className="truncate">{p.market_criteria}</div>

                                <div className="text-yellow-400 text-right font-mono">
                                    ${fmt(p.amount)}
                                </div>

                                <div className="text-white/30 text-right">
                                    <TimeAgo timestamp={p.timestamp} />
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
}

const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="px-3 flex flex-col justify-center border-r border-white/10 whitespace-nowrap">
        <span className="text-[10px] text-white/40 font-mono uppercase">{label}</span>
        <span className="text-sm font-mono text-white">{value}</span>
    </div>
);

const TimeAgo = ({ timestamp }: { timestamp: number }) => {
    const [timeAgo, setTimeAgo] = useState(() => Math.round(Date.now() / 1000 - timestamp));
    
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeAgo(Math.round(Date.now() / 1000 - timestamp));
        }, 1000);
        
        return () => clearInterval(interval);
    }, [timestamp]);
    
    return <>{timeAgo}s</>;
};

const StatBlock = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
        <div className="text-[10px] text-white/40 font-mono uppercase">{label}</div>
        <div className="text-xl font-mono text-white">{value}</div>
    </div>
);
