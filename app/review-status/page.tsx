import { getReviewQueue } from "@/lib/supabase";
import { ReviewStatusDashboard } from "@/components/ReviewStatusDashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ReviewStatusPage() {
  const queue = await getReviewQueue();

  return <ReviewStatusDashboard queue={queue} />;
}
