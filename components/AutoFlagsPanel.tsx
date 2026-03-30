"use client";

import { Report, ImageMetadata } from "@/lib/supabase";
import { Card } from "@/components/ui/card";

interface AutoFlagsPanelProps {
  report: Report | null;
  images: ImageMetadata[];
  isLoading?: boolean;
}

export function AutoFlagsPanel({
  report,
  images,
  isLoading = false,
}: AutoFlagsPanelProps) {
  if (isLoading) {
    return (
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Auto Flags</h2>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
        </div>
      </Card>
    );
  }

  const hasMissingImpressionFlag = report?.has_missing_impression ?? false;
  const hasMissingBodyPartFlag = images.some((img) => img.has_missing_body_part);
  const totalImages = images.length;
  const imagesWithMissingBodyPart = images.filter(
    (img) => img.has_missing_body_part
  ).length;

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">Auto Flags</h2>
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded">
          <div className="w-5 h-5 rounded-full bg-orange-400 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">!</span>
          </div>
          <div>
            <div className="font-semibold text-orange-900 text-sm">
              Missing Impression
            </div>
            <div className="text-orange-700 text-xs mt-1">
              {hasMissingImpressionFlag
                ? "Report is missing impression section"
                : "Report has complete impression"}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">!</span>
          </div>
          <div>
            <div className="font-semibold text-yellow-900 text-sm">
              Missing Body Part
            </div>
            <div className="text-yellow-700 text-xs mt-1">
              {hasMissingBodyPartFlag
                ? `${imagesWithMissingBodyPart} of ${totalImages} image(s) missing body part classification`
                : "All images have body part classification"}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
