"use client";

import Link from "next/link";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useCollections, useDeleteCollection } from "@/hooks/use-collections";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

export default function CollectionsPage() {
  const { data, isLoading, error } = useCollections();
  const deleteCollection = useDeleteCollection();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteCollection.mutateAsync(deleteTarget);
      setDeleteTarget(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              Failed to load collections
            </CardTitle>
            <CardDescription>
              Make sure OverclockDB is running on{" "}
              {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8190"}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Filter out internal collections (prefixed with _)
  const collections = (data?.collections || []).filter(
    (c) => !c.name.startsWith("_")
  );

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Collections</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your OverclockDB collections
          </p>
        </div>
        <Button asChild>
          <Link href="/collections/new">
            <Plus className="mr-2 h-4 w-4" />
            New Collection
          </Link>
        </Button>
      </div>

      {collections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-muted-foreground">No collections yet</p>
            <Button asChild>
              <Link href="/collections/new">
                <Plus className="mr-2 h-4 w-4" />
                Create your first collection
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Card key={collection.name} className="group relative">
              <Link href={`/collections/${encodeURIComponent(collection.name)}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {collection.name}
                  </CardTitle>
                  <CardDescription>
                    <Badge variant="secondary">
                      {collection.num_documents.toLocaleString()} documents
                    </Badge>
                  </CardDescription>
                </CardHeader>
              </Link>
              <Dialog
                open={deleteTarget === collection.name}
                onOpenChange={(open) =>
                  setDeleteTarget(open ? collection.name : null)
                }
              >
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Collection</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete &quot;{collection.name}
                      &quot;? This action cannot be undone and will delete all{" "}
                      {collection.num_documents.toLocaleString()} documents.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setDeleteTarget(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleteCollection.isPending}
                    >
                      {deleteCollection.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
