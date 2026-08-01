import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eyebrow, DisplayHeading } from "@/components/editorial";
import CategoryCard from "@/components/cafes/CategoryCard";
import { useAllCafePlaces, useCafeCategories, useCreateCategory } from "@/hooks/useCafes";

const CafesPage = () => {
  const categories = useCafeCategories();
  const places = useAllCafePlaces();
  const createCategory = useCreateCategory();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🍽");

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("Name the category first");
      return;
    }
    createCategory.mutate(
      { name, icon },
      {
        onSuccess: () => {
          toast.success(`${name.trim()} added`);
          setName("");
          setIcon("🍽");
          setIsFormOpen(false);
        },
        onError: (error) => toast.error(error.message),
      }
    );
  };

  const isPending = categories.isPending || places.isPending;
  const error = (categories.error ?? places.error) as Error | null;

  return (
    <>
      <Helmet>
        <title>Cafés · Your Special Day</title>
      </Helmet>

      <main className="min-h-screen bg-background px-4 pb-24 pt-28 sm:px-6 md:px-8 lg:px-12">
        <div className="container mx-auto max-w-5xl">
          <motion.header
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10 md:mb-14"
          >
            <Eyebrow no="Nº 06">The hunt</Eyebrow>
            <DisplayHeading className="mt-4">
              Everywhere we <em>ate</em>, ranked<span className="dot-accent">.</span>
            </DisplayHeading>
            <p className="mt-4 max-w-xl font-sans text-base leading-relaxed text-muted-foreground">
              One list per craving. Add the places we want to try, tick them off when we go,
              and let the scores argue it out.
            </p>
          </motion.header>

          {isPending && (
            <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              Loading the lists…
            </p>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
              <p className="font-sans text-sm text-destructive">{error.message}</p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => {
                  categories.refetch();
                  places.refetch();
                }}
              >
                Try again
              </Button>
            </div>
          )}

          {!isPending && !error && (
            <>
              {categories.data && categories.data.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {categories.data.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      places={(places.data ?? []).filter(
                        (place) => place.category_id === category.id
                      )}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-card/60 p-10 text-center">
                  <p className="font-serif text-2xl italic text-muted-foreground">
                    Nothing on the list yet.
                  </p>
                  <p className="mx-auto mt-2 max-w-sm font-sans text-sm text-muted-foreground">
                    Start with the one we argue about most — fish and chips, matcha, nasi lemak.
                  </p>
                </div>
              )}

              <Button className="mt-8" onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New category
              </Button>
            </>
          )}
        </div>
      </main>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">New category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="category-name" className="font-mono text-[10px] uppercase tracking-[0.18em]">
                Name
              </Label>
              <Input
                id="category-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Fish & Chips"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-icon" className="font-mono text-[10px] uppercase tracking-[0.18em]">
                Icon
              </Label>
              <Input
                id="category-icon"
                value={icon}
                onChange={(event) => setIcon(event.target.value.slice(0, 4))}
                className="w-20 text-center text-xl"
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={createCategory.isPending}>
                {createCategory.isPending ? "Adding…" : "Add"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CafesPage;
