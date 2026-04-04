"use client";

import { ImageMetadata } from "@/lib/supabase";
import { Card } from "@/components/ui/card";

interface DicomMetadataPanelProps {
  images: ImageMetadata[];
  selectedImageId?: number;
  isLoading?: boolean;
}

export function DicomMetadataPanel({
  images,
  selectedImageId,
  isLoading = false,
}: DicomMetadataPanelProps) {
  const selectedImage = images.find((img) => img.id === selectedImageId) || images[0];

  if (isLoading) {
    return (
      <Card className="p-4">
        <h2 className="mb-4 text-lg font-semibold">DICOM Metadata</h2>
        <div className="space-y-3">
          <div className="h-4 animate-pulse rounded bg-gray-200" />
          <div className="h-4 animate-pulse rounded bg-gray-200" />
          <div className="h-4 animate-pulse rounded bg-gray-200" />
        </div>
      </Card>
    );
  }

  if (!selectedImage) {
    return (
      <Card className="p-4">
        <h2 className="mb-4 text-lg font-semibold">DICOM Metadata</h2>
        <p className="text-sm text-gray-500">No image selected</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h2 className="mb-4 text-lg font-semibold">DICOM Metadata</h2>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-600">File Name:</span>
          <span className="max-w-[60%] truncate font-mono text-xs">
            {selectedImage.file_name || "N/A"}
          </span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-600">Body Part:</span>
          <span className="font-semibold">{selectedImage.body_part_clean || "N/A"}</span>
        </div>
        {selectedImage.has_missing_body_part && (
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600">Raw Body Part:</span>
            <span className="text-orange-600">{selectedImage.body_part_raw || "N/A"}</span>
          </div>
        )}
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-600">View:</span>
          <span>{selectedImage.view_position || "N/A"}</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-600">Modality:</span>
          <span className="font-semibold">{selectedImage.modality || "N/A"}</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-600">Study Date:</span>
          <span className="font-mono text-xs">{selectedImage.study_date || "N/A"}</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-600">Series:</span>
          <span className="max-w-[60%] text-right text-xs">
            {selectedImage.series_description || "N/A"}
          </span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-600">Image #:</span>
          <span>{selectedImage.instance_number ?? "N/A"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Dimensions:</span>
          <span className="font-mono text-xs">
            {selectedImage.rows ?? "?"} x {selectedImage.columns ?? "?"}
          </span>
        </div>
      </div>
    </Card>
  );
}
