"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { useCreateCollection } from "@/hooks/use-collections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
import type { FieldDefinition, FieldType } from "@/lib/types";

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "string", label: "String" },
  { value: "string[]", label: "String Array" },
  { value: "int32", label: "Int32" },
  { value: "int32[]", label: "Int32 Array" },
  { value: "int64", label: "Int64" },
  { value: "int64[]", label: "Int64 Array" },
  { value: "float", label: "Float" },
  { value: "float[]", label: "Float Array" },
  { value: "bool", label: "Boolean" },
  { value: "hierarchy", label: "Hierarchy" },
  { value: "attributes", label: "Attributes" },
];

interface FieldFormData extends Omit<FieldDefinition, 'merge'> {
  id: string;
  merge: boolean;
}

export default function NewCollectionPage() {
  const router = useRouter();
  const createCollection = useCreateCollection();

  const [name, setName] = useState("");
  const [fields, setFields] = useState<FieldFormData[]>([
    {
      id: crypto.randomUUID(),
      name: "",
      type: "string",
      index: true,
      facet: false,
      sort: false,
      optional: false,
      merge: false,
    },
  ]);

  const [enableStemming, setEnableStemming] = useState(false);
  const [stemLanguage, setStemLanguage] = useState<"english" | "russian">(
    "english"
  );
  const [enableStopWords, setEnableStopWords] = useState(false);
  const [stopWordsLanguage, setStopWordsLanguage] = useState<
    "english" | "russian" | "none"
  >("english");
  const [numShards, setNumShards] = useState<number | undefined>(undefined);
  const [shardKey, setShardKey] = useState<string | undefined>(undefined);

  const [error, setError] = useState<string | null>(null);

  const addField = () => {
    setFields([
      ...fields,
      {
        id: crypto.randomUUID(),
        name: "",
        type: "string",
        index: true,
        facet: false,
        sort: false,
        optional: false,
        merge: false,
      },
    ]);
  };

  const removeField = (id: string) => {
    if (fields.length > 1) {
      setFields(fields.filter((f) => f.id !== id));
    }
  };

  const updateField = (id: string, updates: Partial<FieldFormData>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Collection name is required");
      return;
    }

    const validFields = fields.filter((f) => f.name.trim());
    if (validFields.length === 0) {
      setError("At least one field is required");
      return;
    }

    try {
      await createCollection.mutateAsync({
        name: name.trim(),
        fields: validFields.map(({ id, ...field }) => field),
        enable_stemming: enableStemming,
        stem_language: enableStemming ? stemLanguage : undefined,
        enable_stop_words: enableStopWords,
        stop_words_language: enableStopWords ? stopWordsLanguage : undefined,
        num_shards: numShards,
        shard_key: shardKey,
      });
      router.push(`/collections/${encodeURIComponent(name.trim())}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create collection");
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/collections">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Collections
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">New Collection</h1>
        <p className="mt-1 text-muted-foreground">
          Create a new collection with a custom schema
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
            <CardTitle>Basic Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="name">Collection Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., products"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fields</CardTitle>
            <CardDescription>
              Define the schema fields for your collection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-start gap-4 rounded-lg border p-4"
              >
                <div className="flex-1 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Field Name</Label>
                      <Input
                        value={field.name}
                        onChange={(e) =>
                          updateField(field.id, { name: e.target.value })
                        }
                        placeholder="e.g., title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value: FieldType) =>
                          updateField(field.id, { type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`index-${field.id}`}
                        checked={field.index}
                        onCheckedChange={(checked) =>
                          updateField(field.id, { index: checked as boolean })
                        }
                      />
                      <Label htmlFor={`index-${field.id}`} className="text-sm">
                        Index
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`facet-${field.id}`}
                        checked={field.facet}
                        onCheckedChange={(checked) =>
                          updateField(field.id, { facet: checked as boolean })
                        }
                      />
                      <Label htmlFor={`facet-${field.id}`} className="text-sm">
                        Facet
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`sort-${field.id}`}
                        checked={field.sort}
                        onCheckedChange={(checked) =>
                          updateField(field.id, { sort: checked as boolean })
                        }
                      />
                      <Label htmlFor={`sort-${field.id}`} className="text-sm">
                        Sort
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`optional-${field.id}`}
                        checked={field.optional}
                        onCheckedChange={(checked) =>
                          updateField(field.id, { optional: checked as boolean })
                        }
                      />
                      <Label
                        htmlFor={`optional-${field.id}`}
                        className="text-sm"
                      >
                        Optional
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`merge-${field.id}`}
                        checked={field.merge}
                        onCheckedChange={(checked) =>
                          updateField(field.id, { merge: checked as boolean })
                        }
                      />
                      <Label
                        htmlFor={`merge-${field.id}`}
                        className="text-sm"
                        title="Enable merge index for collection merge queries"
                      >
                        Merge
                      </Label>
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeField(field.id)}
                  disabled={fields.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addField}>
              <Plus className="mr-2 h-4 w-4" />
              Add Field
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Options</CardTitle>
            <CardDescription>
              Configure text processing and performance options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Stemming</Label>
                <p className="text-sm text-muted-foreground">
                  Reduce words to root form for better recall
                </p>
              </div>
              <Switch
                checked={enableStemming}
                onCheckedChange={setEnableStemming}
              />
            </div>
            {enableStemming && (
              <div className="ml-4 space-y-2">
                <Label>Stemming Language</Label>
                <Select
                  value={stemLanguage}
                  onValueChange={(v) =>
                    setStemLanguage(v as "english" | "russian")
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="russian">Russian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label>Stop Words</Label>
                <p className="text-sm text-muted-foreground">
                  Filter common words for improved precision
                </p>
              </div>
              <Switch
                checked={enableStopWords}
                onCheckedChange={setEnableStopWords}
              />
            </div>
            {enableStopWords && (
              <div className="ml-4 space-y-2">
                <Label>Stop Words Language</Label>
                <Select
                  value={stopWordsLanguage}
                  onValueChange={(v) =>
                    setStopWordsLanguage(v as "english" | "russian" | "none")
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="russian">Russian</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Number of Shards</Label>
              <p className="text-sm text-muted-foreground">
                Enable parallel search (recommended for 50K+ documents)
              </p>
              <Select
                value={numShards?.toString() || "none"}
                onValueChange={(v) =>
                  setNumShards(v === "none" ? undefined : parseInt(v))
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="No sharding" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No sharding</SelectItem>
                  <SelectItem value="2">2 shards</SelectItem>
                  <SelectItem value="4">4 shards</SelectItem>
                  <SelectItem value="8">8 shards</SelectItem>
                  <SelectItem value="16">16 shards</SelectItem>
                  <SelectItem value="256">256 shards</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Shard Key (Field-Based Sharding)</Label>
              <p className="text-sm text-muted-foreground">
                Shard by a specific field value (e.g., customer_id) for locality. Requires num_shards.
              </p>
              <Select
                value={shardKey || "none"}
                onValueChange={(v) =>
                  setShardKey(v === "none" ? undefined : v)
                }
                disabled={!numShards}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="No shard key" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No shard key (doc ID sharding)</SelectItem>
                  {fields
                    .filter((f) => f.name.trim() && f.type === "string")
                    .map((f) => (
                      <SelectItem key={f.id} value={f.name}>
                        {f.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={createCollection.isPending}>
            {createCollection.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Collection
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/collections">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
