"use client";
import React, { useMemo } from "react";

export interface BidItem {
  amount: number;
  bidderId?: any;
  bidderName?: string;
  teamId?: any;
  timestamp: string | number;
}

interface Props {
  history: BidItem[];
  teamLabelOf?: (id: any) => string;
}

export default function BidsLeaderboard({ history, teamLabelOf }: Props) {
  const rows = useMemo(() => {
    const list = Array.isArray(history) ? [...history] : [];
    // Newest first
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return list.map((h, i) => ({ rank: i + 1, ...h }));
  }, [history]);

  const labelOf = (val: unknown): string => {
    if (val == null) return "—";
    if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") return String(val);
    // try common fields when object
    const v: any = val as any;
    const name = v?.teamName || v?.name || v?.username || v?.displayName || v?.email;
    if (typeof name === "string") return name;
    const id = v?._id || v?.id;
    if (id) return String(id);
    try { return JSON.stringify(v); } catch { return "[object]"; }
  };

  const bidderLabel = (r: BidItem) => r.bidderName ? String(r.bidderName) : labelOf(r.bidderId);
  const teamLabel = (r: BidItem) => teamLabelOf ? teamLabelOf(r.teamId) : labelOf(r.teamId);

  return (
    <div className="rounded-xl border  shadow-md overflow-hidden">
      <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
        <h3 className="font-semibold">Bids Leaderboard</h3>
        <span className="text-xs text-gray-500">Live</span>
      </div>
      <div className="max-h-64 overflow-y-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Rank</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Bidder</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Team</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Amount</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No bids yet.</td>
              </tr>
            )}
            {rows.map((r, idx) => (
              <tr key={idx} className="border-t">
                <td className="px-4 py-2 font-medium">#{r.rank}</td>
                <td className="px-4 py-2">{bidderLabel(r)}</td>
                <td className="px-4 py-2">{teamLabel(r)}</td>
                <td className="px-4 py-2 font-semibold text-emerald-700">₹ {Math.round(r.amount / 100000)} Lakh</td>
                <td className="px-4 py-2 text-gray-500">{new Date(r.timestamp).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
