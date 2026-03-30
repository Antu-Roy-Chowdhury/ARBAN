"use client";

import { StorageImage } from "@/lib/cloudinary";
import Image from "next/image";
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
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center z-10 transition-colors"
        >
          ×
        </button>

        <div className="relative w-full h-[70vh]">
          <Image
            src={image.url}
            alt="Full view"
            fill
            className="object-contain"
            sizes="(max-width: 1024px) 90vw, 80vw"
            priority
          />
        </div>

        <div className="p-4 bg-gray-50 border-t">
          <p className="text-sm text-gray-600">
            {image.name}
          </p>
        </div>
      </div>
    </div>
  );
}
