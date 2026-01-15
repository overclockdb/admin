"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Layers, Plus, Trash2, AlertCircle } from "lucide-react";
import { useCreateOverlay, useAvailableTargetCollections } from "@/hooks/use-overlays";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OverlayDocument } from "@/lib/types";

interface DynamicField {
  id: string;
  name: string;
  type: "number" | "string";
  value: string;
}

export default function NewOverlayPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <NewOverlayContent />
    </Suspense>
  );
}

function NewOverlayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetFromUrl = searchParams.get("target");

  const createOverlay = useCreateOverlay();
  const { data: availableCollections, isLoading: collectionsLoading } = useAvailableTargetCollections();

  const [targetCollection, setTargetCollection] = useState(targetFromUrl || "");
  const [contextKey, setContextKey] = useState("");
  const [entityKey, setEntityKey] = useState("");
  const [fields, setFields] = useState<DynamicField[]>([
    { id: crypto.randomUUID(), name: "", type: "number", value: "" },
  ]);
  const [error, setError] = useState<string | null>(null);

  const addField = () => {
    setFields([
      ...fields,
      { id: crypto.randomUUID(), name: "", type: "number", value: "" },
    ]);
  };

  const removeField = (id: string) => {
    if (fields.length > 1) {
      setFields(fields.filter((f) => f.id !== id));
    }
  };

  const updateField = (id: string, updates: Partial<DynamicField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!targetCollection) {
      setError("Target Collection is required");
      return;
    }

    if (!contextKey.trim()) {
      setError("Context Key is required");
      return;
    }

    if (!entityKey.trim()) {
      setError("Entity Key is required");
      return;
    }

    // Validate at least one field has both name and value
    const validFields = fields.filter((f) => f.name.trim() && f.value.trim());
    if (validFields.length === 0) {
      setError("At least one field with name and value is required");
      return;
    }

    try {
      const overlay: OverlayDocument = {
        id: `overlay_${contextKey.trim()}_${entityKey.trim()}`,
        context_key: contextKey.trim(),
        entity_key: entityKey.trim(),
      };

      // Add dynamic fields
      for (const field of validFields) {
        if (field.type === "number") {
          const num = parseFloat(field.value);
          if (!isNaN(num)) {
            overlay[field.name.trim()] = num;
          }
        } else {
          overlay[field.name.trim()] = field.value.trim();
        }
      }

      await createOverlay.mutateAsync({ targetCollection, overlay });
      router.push(`/overlays?target=${encodeURIComponent(targetCollection)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create overlay");
    }
  };

  const backUrl = targetFromUrl
    ? `/overlays?target=${encodeURIComponent(targetFromUrl)}`
    : "/overlays";

  return (
    <div className="p-8">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={backUrl}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Overlays
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <Layers className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">New Overlay</h1>
            <p className="mt-1 text-muted-foreground">
              Create a context-specific value override
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="pt-4 text-destructive">{error}</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Target Collection</CardTitle>
            <CardDescription>
              Select the collection this overlay applies to
            </CardDescription>
          </CardHeader>
          <CardContent>
            {collectionsLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading collections...
              </div>
            ) : availableCollections && availableCollections.length > 0 ? (
              <div className="space-y-2">
                <Label htmlFor="targetCollection">Collection *</Label>
                <Select
                  value={targetCollection}
                  onValueChange={setTargetCollection}
                  disabled={!!targetFromUrl}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCollections.map((collection) => (
                      <SelectItem key={collection} value={collection}>
                        {collection}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {targetFromUrl && (
                  <p className="text-xs text-muted-foreground">
                    Collection pre-selected from URL
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                No collections available. Create a collection first.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Keys</CardTitle>
            <CardDescription>
              Specify the context and entity this overlay applies to
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contextKey">Context Key *</Label>
                <Input
                  id="contextKey"
                  value={contextKey}
                  onChange={(e) => setContextKey(e.target.value)}
                  placeholder="e.g., customer_123"
                />
                <p className="text-xs text-muted-foreground">
                  Customer ID, region, tenant, etc.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="entityKey">Entity Key *</Label>
                <Input
                  id="entityKey"
                  value={entityKey}
                  onChange={(e) => setEntityKey(e.target.value)}
                  placeholder="e.g., product_456"
                />
                <p className="text-xs text-muted-foreground">
                  Product ID, setting name, etc.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fields</CardTitle>
            <CardDescription>
              Add custom fields for this overlay (at least one required)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <Label>Field Name</Label>
                  <Input
                    value={field.name}
                    onChange={(e) => updateField(field.id, { name: e.target.value })}
                    placeholder="e.g., price, discount, label"
                  />
                </div>
                <div className="w-28 space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={field.type}
                    onValueChange={(v) =>
                      updateField(field.id, { type: v as "number" | "string" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="string">String</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Value</Label>
                  <Input
                    type={field.type === "number" ? "number" : "text"}
                    step={field.type === "number" ? "any" : undefined}
                    value={field.value}
                    onChange={(e) => updateField(field.id, { value: e.target.value })}
                    placeholder={field.type === "number" ? "0.00" : "value"}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeField(field.id)}
                  disabled={fields.length === 1}
                  className="mb-0.5"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addField}
              className="mt-2"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Field
            </Button>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={createOverlay.isPending || !targetCollection}
          >
            {createOverlay.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Overlay
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={backUrl}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
