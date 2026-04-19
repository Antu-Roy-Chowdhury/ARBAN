"use client";

import { useEffect, useState } from "react";
import { Review, SecondPassReview } from "@/lib/supabase";
import { formatBangladeshDateTime } from "@/lib/datetime";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ReviewPanelProps {
  review: Review | null;
  secondPassReview: SecondPassReview | null;
  patientId: string;
  imageId: number | null;
  onSubmit?: (review: Omit<SecondPassReview, "id" | "reviewed_at">) => Promise<void>;
  isLoading?: boolean;
  isSubmitting?: boolean;
}

const STATUS_OPTIONS = ["matched", "mismatch", "unsure"] as const;
const LABEL_OPTIONS = ["normal", "abnormal"] as const;

const STATUS_COLORS = {
  matched: "bg-green-100 text-green-800 border-green-300",
  mismatch: "bg-red-100 text-red-800 border-red-300",
  unsure: "bg-yellow-100 text-yellow-800 border-yellow-300",
};

const LABEL_COLORS = {
  normal: "bg-green-100 text-green-800 border-green-300",
  abnormal: "bg-red-100 text-red-800 border-red-300",
};

export function ReviewPanel({
  review,
  secondPassReview,
  patientId,
  imageId,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: ReviewPanelProps) {
  const [formData, setFormData] = useState({
    status: "unsure" as typeof STATUS_OPTIONS[number],
    label: "normal" as typeof LABEL_OPTIONS[number],
    final_impression: "",
    notes: "",
    reviewer2_name: secondPassReview?.reviewer2_name || "Siyam",
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitMode, setSubmitMode] = useState<"approved" | "corrected" | null>(null);

  useEffect(() => {
    setFormData({
      status: (secondPassReview?.status || review?.status || "unsure") as typeof STATUS_OPTIONS[number],
      label: (secondPassReview?.label || review?.label || "normal") as typeof LABEL_OPTIONS[number],
      final_impression: secondPassReview?.final_impression || review?.final_impression || "",
      notes: secondPassReview?.notes || review?.notes || "",
      reviewer2_name: secondPassReview?.reviewer2_name || "Siyam",
    });
    setSubmitError(null);
    setSubmitSuccess(false);
    setSubmitMode(null);
  }, [review, secondPassReview, patientId]);

  const originalReviewValues = review
    ? {
        status: review.status,
        label: review.label,
        final_impression: review.final_impression || "",
        notes: review.notes || "",
      }
    : null;

  const handleSubmit = async (
    e: React.FormEvent,
    reviewDecision: "approved" | "corrected"
  ) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);
    setSubmitMode(reviewDecision);

    if (!patientId) {
      setSubmitError("Missing patient ID");
      return;
    }

    if (!review) {
      setSubmitError("First review not found. Second verification needs an existing first review.");
      return;
    }

    try {
      await onSubmit?.({
        source_review_id: review.id,
        patient_id: patientId,
        image_id: imageId,
        review_decision: reviewDecision,
        status:
          reviewDecision === "approved"
            ? review.status
            : formData.status,
        label:
          reviewDecision === "approved"
            ? review.label
            : formData.label,
        final_impression:
          reviewDecision === "approved"
            ? review.final_impression
            : formData.final_impression,
        notes:
          reviewDecision === "approved"
            ? review.notes
            : formData.notes,
        reviewer2_name: formData.reviewer2_name || "Siyam",
      });
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to submit review"
      );
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Second Verification</h2>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">Second Verification</h2>

      {review && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="font-semibold text-blue-950">1st Reviewer Submission</p>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-blue-800 ring-1 ring-blue-200">
              {review.status} / {review.label}
            </span>
          </div>
          <p className="text-blue-900">
            <span className="font-semibold">Reviewer:</span> {review.reviewer_name || "Unknown"}
          </p>
          <p className="text-blue-900">
            <span className="font-semibold">Reviewed at:</span> {formatBangladeshDateTime(review.reviewed_at)}
          </p>
          {review.final_impression && (
            <p className="mt-2 text-blue-900">
              <span className="font-semibold">Impression:</span> {review.final_impression}
            </p>
          )}
          {review.notes && (
            <p className="mt-2 text-blue-900">
              <span className="font-semibold">Notes:</span> {review.notes}
            </p>
          )}
        </div>
      )}

      {secondPassReview && (
        <div className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
          <p>
            <span className="font-semibold">Latest 2nd review:</span> {secondPassReview.review_decision} by{" "}
            {secondPassReview.reviewer2_name} at {formatBangladeshDateTime(secondPassReview.reviewed_at)}
          </p>
        </div>
      )}

      {submitSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-300 rounded text-sm text-green-800">
          Second verification saved successfully
        </div>
      )}

      {submitError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded text-sm text-red-800">
          {submitError}
        </div>
      )}

      {!review && (
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          First review not found for this patient yet. Complete the first review before starting second verification.
        </div>
      )}

      <form className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Report Match Status for 2nd Review
          </label>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFormData({ ...formData, status })}
                className={`px-3 py-2 rounded text-sm font-medium border transition-all ${
                  formData.status === status
                    ? STATUS_COLORS[status]
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Finding for 2nd Review</label>
          <div className="flex gap-2">
            {LABEL_OPTIONS.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setFormData({ ...formData, label })}
                className={`px-3 py-2 rounded text-sm font-medium border transition-all ${
                  formData.label === label
                    ? LABEL_COLORS[label]
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {label.charAt(0).toUpperCase() + label.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="impression" className="block text-sm font-semibold mb-2">
            Final Impression
          </label>
          <textarea
            id="impression"
            value={formData.final_impression}
            onChange={(e) =>
              setFormData({ ...formData, final_impression: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="Enter your final impression..."
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-semibold mb-2">
            Additional Notes
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="Add any notes..."
          />
        </div>

        <div>
          <label htmlFor="reviewer2" className="block text-sm font-semibold mb-2">
            2nd Reviewer Name
          </label>
          <input
            id="reviewer2"
            type="text"
            value={formData.reviewer2_name}
            onChange={(e) =>
              setFormData({ ...formData, reviewer2_name: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your name"
          />
        </div>

        {originalReviewValues && (
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                ...originalReviewValues,
              }))
            }
            className="w-full border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
          >
            Reset to 1st Review Values
          </Button>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            disabled={isSubmitting || !review}
            onClick={(e) => handleSubmit(e, "approved")}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {isSubmitting && submitMode === "approved"
              ? "Approving..."
              : "Approve 1st Review"}
          </Button>
          <Button
            type="button"
            disabled={isSubmitting || !review}
            onClick={(e) => handleSubmit(e, "corrected")}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {isSubmitting && submitMode === "corrected"
              ? "Saving..."
              : "Save Corrected Review"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
