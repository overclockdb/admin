"use client";

import Link from "next/link";
import { Plus, Trash2, Loader2, Edit } from "lucide-react";
import {
  useAggregations,
  useDeleteAggregation,
} from "@/hooks/use-aggregations";
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

export default function AggregationsPage() {
  const { data, isLoading, error } = useAggregations();
  const deleteAggregation = useDeleteAggregation();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteAggregation.mutateAsync(deleteTarget);
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
              Failed to load aggregation configs
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

  const configs = data?.configs || [];

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Aggregations</h1>
          <p className="mt-1 text-muted-foreground">
            Multi-source data merging with computed fields for pricing, inventory, and more
          </p>
        </div>
        <Button asChild>
          <Link href="/aggregations/new">
            <Plus className="mr-2 h-4 w-4" />
            New Aggregation
          </Link>
        </Button>
      </div>

      {configs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-muted-foreground">No aggregation configs yet</p>
            <Button asChild>
              <Link href="/aggregations/new">
                <Plus className="mr-2 h-4 w-4" />
                Create your first aggregation
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {configs.map((config) => (
            <Card key={config.name} className="group relative">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span>{config.name}</span>
                  <Link
                    href={`/aggregations/${encodeURIComponent(config.name)}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardTitle>
                <CardDescription className="space-y-1">
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">merge: {config.merge_key}</Badge>
                    <Badge variant="secondary">{config.strategy_type}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {config.num_sources > 0 && (
                      <span>{config.num_sources} source{config.num_sources !== 1 ? 's' : ''}</span>
                    )}
                    {config.num_sources > 0 && config.num_computed_fields > 0 && (
                      <span> · </span>
                    )}
                    {config.num_computed_fields > 0 && (
                      <span>{config.num_computed_fields} computed field{config.num_computed_fields !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                </CardDescription>
              </CardHeader>
              <Dialog
                open={deleteTarget === config.name}
                onOpenChange={(open) =>
                  setDeleteTarget(open ? config.name : null)
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
                    <DialogTitle>Delete Aggregation Config</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete &quot;{config.name}
                      &quot;? This action cannot be undone.
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
                      disabled={deleteAggregation.isPending}
                    >
                      {deleteAggregation.isPending ? (
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
