"use client";

import { ImageMetadata, StorageImage } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { useMemo, useState } from "react";
import { ImageModal } from "./ImageModal";

interface ImageGalleryProps {
  images: StorageImage[];
  imageMetadata: ImageMetadata[];
  selectedImageId?: number;
  onSelectImage?: (imageId: number) => void;
  isLoading?: boolean;
}

interface GalleryItem {
  storage: StorageImage;
  metadata?: ImageMetadata;
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/g, "");
}

function compareNatural(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function buildGalleryItems(images: StorageImage[], imageMetadata: ImageMetadata[]) {
  const sortedImages = [...images].sort((a, b) => compareNatural(a.name, b.name));
  const sortedMetadata = [...imageMetadata].sort(
    (a, b) => a.instance_number - b.instance_number
  );

  const metadataByName = new Map<string, ImageMetadata>();
  sortedMetadata.forEach((item) => {
    metadataByName.set(normalizeName(item.file_name || ""), item);
  });

  const usedIds = new Set<number>();

  return sortedImages.map((storage, index) => {
    const matched = metadataByName.get(normalizeName(storage.name));
    if (matched) {
      usedIds.add(matched.id);
      return { storage, metadata: matched };
    }

    const fallback = sortedMetadata.find((item) => !usedIds.has(item.id));
    if (fallback) {
      usedIds.add(fallback.id);
    }

    return {
      storage,
      metadata: fallback || sortedMetadata[index],
    };
  });
}

export function ImageGallery({
  images,
  imageMetadata,
  selectedImageId,
  onSelectImage,
  isLoading = false,
}: ImageGalleryProps) {
  const [selectedFullImage, setSelectedFullImage] = useState<StorageImage | null>(null);
  const items = useMemo(() => buildGalleryItems(images, imageMetadata), [images, imageMetadata]);

  if (isLoading) {
    return (
      <Card className="p-4 h-full">
        <h2 className="text-lg font-semibold mb-4">Image Gallery</h2>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="p-4 h-full">
        <h2 className="text-lg font-semibold mb-4">Image Gallery</h2>
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded border-2 border-dashed border-gray-300">
          <div className="text-center">
            <p className="text-gray-600 text-sm">No images found for this patient</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-4 h-full flex flex-col">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Image Gallery ({items.length})</h2>
          <p className="text-xs text-slate-500">Sorted from Supabase storage</p>
        </div>
        <div className="grid grid-cols-1 gap-3 overflow-y-auto pr-2 sm:grid-cols-2">
          {items.map(({ storage, metadata }, idx) => {
            const isSelected = selectedImageId === metadata?.id;

            return (
              <div
                key={storage.path}
                onClick={() => {
                  if (metadata?.id) {
                    onSelectImage?.(metadata.id);
                  }
                }}
                className={`cursor-pointer overflow-hidden rounded-xl border-2 transition-all ${
                  isSelected
                    ? "border-blue-500 shadow-lg"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div
                  className="relative aspect-square bg-slate-100"
                  onClick={() => setSelectedFullImage(storage)}
                >
                  <img
                    src={storage.url}
                    alt={storage.name || `Image ${idx + 1}`}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-1 bg-white p-3 text-xs">
                  <p className="truncate font-semibold text-slate-900">
                    {metadata?.body_part_clean || "Unmatched image"}
                  </p>
                  <p className="truncate text-slate-600">
                    {metadata?.view_position || storage.name}
                  </p>
                  <p className="truncate font-mono text-[11px] text-slate-400">
                    {storage.name}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {selectedFullImage && (
        <ImageModal
          image={selectedFullImage}
          onClose={() => setSelectedFullImage(null)}
        />
      )}
    </>
  );
}
