"use client";

import { Patient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";

interface PatientInfoPanelProps {
  patient: Patient | null;
  isLoading?: boolean;
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900 break-words">{value}</p>
    </div>
  );
}

export function PatientInfoPanel({
  patient,
  isLoading = false,
}: PatientInfoPanelProps) {
  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="mb-4 h-5 w-40 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded bg-gray-200 animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (!patient) {
    return (
      <Card className="p-4">
        <h2 className="mb-2 text-base font-semibold">Patient Information</h2>
        <p className="text-sm text-gray-500">No patient data available</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Patient Information</h2>
          <p className="text-sm text-slate-500">Compact overview for the active review case</p>
        </div>
        <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          ID {patient.patient_id}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <InfoPill label="Name" value={patient.patient_name || "Unknown"} />
        <InfoPill label="Age" value={patient.age ? `${patient.age} years` : "Unknown"} />
        <InfoPill label="Sex" value={patient.sex || "Unknown"} />
        <InfoPill label="Patient ID" value={String(patient.patient_id)} />
      </div>
    </Card>
  );
}
