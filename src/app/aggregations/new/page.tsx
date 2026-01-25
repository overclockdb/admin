"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateAggregation } from "@/hooks/use-aggregations";
import type { AggregationConfig } from "@/lib/types";

const exampleConfig: Omit<AggregationConfig, "name"> = {
  merge_key: "product_id",
  sources: [
    {
      pattern: "prices_customer_{customer_id}",
      priority: 1,
      exact: true,
    },
    {
      collection: "prices_default",
      priority: 2,
    },
  ],
  priority_strategy: {
    type: "by_priority",
    prefer_exact: true,
  },
  computed_fields: [
    {
      name: "final_price",
      expression: "if(allow_discount, price * (1 - discount_percent / 100), price)",
    },
    {
      name: "savings",
      expression: "price - final_price",
    },
  ],
};

export default function NewAggregationPage() {
  const router = useRouter();
  const createAggregation = useCreateAggregation();
  const [name, setName] = useState("");
  const [configJson, setConfigJson] = useState(
    JSON.stringify(exampleConfig, null, 2)
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const parsedConfig = JSON.parse(configJson);
      const fullConfig: AggregationConfig = {
        name,
        ...parsedConfig,
      };

      await createAggregation.mutateAsync(fullConfig);
      router.push("/aggregations");
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError(`Invalid JSON: ${err.message}`);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create aggregation config");
      }
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/aggregations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Aggregations
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">New Aggregation</h1>
        <p className="mt-1 text-muted-foreground">
          Create a new aggregation config for multi-source data merging
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Provide a unique name for your aggregation config (alphanumeric and underscore only)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="name">Config Name</Label>
                <Input
                  id="name"
                  placeholder="b2b_pricing"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  pattern="^[a-zA-Z0-9_]+$"
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aggregation Configuration</CardTitle>
              <CardDescription>
                Define sources, priority strategy, and computed fields in JSON format.
                The example shows a B2B pricing configuration.
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
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
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
                  <li><code>shard_by</code> - Shard key for optimization</li>
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
            <Button type="submit" disabled={createAggregation.isPending || !name}>
              {createAggregation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Aggregation"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
