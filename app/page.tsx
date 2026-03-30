"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  getDistinctPatients,
  getPatientInfo,
  getPatientImages,
  getPatientReport,
  getPatientLatestReview,
  getDistinctBodyParts,
  submitReview,
  Patient,
  ImageMetadata,
  Report,
  Review,
  StorageImage,
} from "@/lib/supabase";
import { PatientInfoPanel } from "@/components/PatientInfoPanel";
import { DicomMetadataPanel } from "@/components/DicomMetadataPanel";
import { ReportPanel } from "@/components/ReportPanel";
import { AutoFlagsPanel } from "@/components/AutoFlagsPanel";
import { ReviewPanel } from "@/components/ReviewPanel";
import { ImageGallery } from "@/components/ImageGallery";
import { Button } from "@/components/ui/button";

interface DataState {
  patient: Patient | null;
  images: ImageMetadata[];
  storageImages: StorageImage[];
  report: Report | null;
  review: Review | null;
}

export default function Home() {
  const searchParams = useSearchParams();

  const [bodyParts, setBodyParts] = useState<string[]>([]);
  const [patientList, setPatientList] = useState<number[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>(
    searchParams.get("filter") || "ALL"
  );
  const [currentPatientId, setCurrentPatientId] = useState<number | null>(
    parseInt(searchParams.get("patient") || "0") || null
  );
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);

  const [data, setData] = useState<DataState>({
    patient: null,
    images: [],
    storageImages: [],
    report: null,
    review: null,
  });

  const [loading, setLoading] = useState({
    bodyParts: true,
    patients: true,
    patient: false,
    images: false,
    storage: false,
    report: false,
    review: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBodyParts = async () => {
      try {
        const parts = await getDistinctBodyParts();
        setBodyParts(parts);
      } catch (err) {
        console.error("Error loading body parts:", err);
      } finally {
        setLoading((prev) => ({ ...prev, bodyParts: false }));
      }
    };

    loadBodyParts();
  }, []);

  useEffect(() => {
    const loadPatients = async () => {
      setLoading((prev) => ({ ...prev, patients: true }));
      try {
        const patients = await getDistinctPatients(
          selectedFilter === "ALL" ? undefined : selectedFilter
        );
        setPatientList(patients);

        if (patients.length > 0 && !patients.includes(currentPatientId || 0)) {
          setCurrentPatientId(patients[0]);
          setSelectedImageId(null);
        }
      } catch (err) {
        console.error("Error loading patients:", err);
        setError("Failed to load patient list");
      } finally {
        setLoading((prev) => ({ ...prev, patients: false }));
      }
    };

    loadPatients();
  }, [selectedFilter]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedFilter !== "ALL") params.set("filter", selectedFilter);
    if (currentPatientId) params.set("patient", currentPatientId.toString());

    const queryString = params.toString();
    const newUrl = queryString ? `/?${queryString}` : "/";
    window.history.replaceState({}, "", newUrl);
  }, [selectedFilter, currentPatientId]);

  useEffect(() => {
    if (!currentPatientId) return;

    const loadPatientData = async () => {
      setLoading((prev) => ({
        ...prev,
        patient: true,
        images: true,
        storage: true,
        report: true,
        review: true,
      }));
      setError(null);
      setSelectedImageId(null);

      try {
        const [patient, images, report, review] = await Promise.all([
          getPatientInfo(currentPatientId),
          getPatientImages(currentPatientId),
          getPatientReport(currentPatientId),
          getPatientLatestReview(currentPatientId),
        ]);

        setData({
          patient,
          images: images || [],
          storageImages: [],
          report,
          review,
        });

        if (images && images.length > 0) {
          setSelectedImageId(images[0].id);
        }

        try {
          const storageResponse = await fetch(`/api/patient-images/${currentPatientId}`);
          const storageData = await storageResponse.json();

          if (storageData.images && storageData.images.length > 0) {
            setData((prev) => ({
              ...prev,
              storageImages: storageData.images,
            }));
          }
        } catch (err) {
          console.error("Error fetching local images:", err);
        }

        setLoading((prev) => ({
          ...prev,
          patient: false,
          images: false,
          storage: false,
          report: false,
          review: false,
        }));
      } catch (err) {
        console.error("Error loading patient data:", err);
        setError("Failed to load patient data");
        setLoading((prev) => ({
          ...prev,
          patient: false,
          images: false,
          storage: false,
          report: false,
          review: false,
        }));
      }
    };

    loadPatientData();
  }, [currentPatientId]);

  const handleFilterChange = (newFilter: string) => {
    setSelectedFilter(newFilter);
  };

  const handlePrevPatient = useCallback(() => {
    if (!currentPatientId) return;
    const currentIndex = patientList.indexOf(currentPatientId);
    if (currentIndex > 0) {
      setCurrentPatientId(patientList[currentIndex - 1]);
    }
  }, [currentPatientId, patientList]);

  const handleNextPatient = useCallback(() => {
    if (!currentPatientId) return;
    const currentIndex = patientList.indexOf(currentPatientId);
    if (currentIndex < patientList.length - 1) {
      setCurrentPatientId(patientList[currentIndex + 1]);
    }
  }, [currentPatientId, patientList]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevPatient();
      } else if (e.key === "ArrowRight") {
        handleNextPatient();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrevPatient, handleNextPatient]);

  const handleSubmitReview = async (
    review: Omit<Review, "id" | "reviewed_at">
  ) => {
    setSubmitting(true);
    try {
      await submitReview(review);
      const latestReview = await getPatientLatestReview(currentPatientId!);
      setData((prev) => ({ ...prev, review: latestReview }));
    } finally {
      setSubmitting(false);
    }
  };

  const currentIndex = patientList.indexOf(currentPatientId || 0);
  const isFirstPatient = currentIndex <= 0;
  const isLastPatient = currentIndex >= patientList.length - 1;

  return (
    <main className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b bg-gray-50">
        <div className="mx-auto max-w-[1600px] px-6 py-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Medical Image Report Verification
            </h1>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
              {currentIndex + 1} / {patientList.length}
            </span>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[260px] flex-1">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Filter by Body Part
              </label>
              <select
                value={selectedFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Body Parts</option>
                {bodyParts.map((part) => (
                  <option key={part} value={part}>
                    {part}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                onClick={handlePrevPatient}
                disabled={isFirstPatient}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <Button
                onClick={handleNextPatient}
                disabled={isLastPatient}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
              <p className="ml-2 text-xs text-gray-500">Arrow keys: left / right</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-6 py-6">
        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <PatientInfoPanel patient={data.patient} isLoading={loading.patient} />
            <div className="h-[calc(100vh-280px)] min-h-[520px] overflow-hidden">
              <ImageGallery
                images={data.storageImages}
                imageMetadata={data.images}
                selectedImageId={selectedImageId || undefined}
                onSelectImage={setSelectedImageId}
                isLoading={loading.storage}
              />
            </div>
          </div>

          <div className="space-y-4">
            <DicomMetadataPanel
              images={data.images}
              selectedImageId={selectedImageId || undefined}
              isLoading={loading.images}
            />
            <ReportPanel
              report={data.report}
              images={data.images}
              isLoading={loading.report}
            />
            <AutoFlagsPanel
              report={data.report}
              images={data.images}
              isLoading={loading.report}
            />
          </div>

          <div className="xl:sticky xl:top-28 xl:h-fit">
            <ReviewPanel
              review={data.review}
              patientId={currentPatientId || 0}
              imageId={selectedImageId || 0}
              onSubmit={handleSubmitReview}
              isLoading={loading.review}
              isSubmitting={submitting}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
