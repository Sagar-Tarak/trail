export function activityInspectionUrl(eventId: string, primary = false) {
  return `/activities/${encodeURIComponent(eventId)}${primary ? "?primary=true" : ""}`;
}
export function inspectionReturnTo(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^\/(?:timeline|activities|transactions|records|reports|errors)?(?:\?|$)/.test(
      value,
    )
  )
    return "/timeline";
  return value;
}
