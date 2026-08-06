import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Eyebrow, DisplayHeading } from "@/components/editorial";
import PlaceRow, { WishlistRow } from "@/components/cafes/PlaceRow";
import PlaceSheet from "@/components/cafes/PlaceSheet";
import PlaceDetailSheet from "@/components/cafes/PlaceDetailSheet";
import { useCafeCategoryBySlug, useCafePlaces, useDeleteCategory } from "@/hooks/useCafes";
import { rankPlaces, splitByStatus, type RankedPlace } from "@/utils/cafeRanking";
import type { CafePlace, PlaceStatus } from "@/types/cafes";

const CafeCategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { category, isPending: categoryPending, error: categoryError } = useCafeCategoryBySlug(slug);
  const places = useCafePlaces(category?.id);
  const deleteCategory = useDeleteCategory();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<CafePlace | undefined>(undefined);
  const [initialStatus, setInitialStatus] = useState<PlaceStatus>("wishlist");
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [viewing, setViewing] = useState<RankedPlace | null>(null);

  const openAdd = (status: PlaceStatus) => {
    setEditing(undefined);
    setInitialStatus(status);
    setSheetOpen(true);
  };

  const openEdit = (place: CafePlace) => {
    setDetailOpen(false);
    setEditing(place);
    setSheetOpen(true);
  };

  const openDetail = (ranked: RankedPlace) => {
    setViewing(ranked);
    setDetailOpen(true);
  };

  const openMarkVisited = (place: CafePlace) => {
    setEditing({ ...place, status: "visited" });
    setSheetOpen(true);
  };

  const ranked = rankPlaces(places.data);
  const { wishlist } = splitByStatus(places.data);
  const isPending = categoryPending || places.isPending;
  const error = (categoryError ?? (places.error as Error | null)) ?? null;

  return (
    <>
      <Helmet>
        <title>{category ? `${category.name} · Cafés` : "Cafés"} · Your Special Day</title>
      </Helmet>

      <main className="min-h-screen bg-background px-4 pb-24 pt-28 sm:px-6 md:px-8 lg:px-12">
        <div className="container mx-auto max-w-4xl">
          <Link
            to="/cafes"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-gentle hover:text-primary"
          >
            <ArrowLeft className="h-3 w-3" />
            All categories
          </Link>

          {isPending && (
            <p className="mt-10 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              Loading…
            </p>
          )}

          {error && (
            <div className="mt-10 rounded-lg border border-destructive/30 bg-destructive/5 p-5">
              <p className="font-sans text-sm text-destructive">{error.message}</p>
              <Button variant="outline" className="mt-3" onClick={() => places.refetch()}>
                Try again
              </Button>
            </div>
          )}

          {!isPending && !error && !category && (
            <div className="mt-16 text-center">
              <p className="font-serif text-3xl italic text-muted-foreground">
                No such list.
              </p>
              <Button className="mt-5" onClick={() => navigate("/cafes")}>
                Back to the categories
              </Button>
            </div>
          )}

          {category && (
            <>
              <motion.header
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mb-10 mt-6 md:mb-14"
              >
                <Eyebrow no={`${ranked.length} tried`}>{category.icon || "🍽"} The list</Eyebrow>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <DisplayHeading as="h1">
                    {category.name}
                    <span className="dot-accent">.</span>
                  </DisplayHeading>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteCategory(true)}
                    aria-label={`Delete the ${category.name} category`}
                    className="mt-2 shrink-0 rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.header>

              {ranked.length > 0 ? (
                <section className="space-y-4">
                  {ranked.map((entry) => (
                    <PlaceRow
                      key={entry.place.id}
                      ranked={entry}
                      isTop={entry.rank === 1 && entry.average !== null}
                      onEdit={openEdit}
                      onView={openDetail}
                    />
                  ))}
                </section>
              ) : (
                <p className="rounded-lg border border-dashed border-border bg-card/60 p-8 text-center font-serif text-xl italic text-muted-foreground">
                  Nowhere ticked off yet.
                </p>
              )}

              <div className="mt-12">
                <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Still to try — {wishlist.length}
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {wishlist.map((place) => (
                    <WishlistRow
                      key={place.id}
                      place={place}
                      onEdit={openEdit}
                      onMarkVisited={openMarkVisited}
                    />
                  ))}
                  {wishlist.length === 0 && (
                    <p className="font-sans text-sm text-muted-foreground">
                      Nothing waiting. Add somewhere we should go.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button onClick={() => openAdd("wishlist")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add to wishlist
                </Button>
                <Button variant="outline" onClick={() => openAdd("visited")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add a place we went
                </Button>
              </div>

              <PlaceSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                categoryId={category.id}
                place={editing}
                initialStatus={initialStatus}
              />

              <PlaceDetailSheet
                open={detailOpen}
                onOpenChange={setDetailOpen}
                ranked={viewing}
                onEdit={openEdit}
              />

              <AlertDialog open={confirmDeleteCategory} onOpenChange={setConfirmDeleteCategory}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-serif">
                      Delete {category.name}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Every place in this list goes with it, ratings included. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep it</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        deleteCategory.mutate(category.id, {
                          onSuccess: () => {
                            toast.success(`${category.name} deleted`);
                            navigate("/cafes");
                          },
                          onError: (mutationError) => toast.error(mutationError.message),
                        })
                      }
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default CafeCategoryPage;
