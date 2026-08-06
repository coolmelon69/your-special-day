import { useMemo } from "react";
import { motion } from "framer-motion";
import { Route } from "lucide-react";
import { DisplayHeading, Eyebrow, StatBlock } from "@/components/editorial";
import { normalizeRoute } from "@/utils/wrappedStats";
import type { WrappedStats } from "@/types/wrapped";
import type { WrappedTemplateCopy } from "@/types/admin";
import { applyHeadingTokens } from "@/utils/wrappedTemplate";

const VIEWBOX = 100;

/**
 * An abstract drawing of the route, not a map. Coordinates are normalized
 * into a square viewBox and stroked as a polyline, so there is no tile
 * provider, no API key, and nothing to load.
 */
const RouteMapSlide = ({ stats, copy }: { stats: WrappedStats; copy: WrappedTemplateCopy }) => {
  const points = useMemo(() => normalizeRoute(stats.route, VIEWBOX, 10), [stats.route]);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const heading = applyHeadingTokens(copy.route.heading, { distance: stats.distanceKm.toFixed(1) });

  return (
    <div className="flex flex-col h-full justify-center px-6 max-w-2xl mx-auto w-full">
      <Eyebrow className="mb-4">{copy.route.eyebrow}</Eyebrow>
      <DisplayHeading as="h2" className="mb-8">
        {heading.before}
        <em>{heading.emphasis}</em>
        {heading.after}
      </DisplayHeading>

      <div className="w-full rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-4 mb-8">
        <svg
          viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
          className="w-full aspect-square"
          role="img"
          aria-label={`Route across ${points.length} checkpoints`}
        >
          {points.length > 1 && (
            <motion.path
              d={path}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={1.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          )}
          {points.map((p, i) => (
            <motion.circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={1.8}
              fill="hsl(var(--rose))"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              // Dots land as the line reaches them.
              transition={{
                delay: points.length > 1 ? (i / (points.length - 1)) * 1.5 : 0,
                duration: 0.3,
              }}
            />
          ))}
        </svg>
      </div>

      <div className="flex items-center gap-2">
        <Route className="w-4 h-4 text-muted-foreground" />
        <StatBlock value={points.length} label={copy.route.checkpointsLabel} />
      </div>
    </div>
  );
};

export default RouteMapSlide;
