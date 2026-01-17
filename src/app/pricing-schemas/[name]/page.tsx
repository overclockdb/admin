"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  usePricingSchema,
  useUpdatePricingSchema,
} from "@/hooks/use-pricing-schemas";
import type { PricingSchema } from "@/lib/types";

export default function EditPricingSchemaPage({
  params,
}: {
  params: { name: string };
}) {
  const router = useRouter();
  const decodedName = decodeURIComponent(params.name);
  const { data: schema, isLoading, error } = usePricingSchema(decodedName);
  const updateSchema = useUpdatePricingSchema();
  const [schemaJson, setSchemaJson] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (schema) {
      // Remove name from schema for editing (it's in the URL)
      const { name: _, ...schemaWithoutName } = schema;
      setSchemaJson(JSON.stringify(schemaWithoutName, null, 2));
    }
  }, [schema]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    try {
      const parsedSchema = JSON.parse(schemaJson);
      const fullSchema: PricingSchema = {
        name: decodedName,
        ...parsedSchema,
      };

      await updateSchema.mutateAsync({ name: decodedName, schema: fullSchema });
      router.push("/pricing-schemas");
    } catch (err) {
      if (err instanceof SyntaxError) {
        setValidationError(`Invalid JSON: ${err.message}`);
      } else if (err instanceof Error) {
        setValidationError(err.message);
      } else {
        setValidationError("Failed to update pricing schema");
      }
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
              Failed to load pricing schema
            </CardTitle>
            <CardDescription>
              Schema &quot;{decodedName}&quot; not found or server error
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/pricing-schemas">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Pricing Schemas
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/pricing-schemas">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pricing Schemas
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Edit Pricing Schema</h1>
        <p className="mt-1 text-muted-foreground">
          Update &quot;{decodedName}&quot; configuration
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schema Configuration</CardTitle>
              <CardDescription>
                Update pricing layers, rules, and computation logic in JSON format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="schema">Schema JSON</Label>
                <Textarea
                  id="schema"
                  value={schemaJson}
                  onChange={(e) => setSchemaJson(e.target.value)}
                  className="font-mono text-sm"
                  rows={20}
                  required
                />
                {validationError && (
                  <p className="text-sm text-destructive">{validationError}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href="/pricing-schemas">Cancel</Link>
            </Button>
            <Button type="submit" disabled={updateSchema.isPending}>
              {updateSchema.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Schema"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
