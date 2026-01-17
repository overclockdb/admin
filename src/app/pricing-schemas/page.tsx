"use client";

import Link from "next/link";
import { Plus, Trash2, Loader2, Edit } from "lucide-react";
import {
  usePricingSchemas,
  useDeletePricingSchema,
} from "@/hooks/use-pricing-schemas";
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

export default function PricingSchemasPage() {
  const { data, isLoading, error } = usePricingSchemas();
  const deletePricingSchema = useDeletePricingSchema();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteTarget) {
      await deletePricingSchema.mutateAsync(deleteTarget);
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
              Failed to load pricing schemas
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

  const schemas = data?.schemas || [];

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pricing Schemas</h1>
          <p className="mt-1 text-muted-foreground">
            Configure multi-layer pricing for B2B use cases
          </p>
        </div>
        <Button asChild>
          <Link href="/pricing-schemas/new">
            <Plus className="mr-2 h-4 w-4" />
            New Schema
          </Link>
        </Button>
      </div>

      {schemas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-muted-foreground">No pricing schemas yet</p>
            <Button asChild>
              <Link href="/pricing-schemas/new">
                <Plus className="mr-2 h-4 w-4" />
                Create your first pricing schema
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {schemas.map((schema) => (
            <Card key={schema.name} className="group relative">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span>{schema.name}</span>
                  <Link
                    href={`/pricing-schemas/${encodeURIComponent(schema.name)}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardTitle>
                <CardDescription className="space-y-1">
                  <div className="flex flex-wrap gap-1">
                    {schema.has_price_rules && (
                      <Badge variant="secondary">Price Rules</Badge>
                    )}
                    {schema.has_direct_prices && (
                      <Badge variant="secondary">Direct Prices</Badge>
                    )}
                    {schema.has_discount_rules && (
                      <Badge variant="secondary">Discounts</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {schema.num_price_layers > 0 && (
                      <span>{schema.num_price_layers} price layers</span>
                    )}
                    {schema.num_price_layers > 0 &&
                      schema.num_discount_layers > 0 && <span> · </span>}
                    {schema.num_discount_layers > 0 && (
                      <span>{schema.num_discount_layers} discount layers</span>
                    )}
                  </div>
                </CardDescription>
              </CardHeader>
              <Dialog
                open={deleteTarget === schema.name}
                onOpenChange={(open) =>
                  setDeleteTarget(open ? schema.name : null)
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
                    <DialogTitle>Delete Pricing Schema</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete &quot;{schema.name}
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
                      disabled={deletePricingSchema.isPending}
                    >
                      {deletePricingSchema.isPending ? (
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
