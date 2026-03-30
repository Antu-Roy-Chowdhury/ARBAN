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
        <h2 className="text-lg font-semibold mb-4">DICOM Metadata</h2>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
        </div>
      </Card>
    );
  }

  if (!selectedImage) {
    return (
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">DICOM Metadata</h2>
        <p className="text-gray-500 text-sm">No image selected</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">DICOM Metadata</h2>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-600">Body Part:</span>
          <span className="font-semibold">{selectedImage.body_part_clean}</span>
        </div>
        {selectedImage.has_missing_body_part && (
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600">Raw Body Part:</span>
            <span className="text-orange-600">{selectedImage.body_part_raw}</span>
          </div>
        )}
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-600">View:</span>
          <span>{selectedImage.view_position}</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-600">Modality:</span>
          <span className="font-semibold">{selectedImage.modality}</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-600">Study Date:</span>
          <span className="font-mono text-xs">{selectedImage.study_date}</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-600">Series:</span>
          <span className="text-xs">{selectedImage.series_description}</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-600">Image #:</span>
          <span>{selectedImage.instance_number}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Dimensions:</span>
          <span className="font-mono text-xs">
            {selectedImage.rows}×{selectedImage.columns}
          </span>
        </div>
      </div>
    </Card>
  );
}
