import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { rankPlaces, splitByStatus } from "@/utils/cafeRanking";
import type { CafeCategory, CafePlace } from "@/types/cafes";

interface CategoryCardProps {
  category: CafeCategory;
  /** All places already filtered to this category. */
  places: CafePlace[];
}

const CategoryCard = ({ category, places }: CategoryCardProps) => {
  const { visited, wishlist } = splitByStatus(places);
  const leader = rankPlaces(places)[0];

  return (
    <Link
      to={`/cafes/${category.slug}`}
      className="group flex flex-col justify-between rounded-lg border border-border bg-card p-5 transition-gentle hover:border-primary/40 hover:shadow-lavender md:p-6"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <span className="text-3xl leading-none" aria-hidden>
            {category.icon || "🍽"}
          </span>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-gentle group-hover:text-primary" />
        </div>
        <h2 className="mt-4 font-serif text-2xl font-bold leading-tight md:text-3xl">
          {category.name}
        </h2>
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {visited.length} tried · {wishlist.length} to go
        </p>
      </div>

      <div className="mt-5 border-t border-border pt-3">
        {leader && leader.average !== null ? (
          <p className="flex items-baseline justify-between gap-3">
            <span className="truncate font-serif text-base italic text-rose">{leader.place.name}</span>
            <span className="shrink-0 font-mono text-[11px] tabular-nums text-rose">
              {leader.average.toFixed(1)}
            </span>
          </p>
        ) : (
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
            no winner yet
          </p>
        )}
      </div>
    </Link>
  );
};

export default CategoryCard;
