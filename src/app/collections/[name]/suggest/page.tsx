"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Loader2, Lightbulb, CheckCircle, XCircle } from "lucide-react";
import { useCollection } from "@/hooks/use-collections";
import { useSuggestions, useFacetSuggestions } from "@/hooks/use-suggestions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

export default function SuggestPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = use(params);
  const collectionName = decodeURIComponent(name);
  const { data: collection } = useCollection(collectionName);

  const [prefix, setPrefix] = useState("");
  const [limit, setLimit] = useState(10);

  const {
    data: suggestions,
    isLoading: loadingSuggestions,
    isFetching: fetchingSuggestions,
  } = useSuggestions(collectionName, prefix, limit);

  const {
    data: facetSuggestions,
    isLoading: loadingFacets,
  } = useFacetSuggestions(collectionName);

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
          <Lightbulb className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Suggestions</h1>
            <p className="mt-1 text-muted-foreground">
              Test autocomplete and view facet recommendations for {collectionName}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Autocomplete Test</CardTitle>
              <CardDescription>
                Type a prefix to get term suggestions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label>Prefix</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={prefix}
                      onChange={(e) => setPrefix(e.target.value)}
                      placeholder="Type to search..."
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-24 space-y-2">
                  <Label>Limit</Label>
                  <Select
                    value={limit.toString()}
                    onValueChange={(v) => setLimit(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {prefix.length > 0 && (
                <div className="space-y-2">
                  {(loadingSuggestions || fetchingSuggestions) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading suggestions...
                    </div>
                  )}

                  {suggestions && !fetchingSuggestions && (
                    <>
                      <div className="text-sm text-muted-foreground">
                        Found {suggestions.suggestions.length} suggestions in{" "}
                        {suggestions.took_ms}ms
                      </div>
                      {suggestions.suggestions.length > 0 ? (
                        <div className="space-y-1">
                          {suggestions.suggestions.map((s, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-md bg-muted px-3 py-2"
                            >
                              <span className="font-medium">{s.term}</span>
                              <Badge variant="secondary">
                                score: {s.score.toFixed(0)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No suggestions found for &quot;{prefix}&quot;
                        </p>
                      )}
                    </>
                  )}

                  {!prefix && (
                    <p className="text-sm text-muted-foreground">
                      Start typing to see autocomplete suggestions
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recommended Facets</CardTitle>
              <CardDescription>
                AI-suggested fields for faceted navigation based on data analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingFacets ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : facetSuggestions?.suggestions &&
                facetSuggestions.suggestions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Cardinality</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facetSuggestions.suggestions.map((s) => (
                      <TableRow key={s.field}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{s.field}</div>
                            <div className="text-xs text-muted-foreground">
                              {s.reason}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              s.score >= 0.7
                                ? "default"
                                : s.score >= 0.4
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {(s.score * 100).toFixed(0)}%
                          </Badge>
                        </TableCell>
                        <TableCell>{s.cardinality.toLocaleString()}</TableCell>
                        <TableCell>
                          {s.already_facet ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-xs">Enabled</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <XCircle className="h-4 w-4" />
                              <span className="text-xs">Not enabled</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No facet suggestions available. Add some documents to the collection first.
                </p>
              )}
              {facetSuggestions?.took_ms !== undefined && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Analysis completed in {facetSuggestions.took_ms}ms
                </p>
              )}
            </CardContent>
          </Card>

          {collection && (
            <Card>
              <CardHeader>
                <CardTitle>Current Facets</CardTitle>
                <CardDescription>
                  Fields currently configured as facets
                </CardDescription>
              </CardHeader>
              <CardContent>
                {collection.fields.filter((f) => f.facet).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {collection.fields
                      .filter((f) => f.facet)
                      .map((f) => (
                        <Badge key={f.name} variant="default">
                          {f.name}
                        </Badge>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No facets configured yet
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
