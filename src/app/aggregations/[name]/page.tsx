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
  useAggregation,
  useUpdateAggregation,
} from "@/hooks/use-aggregations";
import type { AggregationConfig } from "@/lib/types";

export default function EditAggregationPage({
  params,
}: {
  params: { name: string };
}) {
  const router = useRouter();
  const decodedName = decodeURIComponent(params.name);
  const { data: config, isLoading, error } = useAggregation(decodedName);
  const updateAggregation = useUpdateAggregation();
  const [configJson, setConfigJson] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (config) {
      // Remove name from config for editing (it's in the URL)
      const { name: _, ...configWithoutName } = config;
      setConfigJson(JSON.stringify(configWithoutName, null, 2));
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    try {
      const parsedConfig = JSON.parse(configJson);
      const fullConfig: AggregationConfig = {
        name: decodedName,
        ...parsedConfig,
      };

      await updateAggregation.mutateAsync({ name: decodedName, config: fullConfig });
      router.push("/aggregations");
    } catch (err) {
      if (err instanceof SyntaxError) {
        setValidationError(`Invalid JSON: ${err.message}`);
      } else if (err instanceof Error) {
        setValidationError(err.message);
      } else {
        setValidationError("Failed to update aggregation config");
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
              Failed to load aggregation config
            </CardTitle>
            <CardDescription>
              Config &quot;{decodedName}&quot; not found or server error
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/aggregations">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Aggregations
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
          <Link href="/aggregations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Aggregations
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Edit Aggregation</h1>
        <p className="mt-1 text-muted-foreground">
          Update &quot;{decodedName}&quot; configuration
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aggregation Configuration</CardTitle>
              <CardDescription>
                Update sources, priority strategy, and computed fields in JSON format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="config">Config JSON</Label>
                <Textarea
                  id="config"
                  value={configJson}
                  onChange={(e) => setConfigJson(e.target.value)}
                  className="font-mono text-sm"
                  rows={25}
                  required
                />
                {validationError && (
                  <p className="text-sm text-destructive">{validationError}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div>
                <strong className="text-foreground">Sources:</strong>
                <ul className="ml-4 list-disc">
                  <li><code>collection</code> - Static collection name</li>
                  <li><code>pattern</code> - Dynamic pattern with {"{variable}"} placeholders</li>
                  <li><code>priority</code> - Lower number = higher priority</li>
                  <li><code>exact</code> - Mark as exact match for prefer_exact strategies</li>
                  <li><code>for_each</code> - Iterate over context array</li>
                </ul>
              </div>
              <div>
                <strong className="text-foreground">Priority Strategies:</strong>
                <ul className="ml-4 list-disc">
                  <li><code>by_priority</code> - Select by priority (lower wins)</li>
                  <li><code>min_value</code> - Select minimum value of field</li>
                  <li><code>max_value</code> - Select maximum value of field</li>
                  <li><code>first_match</code> - Take first match</li>
                  <li><code>all</code> - Return all matches</li>
                </ul>
              </div>
              <div>
                <strong className="text-foreground">Expression Syntax:</strong>
                <ul className="ml-4 list-disc">
                  <li>Arithmetic: <code>+</code>, <code>-</code>, <code>*</code>, <code>/</code></li>
                  <li>Comparison: <code>==</code>, <code>!=</code>, <code>&lt;</code>, <code>&gt;</code>, <code>&lt;=</code>, <code>&gt;=</code></li>
                  <li>Logical: <code>&&</code>, <code>||</code>, <code>!</code></li>
                  <li>Conditional: <code>if(cond, then, else)</code></li>
                  <li>Functions: <code>min(a,b)</code>, <code>max(a,b)</code></li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href="/aggregations">Cancel</Link>
            </Button>
            <Button type="submit" disabled={updateAggregation.isPending}>
              {updateAggregation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Aggregation"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
