"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Layers } from "lucide-react";
import { useCreateOverlay } from "@/hooks/use-overlays";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewOverlayPage() {
  const router = useRouter();
  const createOverlay = useCreateOverlay();

  const [contextKey, setContextKey] = useState("");
  const [entityKey, setEntityKey] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!contextKey.trim()) {
      setError("Context Key is required");
      return;
    }

    if (!entityKey.trim()) {
      setError("Entity Key is required");
      return;
    }

    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      setError("Value must be a valid number");
      return;
    }

    try {
      await createOverlay.mutateAsync({
        id: `overlay_${contextKey}_${entityKey}`,
        context_key: contextKey.trim(),
        entity_key: entityKey.trim(),
        value: numericValue,
      });
      router.push("/overlays");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create overlay");
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/overlays">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Overlays
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <Layers className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">New Value Overlay</h1>
            <p className="mt-1 text-muted-foreground">
              Create a context-specific value override
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="pt-4 text-destructive">{error}</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Overlay Details</CardTitle>
            <CardDescription>
              Specify the context, entity, and override value
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contextKey">Context Key</Label>
              <Input
                id="contextKey"
                value={contextKey}
                onChange={(e) => setContextKey(e.target.value)}
                placeholder="e.g., customer_123 or region_us"
              />
              <p className="text-xs text-muted-foreground">
                The context identifier (e.g., customer ID, region, tenant)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entityKey">Entity Key</Label>
              <Input
                id="entityKey"
                value={entityKey}
                onChange={(e) => setEntityKey(e.target.value)}
                placeholder="e.g., product_456 or setting_abc"
              />
              <p className="text-xs text-muted-foreground">
                The entity this override applies to (e.g., product ID, setting name)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Override Value</Label>
              <Input
                id="value"
                type="number"
                step="any"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                The numeric value to use for this context-entity combination
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={createOverlay.isPending}>
            {createOverlay.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Overlay
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/overlays">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
