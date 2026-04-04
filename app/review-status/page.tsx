import Link from "next/link";
import { getReviewQueue } from "@/lib/supabase";

export default async function ReviewStatusPage() {
  const queue = await getReviewQueue();

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Review Status</h1>
            <p className="text-sm text-slate-500">
              Unreviewed patients are listed first.
            </p>
          </div>
          <Link href="/" className="text-sm font-medium text-blue-700 hover:text-blue-900">
            Back to Review App
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Patient ID</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Patient Name</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Images</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Reports</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Review Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Last Reviewed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {queue.map((item) => (
                <tr key={item.patient_id} className={!item.is_reviewed ? "bg-amber-50/40" : "bg-white"}>
                  <td className="px-4 py-3 font-mono text-slate-900">
                    <Link href={`/?patient=${encodeURIComponent(item.patient_id)}`} className="hover:text-blue-700">
                      {item.patient_id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{item.patient_name || "Unknown"}</td>
                  <td className="px-4 py-3 text-slate-700">{item.image_count}</td>
                  <td className="px-4 py-3 text-slate-700">{item.report_count}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.is_reviewed
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.is_reviewed ? item.latest_review_status || "reviewed" : "pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {item.latest_reviewed_at
                      ? new Date(item.latest_reviewed_at).toLocaleString()
                      : "Not reviewed"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
