import { getReviewStatusAppearance } from "@/lib/analysis/review-decisions";

type IssueReviewBadgeProps = {
  label?: string;
  status: string;
};

export function IssueReviewBadge({ label, status }: IssueReviewBadgeProps) {
  const appearance = getReviewStatusAppearance(status);

  return (
    <span
      className={`inline-flex items-center rounded-none border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${appearance.pillClassName}`}
    >
      {label || appearance.label}
    </span>
  );
}
