// Copy that must stay consistent across the flow. An action keeps its name:
// the Take button produces "Took 5" and a TAKE movement rendered as "Took".

export const movementLabel: Record<string, string> = {
  TAKE: "Took",
  RECEIVE: "Received",
  COUNT: "Counted",
  ADJUST: "Adjusted",
};

export function statusWord(status: "ok" | "low" | "out"): string {
  return status === "ok" ? "" : status;
}

export function runningLowHeading(count: number): string {
  if (count === 0) return "Nothing is running low.";
  if (count === 1) return "1 item running low";
  return `${count} items running low`;
}
