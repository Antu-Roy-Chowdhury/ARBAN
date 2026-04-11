"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Pie, PieChart } from "recharts";
import { ArrowUpRight, Clock3, Filter, Search, Stethoscope } from "lucide-react";
import { ReviewQueueItem } from "@/lib/supabase";
import { BANGLADESH_TIMEZONE, formatBangladeshDateTime } from "@/lib/datetime";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ReviewStatusDashboardProps {
  queue: ReviewQueueItem[];
}

const PIE_COLORS = {
  pending: "var(--color-chart-5)",
  matched: "var(--color-chart-2)",
  mismatch: "var(--color-chart-1)",
  unsure: "var(--color-chart-4)",
} as const;

const chartConfig = {
  pending: { label: "Pending", color: PIE_COLORS.pending },
  matched: { label: "Matched", color: PIE_COLORS.matched },
  mismatch: { label: "Mismatch", color: PIE_COLORS.mismatch },
  unsure: { label: "Unsure", color: PIE_COLORS.unsure },
};

function getStatusTone(item: ReviewQueueItem) {
  if (!item.is_reviewed) {
    return "bg-amber-100 text-amber-900 ring-amber-200";
  }

  switch (item.latest_review_status) {
    case "matched":
      return "bg-emerald-100 text-emerald-900 ring-emerald-200";
    case "mismatch":
      return "bg-rose-100 text-rose-900 ring-rose-200";
    default:
      return "bg-yellow-100 text-yellow-900 ring-yellow-200";
  }
}

function getStatusLabel(item: ReviewQueueItem) {
  return item.is_reviewed ? item.latest_review_status || "reviewed" : "pending";
}

export function ReviewStatusDashboard({ queue }: ReviewStatusDashboardProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [bodyPartFilter, setBodyPartFilter] = useState("ALL");

  const bodyPartOptions = useMemo(() => {
    return Array.from(
      new Set(queue.flatMap((item) => item.body_parts))
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [queue]);

  const summary = useMemo(() => {
    const total = queue.length;
    const reviewed = queue.filter((item) => item.is_reviewed).length;
    const pending = total - reviewed;
    const matched = queue.filter((item) => item.latest_review_status === "matched").length;
    const mismatch = queue.filter((item) => item.latest_review_status === "mismatch").length;
    const unsure = queue.filter((item) => item.latest_review_status === "unsure").length;
    const completion = total === 0 ? 0 : Math.round((reviewed / total) * 100);

    return { total, reviewed, pending, matched, mismatch, unsure, completion };
  }, [queue]);

  const chartData = useMemo(
    () => [
      { name: "pending", value: summary.pending, fill: PIE_COLORS.pending },
      { name: "matched", value: summary.matched, fill: PIE_COLORS.matched },
      { name: "mismatch", value: summary.mismatch, fill: PIE_COLORS.mismatch },
      { name: "unsure", value: summary.unsure, fill: PIE_COLORS.unsure },
    ].filter((item) => item.value > 0),
    [summary]
  );

  const filteredQueue = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return queue.filter((item) => {
      const matchesSearch =
        searchTerm.length === 0 ||
        item.patient_id.toLowerCase().includes(searchTerm) ||
        (item.patient_name || "").toLowerCase().includes(searchTerm);

      const derivedStatus = item.is_reviewed
        ? item.latest_review_status || "reviewed"
        : "pending";

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "reviewed" && item.is_reviewed) ||
        derivedStatus === statusFilter;

      const matchesBodyPart =
        bodyPartFilter === "ALL" || item.body_parts.includes(bodyPartFilter);

      return matchesSearch && matchesStatus && matchesBodyPart;
    });
  }, [bodyPartFilter, queue, search, statusFilter]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#eef6ff_48%,_#ffffff_100%)]">
      <div className="mx-auto max-w-[1440px] px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex items-center rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 shadow-sm backdrop-blur">
              ARBAN Review Command Center
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
              AI-Ready Bangladesh Archive of X-ray Networks
            </h1>
            <p className="mt-3 text-sm text-slate-600 md:text-base">
              Track what&apos;s checked, what&apos;s left, and jump straight into the next patient. Fresh data is loaded on each visit, and all submission times are shown in Bangladesh time ({BANGLADESH_TIMEZONE}).
            </p>
          </div>

          <Button
            asChild
            variant="outline"
            className="h-11 border-sky-200 bg-white/90 text-sky-800 shadow-sm hover:border-sky-300 hover:bg-sky-50 hover:text-sky-950"
          >
            <Link href="/">
              Back to Review App
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-sky-200/80 bg-white/90 p-5 shadow-lg shadow-sky-100/40">
            <p className="text-sm font-medium text-slate-500">Total patients</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{summary.total}</p>
            <p className="mt-2 text-sm text-slate-600">Current review queue size</p>
          </Card>

          <Card className="border-emerald-200/80 bg-white/90 p-5 shadow-lg shadow-emerald-100/40">
            <p className="text-sm font-medium text-slate-500">Reviewed</p>
            <p className="mt-3 text-3xl font-bold text-emerald-700">{summary.reviewed}</p>
            <p className="mt-2 text-sm text-slate-600">Already checked and submitted</p>
          </Card>

          <Card className="border-amber-200/80 bg-white/90 p-5 shadow-lg shadow-amber-100/40">
            <p className="text-sm font-medium text-slate-500">Left to review</p>
            <p className="mt-3 text-3xl font-bold text-amber-700">{summary.pending}</p>
            <p className="mt-2 text-sm text-slate-600">Still waiting for review</p>
          </Card>

          <Card className="border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-300/30">
            <p className="text-sm font-medium text-slate-300">Completion</p>
            <div className="mt-3 flex items-end gap-2">
              <p className="text-3xl font-bold">{summary.completion}%</p>
              <p className="pb-1 text-sm text-slate-300">done</p>
            </div>
            <Progress value={summary.completion} className="mt-4 bg-white/15 [&_[data-slot=progress-indicator]]:bg-cyan-400" />
          </Card>
        </div>

        <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_380px]">
          <Card className="border-slate-200 bg-white/90 p-5 shadow-lg shadow-slate-100/70">
            <div className="mb-4 flex items-center gap-2 text-slate-900">
              <Filter className="h-4 w-4" />
              <h2 className="text-lg font-semibold">Filters</h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Search className="h-4 w-4" />
                  Search patient
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Patient ID or name"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Clock3 className="h-4 w-4" />
                  Review status
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                >
                  <option value="ALL">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Any reviewed</option>
                  <option value="matched">Matched</option>
                  <option value="mismatch">Mismatch</option>
                  <option value="unsure">Unsure</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Stethoscope className="h-4 w-4" />
                  Body part
                </span>
                <select
                  value={bodyPartFilter}
                  onChange={(e) => setBodyPartFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                >
                  <option value="ALL">All body parts</option>
                  {bodyPartOptions.map((part) => (
                    <option key={part} value={part}>
                      {part}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </Card>

          <Card className="border-slate-200 bg-white/90 p-5 shadow-lg shadow-slate-100/70">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-950">Queue breakdown</h2>
              <p className="text-sm text-slate-500">One glance tells you how the work is distributed.</p>
            </div>

            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square h-[260px] max-w-[260px]"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={3}
                  strokeWidth={0}
                />
              </PieChart>
            </ChartContainer>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {Object.entries(chartConfig).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-slate-700">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: value.color }}
                  />
                  <span>{value.label}</span>
                  <span className="ml-auto font-semibold text-slate-950">
                    {summary[key as keyof typeof summary] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="overflow-hidden border-slate-200 bg-white/92 shadow-xl shadow-slate-100/80">
          <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Patient queue</h2>
                <p className="text-sm text-slate-500">
                  {filteredQueue.length} patient{filteredQueue.length === 1 ? "" : "s"} shown after filters
                </p>
              </div>
              <p className="text-sm text-slate-500">Pending patients stay visually highlighted so the next task is easy to spot.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white">
                <tr className="border-b border-slate-200 text-left text-slate-600">
                  <th className="px-5 py-3 font-semibold">Patient</th>
                  <th className="px-5 py-3 font-semibold">Body Part</th>
                  <th className="px-5 py-3 font-semibold">Files</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Last reviewed</th>
                  <th className="px-5 py-3 font-semibold">Open</th>
                </tr>
              </thead>
              <tbody>
                {filteredQueue.map((item) => (
                  <tr
                    key={item.patient_id}
                    className={`border-b border-slate-100 transition hover:bg-sky-50/50 ${
                      !item.is_reviewed ? "bg-amber-50/60" : "bg-white"
                    }`}
                  >
                    <td className="px-5 py-4">
                      <p className="font-mono font-semibold text-slate-950">{item.patient_id}</p>
                      <p className="text-slate-500">{item.patient_name || "Unknown patient"}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {item.body_parts.length > 0 ? item.body_parts.join(", ") : "Unknown"}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      <span className="font-semibold text-slate-950">{item.image_count}</span> images,{" "}
                      <span className="font-semibold text-slate-950">{item.report_count}</span> reports
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusTone(item)}`}>
                        {getStatusLabel(item)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {item.latest_reviewed_at
                        ? formatBangladeshDateTime(item.latest_reviewed_at)
                        : "Not reviewed"}
                    </td>
                    <td className="px-5 py-4">
                      <Button
                        asChild
                        size="sm"
                        variant={!item.is_reviewed ? "default" : "outline"}
                        className={
                          !item.is_reviewed
                            ? "bg-sky-600 text-white hover:bg-sky-700"
                            : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                        }
                      >
                        <Link href={`/?patient=${encodeURIComponent(item.patient_id)}`}>
                          Review now
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}

                {filteredQueue.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                      No patients match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </main>
  );
}
