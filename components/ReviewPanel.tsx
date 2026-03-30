"use client";

import { Review } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ReviewPanelProps {
  review: Review | null;
  patientId: number;
  imageId: number;
  onSubmit?: (review: Omit<Review, "id" | "reviewed_at">) => Promise<void>;
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
  patientId,
  imageId,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: ReviewPanelProps) {
  const [formData, setFormData] = useState({
    status: (review?.status || "unsure") as typeof STATUS_OPTIONS[number],
    label: (review?.label || "normal") as typeof LABEL_OPTIONS[number],
    final_impression: review?.final_impression || "",
    notes: review?.notes || "",
    reviewer_name: review?.reviewer_name || "Kawser",
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      await onSubmit?.({
        patient_id: patientId,
        image_id: imageId,
        ...formData,
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
        <h2 className="text-lg font-semibold mb-4">Review Submission</h2>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">Review Submission</h2>

      {review && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          <p className="text-blue-900">
            <span className="font-semibold">Last review:</span> {new Date(review.reviewed_at).toLocaleString()}
          </p>
        </div>
      )}

      {submitSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-300 rounded text-sm text-green-800">
          ✓ Review submitted successfully
        </div>
      )}

      {submitError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded text-sm text-red-800">
          ✗ {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Status */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Report Match Status
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

        {/* Label */}
        <div>
          <label className="block text-sm font-semibold mb-2">Finding</label>
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

        {/* Final Impression */}
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

        {/* Notes */}
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

        {/* Reviewer Name */}
        <div>
          <label htmlFor="reviewer" className="block text-sm font-semibold mb-2">
            Reviewer Name
          </label>
          <input
            id="reviewer"
            type="text"
            value={formData.reviewer_name}
            onChange={(e) =>
              setFormData({ ...formData, reviewer_name: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your name"
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </Button>
      </form>
    </Card>
  );
}
