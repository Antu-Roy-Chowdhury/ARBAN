const BANGLADESH_TIMEZONE = "Asia/Dhaka";

function hasExplicitTimezone(value: string) {
  return /(?:Z|[+-]\d{2}:\d{2})$/i.test(value.trim());
}

export function parseTimestamp(value: string | null | undefined) {
  if (!value) return null;

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const isoLikeValue = hasExplicitTimezone(normalized)
    ? normalized
    : `${normalized}Z`;

  const parsed = new Date(isoLikeValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatBangladeshDateTime(value: string | null | undefined) {
  const parsed = parseTimestamp(value);

  if (!parsed) return "Not reviewed";

  return new Intl.DateTimeFormat("en-BD", {
    timeZone: BANGLADESH_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(parsed);
}

export { BANGLADESH_TIMEZONE };
