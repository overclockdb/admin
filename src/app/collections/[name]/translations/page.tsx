"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Loader2, Save, Languages } from "lucide-react";
import { useCollection } from "@/hooks/use-collections";
import { useTranslations, useSetTranslations } from "@/hooks/use-translations";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TranslationEntry } from "@/lib/types";

const LANGUAGES = ["en", "es", "de", "fr"];

export default function TranslationsPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = use(params);
  const collectionName = decodeURIComponent(name);
  const { data: collection } = useCollection(collectionName);
  const setTranslations = useSetTranslations(collectionName);

  const [selectedField, setSelectedField] = useState<string>("");
  const [translations, setLocalTranslations] = useState<TranslationEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: existingTranslations, isLoading: loadingTranslations } =
    useTranslations(collectionName, selectedField);

  const facetFields =
    collection?.fields.filter((f) => f.facet).map((f) => f.name) || [];

  const handleFieldChange = (field: string) => {
    setSelectedField(field);
    setLocalTranslations([]);
    setError(null);
    setSuccess(null);
  };

  const handleLoadExisting = () => {
    if (existingTranslations?.translations) {
      const entries: TranslationEntry[] = Object.entries(
        existingTranslations.translations
      ).map(([value, data]) => ({
        value,
        labels: data.labels,
      }));
      setLocalTranslations(entries);
    }
  };

  const addTranslation = () => {
    setLocalTranslations([
      ...translations,
      { value: "", labels: { en: "", es: "", de: "", fr: "" } },
    ]);
  };

  const removeTranslation = (index: number) => {
    setLocalTranslations(translations.filter((_, i) => i !== index));
  };

  const updateValue = (index: number, value: string) => {
    const updated = [...translations];
    updated[index].value = value;
    setLocalTranslations(updated);
  };

  const updateLabel = (index: number, lang: string, label: string) => {
    const updated = [...translations];
    updated[index].labels[lang] = label;
    setLocalTranslations(updated);
  };

  const handleSave = async () => {
    if (!selectedField) {
      setError("Please select a field first");
      return;
    }

    const validTranslations = translations.filter((t) => t.value.trim());
    if (validTranslations.length === 0) {
      setError("Add at least one translation with a value");
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await setTranslations.mutateAsync({
        field: selectedField,
        translations: validTranslations,
      });
      setSuccess("Translations saved successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save translations");
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={`/collections/${encodeURIComponent(collectionName)}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {collectionName}
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <Languages className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Translations</h1>
            <p className="mt-1 text-muted-foreground">
              Manage facet value translations for {collectionName}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl space-y-6">
        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="pt-4 text-destructive">{error}</CardContent>
          </Card>
        )}

        {success && (
          <Card className="border-green-500 bg-green-500/10">
            <CardContent className="pt-4 text-green-700">{success}</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Select Field</CardTitle>
            <CardDescription>
              Choose a facet field to add translations for its values
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Facet Field</Label>
                <Select value={selectedField} onValueChange={handleFieldChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a facet field" />
                  </SelectTrigger>
                  <SelectContent>
                    {facetFields.map((field) => (
                      <SelectItem key={field} value={field}>
                        {field}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedField && existingTranslations && (
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={handleLoadExisting}
                    disabled={loadingTranslations}
                  >
                    {loadingTranslations && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Load Existing
                  </Button>
                </div>
              )}
            </div>

            {facetFields.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No facet fields found. Create fields with facet=true to add translations.
              </p>
            )}
          </CardContent>
        </Card>

        {selectedField && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Translations for {selectedField}</CardTitle>
                  <CardDescription>
                    Add value translations in multiple languages
                  </CardDescription>
                </div>
                <Button onClick={addTranslation} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Translation
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {translations.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No translations yet. Click &quot;Add Translation&quot; to start.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Value</TableHead>
                      {LANGUAGES.map((lang) => (
                        <TableHead key={lang}>{lang.toUpperCase()}</TableHead>
                      ))}
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {translations.map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            value={entry.value}
                            onChange={(e) => updateValue(index, e.target.value)}
                            placeholder="Facet value"
                            className="w-32"
                          />
                        </TableCell>
                        {LANGUAGES.map((lang) => (
                          <TableCell key={lang}>
                            <Input
                              value={entry.labels[lang] || ""}
                              onChange={(e) =>
                                updateLabel(index, lang, e.target.value)
                              }
                              placeholder={`${lang} label`}
                              className="w-28"
                            />
                          </TableCell>
                        ))}
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTranslation(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {selectedField && translations.length > 0 && (
          <div className="flex gap-4">
            <Button
              onClick={handleSave}
              disabled={setTranslations.isPending}
            >
              {setTranslations.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Translations
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/collections/${encodeURIComponent(collectionName)}`}>
                Cancel
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
