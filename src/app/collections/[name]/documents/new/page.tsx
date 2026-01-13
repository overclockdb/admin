"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useCollection } from "@/hooks/use-collections";
import { useCreateDocument } from "@/hooks/use-documents";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewDocumentPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = use(params);
  const collectionName = decodeURIComponent(name);
  const router = useRouter();
  const { data: collection } = useCollection(collectionName);
  const createDocument = useCreateDocument(collectionName);

  const [json, setJson] = useState(() => {
    const template: Record<string, string> = { id: "" };
    return JSON.stringify(template, null, 2);
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const doc = JSON.parse(json);
      if (!doc.id) {
        setError('Document must have an "id" field');
        return;
      }
      await createDocument.mutateAsync(doc);
      router.push(
        `/collections/${encodeURIComponent(collectionName)}/documents`
      );
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError("Invalid JSON format");
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to create document"
        );
      }
    }
  };

  const generateTemplate = () => {
    if (!collection) return;
    const template: Record<string, unknown> = { id: "" };
    collection.fields.forEach((field) => {
      if (field.name === "id") return;
      switch (field.type) {
        case "string":
          template[field.name] = "";
          break;
        case "string[]":
          template[field.name] = [];
          break;
        case "int32":
        case "int64":
        case "float":
          template[field.name] = 0;
          break;
        case "int32[]":
        case "int64[]":
        case "float[]":
          template[field.name] = [];
          break;
        case "bool":
          template[field.name] = false;
          break;
        case "hierarchy":
          template[field.name] = "";
          break;
        case "attributes":
          template[field.name] = {};
          break;
      }
    });
    setJson(JSON.stringify(template, null, 2));
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link
            href={`/collections/${encodeURIComponent(collectionName)}/documents`}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Documents
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">New Document</h1>
        <p className="mt-1 text-muted-foreground">
          Add a new document to {collectionName}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="pt-4 text-destructive">{error}</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Document JSON</CardTitle>
                <CardDescription>
                  Enter the document as JSON. Must include an &quot;id&quot;
                  field.
                </CardDescription>
              </div>
              {collection && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateTemplate}
                >
                  Generate Template
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="json">JSON</Label>
              <Textarea
                id="json"
                value={json}
                onChange={(e) => setJson(e.target.value)}
                className="h-96 font-mono text-sm"
                placeholder='{"id": "doc_1", "title": "Example"}'
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={createDocument.isPending}>
            {createDocument.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Document
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link
              href={`/collections/${encodeURIComponent(collectionName)}/documents`}
            >
              Cancel
            </Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
