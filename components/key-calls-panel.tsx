"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { fetcher } from "../lib/fetcher";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Stat = {
  id: number;
  keyPreview: string;
  callCount: number;
  successCount: number;
  failureCount: number;
  successRate: number | null;
  lastCallAt: number | null;
};

function formatTimestamp(ts: number | null) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

export default function KeyCallsPanel() {
  const { data, error, isLoading } = useSWR<Stat[]>(
    "/api/keys/call-stats",
    fetcher,
    { refreshInterval: 5000, revalidateOnFocus: true },
  );

  const stats = Array.isArray(data) ? data : [];

  // Sorting and filtering
  const [sortKey, setSortKey] = useState<keyof Stat>("callCount");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filter, setFilter] = useState<
    "all" | "failures" | "unused" | "recent" | "lowRate"
  >("all");
  const [search, setSearch] = useState("");

  const sorted = useMemo(() => {
    return [...stats].sort((a, b) => {
      const v1 = a[sortKey] ?? 0;
      const v2 = b[sortKey] ?? 0;
      if (sortDir === "asc") return v1 > v2 ? 1 : -1;
      return v1 < v2 ? 1 : -1;
    });
  }, [stats, sortKey, sortDir]);

  const filtered = useMemo(() => {
    return sorted.filter((s) => {
      if (search && !s.keyPreview.includes(search)) return false;

      if (filter === "failures") return s.failureCount > 0;
      if (filter === "unused") return s.callCount === 0;
      if (filter === "recent")
        return s.lastCallAt && Date.now() - s.lastCallAt < 60_000 * 60;
      if (filter === "lowRate")
        return s.successRate !== null && s.successRate < 80;

      return true;
    });
  }, [sorted, filter, search]);

  const toggleSort = (key: keyof Stat) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  // Summary cards
  const summary = useMemo(() => {
    const total = stats.reduce((a, s) => a + s.callCount, 0);
    const success = stats.reduce((a, s) => a + s.successCount, 0);
    const failure = stats.reduce((a, s) => a + s.failureCount, 0);
    const rate =
      success + failure > 0
        ? ((success / (success + failure)) * 100).toFixed(1)
        : "—";
    return { total, success, failure, rate };
  }, [stats]);

  return (
    <Card className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">API Key Call Monitor</h2>
        <span className="text-sm text-gray-500">Auto-refresh every 5s</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 text-center">
          <div className="text-2xl font-semibold">{summary.total}</div>
          <div className="text-sm text-gray-500">Total Calls</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-semibold text-green-700">
            {summary.success}
          </div>
          <div className="text-sm text-gray-500">Success</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-semibold text-red-700">
            {summary.failure}
          </div>
          <div className="text-sm text-gray-500">Failures</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-semibold">{summary.rate}%</div>
          <div className="text-sm text-gray-500">Avg Success Rate</div>
        </Card>
      </div>

      {/* Filter + Search */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Input
          placeholder="Search key…"
          className="w-48"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          variant={filter === "failures" ? "default" : "outline"}
          onClick={() => setFilter("failures")}
        >
          Has Failures
        </Button>
        <Button
          variant={filter === "unused" ? "default" : "outline"}
          onClick={() => setFilter("unused")}
        >
          Unused
        </Button>
        <Button
          variant={filter === "recent" ? "default" : "outline"}
          onClick={() => setFilter("recent")}
        >
          Recent (1h)
        </Button>
        <Button
          variant={filter === "lowRate" ? "default" : "outline"}
          onClick={() => setFilter("lowRate")}
        >
          Low Success Rate
        </Button>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto mt-2">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              {[
                ["keyPreview", "Key"],
                ["callCount", "Total"],
                ["successCount", "Success"],
                ["failureCount", "Failures"],
                ["successRate", "Success Rate"],
                ["lastCallAt", "Last Call"],
              ].map(([key, label]) => (
                <th
                  key={key}
                  className="py-2 pr-4 cursor-pointer select-none"
                  onClick={() => toggleSort(key as keyof Stat)}
                >
                  {label}
                  {sortKey === key && (sortDir === "asc" ? " ↑" : " ↓")}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500">
                  No data matched.
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const isRecent =
                  row.lastCallAt && Date.now() - row.lastCallAt < 60_000;
                const isBad = row.successRate !== null && row.successRate < 70;
                return (
                  <tr
                    key={row.id}
                    className={`border-t border-gray-200 ${
                      isBad ? "bg-red-50" : isRecent ? "bg-green-50" : ""
                    }`}
                  >
                    <td className="py-2 pr-4 font-mono text-gray-900">
                      {row.keyPreview}
                    </td>
                    <td className="py-2 pr-4">{row.callCount}</td>
                    <td className="py-2 pr-4 text-green-700">
                      {row.successCount}
                    </td>
                    <td className="py-2 pr-4 text-red-700">
                      {row.failureCount}
                    </td>
                    <td className="py-2 pr-4">
                      {row.successRate !== null ? `${row.successRate}%` : "—"}
                    </td>
                    <td className="py-2">{formatTimestamp(row.lastCallAt)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
