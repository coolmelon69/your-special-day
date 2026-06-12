export interface LocationEntry {
  spot: string;
  activity: string;
  cost: string;
}

// Parse "Spot:/Activity:/Cost:" blocks, tolerant of bullet, newline and
// dash-separated variants the AI sometimes emits. Returns [] if nothing parses.
export const parseLocationEntries = (prediction: string): LocationEntry[] => {
  const lower = prediction.toLowerCase();
  if (!lower.includes("spot:")) return [];

  const entries: LocationEntry[] = [];

  // Primary: split on bullets/newlines that precede a "Spot:" marker.
  const blocks = prediction.split(/[•\n](?=\s*Spot:)/i).filter((e) => e.trim());

  blocks.forEach((block) => {
    const trimmed = block.trim();

    let spotMatch = trimmed.match(/Spot:\s*([^\n-]*?)(?:\s+Activity:|$)/i);
    if (!spotMatch) spotMatch = trimmed.match(/Spot:\s*([^-]*?)(?:\s*[-–—]|Activity:|$)/i);
    const spot = spotMatch ? spotMatch[1].trim() : "";
    if (!spot || spot.length <= 2) return;

    const dashParts = trimmed.split(/[-–—]/);

    let activityMatch = trimmed.match(/Activity:\s*([^\n-]*?)(?:\s+Cost:|$)/i);
    if (!activityMatch && dashParts.length >= 2) {
      activityMatch = [null as unknown as string, dashParts[1]?.trim() ?? ""];
    }
    const activity = activityMatch ? (activityMatch[1] || activityMatch[0] || "").trim() : "";

    let costMatch = trimmed.match(/Cost:\s*([^\n-]*?)(?:\s+Spot:|$)/i);
    if (!costMatch && dashParts.length >= 3) {
      const lastPart = dashParts[dashParts.length - 1]?.trim();
      if (lastPart && (lastPart.toLowerCase().includes("cost") || lastPart.toLowerCase().includes("free") || /\d/.test(lastPart))) {
        costMatch = [null as unknown as string, lastPart.replace(/cost:\s*/i, "").trim()];
      }
    }
    const cost = costMatch ? (costMatch[1] || costMatch[0] || "").trim() : "";

    entries.push({ spot, activity, cost });
  });

  return entries;
};
