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
import { useCreatePricingSchema } from "@/hooks/use-pricing-schemas";
import type { PricingSchema } from "@/lib/types";

const exampleSchema: Partial<PricingSchema> = {
  base_fields: {
    msrp: "msrp",
    delivery_price: "delivery_price",
  },
  direct_prices: {
    layers: [
      { pattern: "prices_customer_{customer_id}", priority: 1, exact_price: true },
      { pattern: "prices_company_{company_id}", priority: 2, exact_price: true },
      { pattern: "prices_group_{group}", priority: 3, for_each: "groups" },
      { pattern: "prices_default", priority: 4 },
    ],
    price_field: "price",
    type_field: "type",
    allow_line_discount_field: "allow_line_discount",
  },
  discount_rules: {
    layers: [
      { pattern: "discounts_customer_{customer_id}", priority: 1, exact_price: true },
      { pattern: "discounts_group_{group}", priority: 2, for_each: "groups" },
    ],
    calculate_type_field: "calculate_type",
    amount_field: "amount",
  },
  resolution: {
    search_exact_price: false,
  },
  compute: {},
};

export default function NewPricingSchemaPage() {
  const router = useRouter();
  const createSchema = useCreatePricingSchema();
  const [name, setName] = useState("");
  const [schemaJson, setSchemaJson] = useState(
    JSON.stringify(exampleSchema, null, 2)
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const parsedSchema = JSON.parse(schemaJson);
      const fullSchema: PricingSchema = {
        name,
        ...parsedSchema,
      };

      await createSchema.mutateAsync(fullSchema);
      router.push("/pricing-schemas");
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError(`Invalid JSON: ${err.message}`);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create pricing schema");
      }
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/pricing-schemas">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pricing Schemas
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">New Pricing Schema</h1>
        <p className="mt-1 text-muted-foreground">
          Create a new pricing schema configuration
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Provide a unique name for your pricing schema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="name">Schema Name</Label>
                <Input
                  id="name"
                  placeholder="b2b_standard"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schema Configuration</CardTitle>
              <CardDescription>
                Define pricing layers, rules, and computation logic in JSON format
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
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href="/pricing-schemas">Cancel</Link>
            </Button>
            <Button type="submit" disabled={createSchema.isPending || !name}>
              {createSchema.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Schema"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
