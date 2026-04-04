"use client";

import { StorageImage } from "@/lib/supabase";
import { useEffect } from "react";

interface ImageModalProps {
  image: StorageImage;
  onClose: () => void;
}

export function ImageModal({ image, onClose }: ImageModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-4xl rounded-lg bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
        >
          ×
        </button>

        <div className="relative h-[70vh] w-full">
          <img
            src={image.url}
            alt="Full view"
            className="h-full w-full object-contain"
          />
        </div>

        <div className="border-t bg-gray-50 p-4">
          <p className="text-sm text-gray-600">{image.name}</p>
        </div>
      </div>
    </div>
  );
}
