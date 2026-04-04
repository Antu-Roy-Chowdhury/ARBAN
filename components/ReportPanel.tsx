"use client";

import { Report, ImageMetadata } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface ReportPanelProps {
  reports: Report[];
  images: ImageMetadata[];
  isLoading?: boolean;
}

const ABNORMALITY_KEYWORDS = [
  "fracture",
  "break",
  "lesion",
  "abnormal",
  "abnormality",
  "disease",
  "displacement",
  "dislocation",
  "subluxation",
  "inflammation",
  "edema",
  "swelling",
  "hemorrhage",
  "bleed",
  "mass",
  "tumor",
  "cancer",
  "malignancy",
  "metastasis",
  "nodule",
  "cyst",
  "foreign body",
  "artifact",
  "lucency",
  "opacity",
  "infiltrate",
  "consolidation",
  "pneumothorax",
  "effusion",
  "ascites",
  "stenosis",
  "occlusion",
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text: string, bodyParts: string[]) {
  if (!text) return <></>;

  let result = text;
  const bodyPartMatches: { text: string; index: number }[] = [];
  const abnormalityMatches: { text: string; index: number }[] = [];

  bodyParts.forEach((part) => {
    const regex = new RegExp(`\\b${escapeRegExp(part)}\\b`, "gi");
    let match;
    while ((match = regex.exec(text)) !== null) {
      bodyPartMatches.push({ text: match[0], index: match.index });
    }
  });

  ABNORMALITY_KEYWORDS.forEach((keyword) => {
    const regex = new RegExp(`\\b${escapeRegExp(keyword)}s?\\b`, "gi");
    let match;
    while ((match = regex.exec(text)) !== null) {
      const isAlreadyHighlighted = bodyPartMatches.some(
        (item) => item.index == match!.index
      );
      if (!isAlreadyHighlighted) {
        abnormalityMatches.push({ text: match[0], index: match.index });
      }
    }
  });

  const replacements = [
    ...bodyPartMatches.map((item) => ({ ...item, type: "bodyPart" })),
    ...abnormalityMatches.map((item) => ({ ...item, type: "abnormality" })),
  ].sort((a, b) => b.index - a.index);

  replacements.forEach(({ text: matchText, index, type }) => {
    const before = result.substring(0, index);
    const after = result.substring(index + matchText.length);
    const replacement =
      type === "bodyPart"
        ? `<mark class="bg-blue-200 font-semibold">${matchText}</mark>`
        : `<mark class="bg-red-200 font-semibold">${matchText}</mark>`;
    result = before + replacement + after;
  });

  return (
    <div
      dangerouslySetInnerHTML={{ __html: result }}
      className="prose prose-sm max-w-none"
    />
  );
}

export function ReportPanel({
  reports,
  images,
  isLoading = false,
}: ReportPanelProps) {
  const [activeTab, setActiveTab] = useState<"findings" | "impression" | "report">(
    "report"
  );
  const [selectedReportIndex, setSelectedReportIndex] = useState(0);

  useEffect(() => {
    setSelectedReportIndex(0);
  }, [reports.length]);

  const bodyParts = Array.from(
    new Set(
      images
        .map((img) => img.body_part_clean)
        .filter((part): part is string => Boolean(part))
    )
  );

  if (isLoading) {
    return (
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Report Data</h2>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
        </div>
      </Card>
    );
  }

  if (reports.length === 0) {
    return (
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Report Data</h2>
        <p className="text-gray-500 text-sm">No report data available</p>
      </Card>
    );
  }

  const selectedReport = reports[Math.min(selectedReportIndex, reports.length - 1)];

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Report Data</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {reports.length} report{reports.length > 1 ? "s" : ""}
        </span>
      </div>

      {selectedReport.has_missing_impression && (
        <div className="mb-3 rounded border border-orange-300 bg-orange-100 p-2 text-sm text-orange-800">
          Missing impression section in selected report
        </div>
      )}

      {reports.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {reports.map((report, index) => (
            <button
              key={report.id}
              onClick={() => setSelectedReportIndex(index)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedReportIndex === index
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {report.report_title?.trim() || `Report ${index + 1}`}
            </button>
          ))}
        </div>
      )}

      <div className="mb-4 flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("report")}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "report"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Report
        </button>
        <button
          onClick={() => setActiveTab("findings")}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "findings"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Findings
        </button>
        <button
          onClick={() => setActiveTab("impression")}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "impression"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Impression
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-3 text-xs text-slate-500">
        {selectedReport.report_title && <span>Title: {selectedReport.report_title}</span>}
        {selectedReport.created_at && (
          <span>Created: {new Date(selectedReport.created_at).toLocaleString()}</span>
        )}
        {selectedReport.patient_name && <span>Patient: {selectedReport.patient_name}</span>}
      </div>

      <div className="max-h-72 overflow-y-auto rounded bg-gray-50 p-3 text-sm leading-relaxed">
        {activeTab === "findings" && (
          <div>
            {selectedReport.findings_text ? (
              highlightText(selectedReport.findings_text, bodyParts)
            ) : (
              <p className="text-gray-500">No findings available</p>
            )}
          </div>
        )}
        {activeTab === "impression" && (
          <div>
            {selectedReport.impression_text ? (
              highlightText(selectedReport.impression_text, bodyParts)
            ) : (
              <p className="text-gray-500">No impression available</p>
            )}
          </div>
        )}
        {activeTab === "report" && (
          <div>
            {selectedReport.raw_text ? (
              highlightText(selectedReport.raw_text, bodyParts)
            ) : (
              <p className="text-gray-500">No raw report text available</p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
