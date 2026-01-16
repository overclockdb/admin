"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useCollection } from "@/hooks/use-collections";
import { useSearch } from "@/hooks/use-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SearchResponse, SearchHit } from "@/lib/types";

export default function SearchPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = use(params);
  const collectionName = decodeURIComponent(name);
  const { data: collection } = useCollection(collectionName);
  const searchMutation = useSearch(collectionName);

  const [query, setQuery] = useState("*");
  const [filter, setFilter] = useState("");
  const [selectedFacets, setSelectedFacets] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("");
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [typoTolerance, setTypoTolerance] = useState(0);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  // Merge configuration
  const [mergeEnabled, setMergeEnabled] = useState(false);
  const [mergeCollections, setMergeCollections] = useState("");
  const [mergePriorityCollection, setMergePriorityCollection] = useState("");
  const [mergeComparisonField, setMergeComparisonField] = useState("");
  const [mergeReturnFields, setMergeReturnFields] = useState("");
  const [mergeStrategy, setMergeStrategy] = useState<"min" | "max">("min");

  // Request JSON editor
  const [lastRequest, setLastRequest] = useState<string>("");
  const [customRequest, setCustomRequest] = useState<string>("");
  const syncingFromJson = useRef(false);

  // Sync form changes to JSON editor (clear custom/last so it falls back to buildRequest)
  useEffect(() => {
    if (!syncingFromJson.current) {
      setCustomRequest("");
      setLastRequest("");
    }
  }, [query, filter, selectedFacets, sortBy, limit, offset, typoTolerance, mergeEnabled, mergeCollections, mergePriorityCollection, mergeComparisonField, mergeReturnFields, mergeStrategy]);

  // Sync JSON editor changes to form fields (real-time)
  useEffect(() => {
    if (!customRequest) return;
    try {
      const request = JSON.parse(customRequest);
      syncingFromJson.current = true;

      if (request.q !== undefined) setQuery(request.q);
      if (request.filter !== undefined) setFilter(request.filter || "");
      if (request.limit !== undefined) setLimit(request.limit);
      if (request.offset !== undefined) setOffset(request.offset || 0);
      if (request.typo_tolerance !== undefined) setTypoTolerance(request.typo_tolerance || 0);
      if (request.sort_by !== undefined) setSortBy(request.sort_by || "");
      if (request.facets !== undefined) setSelectedFacets(request.facets || []);

      if (request.merge) {
        setMergeEnabled(true);
        setMergeCollections(Array.isArray(request.merge.collections) ? request.merge.collections.join(", ") : "");
        setMergePriorityCollection(request.merge.priority_collection || "");
        setMergeComparisonField(request.merge.comparison_field || "");
        setMergeReturnFields(Array.isArray(request.merge.return_fields) ? request.merge.return_fields.join(", ") : "");
        setMergeStrategy(request.merge.strategy || "min");
      } else if (request.merge === undefined || request.merge === null) {
        setMergeEnabled(false);
      }

      // Reset flag after state updates are batched
      setTimeout(() => { syncingFromJson.current = false; }, 0);
    } catch {
      // Invalid JSON - don't sync
    }
  }, [customRequest]);

  const facetFields =
    collection?.fields.filter((f) => f.facet).map((f) => f.name) || [];
  const baseSortFields =
    collection?.fields.filter((f) => f.sort).map((f) => f.name) || [];

  // When merge is enabled, include merge fields in sort options
  const mergeSortFields = mergeEnabled
    ? [...new Set([
        ...mergeReturnFields.split(",").map(s => s.trim()).filter(Boolean),
        ...(mergeComparisonField ? [mergeComparisonField.trim()] : [])
      ])]
    : [];
  const sortFields = [...baseSortFields, ...mergeSortFields.filter(f => !baseSortFields.includes(f))];

  const buildRequest = (searchOffset: number) => {
    const mergeCollectionsArray = mergeCollections.split(",").map(s => s.trim()).filter(Boolean);
    const mergeReturnFieldsArray = mergeReturnFields.split(",").map(s => s.trim()).filter(Boolean);
    return {
      q: query || "*",
      filter: filter || undefined,
      facets: selectedFacets.length > 0 ? selectedFacets : undefined,
      sort_by: sortBy && sortBy !== "none" ? sortBy : undefined,
      limit,
      offset: searchOffset > 0 ? searchOffset : undefined,
      typo_tolerance: typoTolerance > 0 ? typoTolerance : undefined,
      merge:
        mergeEnabled && mergeCollectionsArray.length > 0
          ? {
              collections: mergeCollectionsArray,
              priority_collection: mergePriorityCollection || undefined,
              comparison_field: mergeComparisonField || undefined,
              strategy: mergeStrategy,
              return_fields: mergeReturnFieldsArray.length > 0 ? mergeReturnFieldsArray : undefined,
            }
          : undefined,
    };
  };

  const handleSearch = (newOffset?: number) => {
    const searchOffset = newOffset ?? offset;
    const request = buildRequest(searchOffset);
    setLastRequest(JSON.stringify(request, null, 2));
    searchMutation.mutate(request, {
      onSuccess: (data) => {
        setResults(data);
        if (newOffset !== undefined) setOffset(newOffset);
      },
    });
  };

  const handleCustomSearch = () => {
    try {
      const request = JSON.parse(customRequest || lastRequest || JSON.stringify(buildRequest(0)));
      setLastRequest(JSON.stringify(request, null, 2));
      searchMutation.mutate(request, {
        onSuccess: (data) => {
          setResults(data);
        },
      });
    } catch {
      alert("Invalid JSON");
    }
  };

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = results ? Math.ceil(results.found / limit) : 0;

  const goToPage = (page: number) => {
    const newOffset = (page - 1) * limit;
    handleSearch(newOffset);
  };

  const toggleFacet = (field: string) => {
    setSelectedFacets((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const addFacetFilter = (field: string, value: string) => {
    const newFilter = `${field}:=${value}`;
    setFilter((prev) => (prev ? `${prev} AND ${newFilter}` : newFilter));
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
        <h1 className="text-3xl font-bold">Search</h1>
        <p className="mt-1 text-muted-foreground">
          Test search queries on {collectionName}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Query</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Search Query</Label>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='* or "search terms"'
                />
              </div>

              <div className="space-y-2">
                <Label>Filter Expression</Label>
                <Textarea
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="price:>=100 AND category:=electronics"
                  className="h-20 font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="No sorting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No sorting</SelectItem>
                    {baseSortFields.map((field) => (
                      <>
                        <SelectItem key={`${field}:asc`} value={`${field}:asc`}>
                          {field} (asc)
                        </SelectItem>
                        <SelectItem key={`${field}:desc`} value={`${field}:desc`}>
                          {field} (desc)
                        </SelectItem>
                      </>
                    ))}
                    {mergeSortFields.length > 0 && (
                      <>
                        <SelectItem value="_merge_separator" disabled className="text-xs text-muted-foreground">
                          — Merge fields —
                        </SelectItem>
                        {mergeSortFields.map((field) => (
                          <>
                            <SelectItem key={`merge-${field}:asc`} value={`${field}:asc`}>
                              {field} (asc)
                            </SelectItem>
                            <SelectItem key={`merge-${field}:desc`} value={`${field}:desc`}>
                              {field} (desc)
                            </SelectItem>
                          </>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Limit</Label>
                  <Input
                    type="number"
                    min={1}
                    max={1000}
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Typo Tolerance</Label>
                  <Select
                    value={typoTolerance.toString()}
                    onValueChange={(v) => setTypoTolerance(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Off</SelectItem>
                      <SelectItem value="1">1 typo</SelectItem>
                      <SelectItem value="2">2 typos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {facetFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Facets</CardTitle>
                <CardDescription>
                  Select fields to get facet counts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {facetFields.map((field) => (
                    <div key={field} className="flex items-center space-x-2">
                      <Checkbox
                        id={`facet-${field}`}
                        checked={selectedFacets.includes(field)}
                        onCheckedChange={() => toggleFacet(field)}
                      />
                      <Label
                        htmlFor={`facet-${field}`}
                        className="text-sm font-normal"
                      >
                        {field}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Collection Merge</CardTitle>
                <Switch
                  checked={mergeEnabled}
                  onCheckedChange={setMergeEnabled}
                />
              </div>
              <CardDescription>
                Join separate collections at query time
              </CardDescription>
            </CardHeader>
            {mergeEnabled && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Collections</Label>
                  <Input
                    value={mergeCollections}
                    onChange={(e) => setMergeCollections(e.target.value)}
                    placeholder="prices_store_123, prices_customer_vip"
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated list of merge-enabled collections
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Priority Collection (optional)</Label>
                  <Input
                    value={mergePriorityCollection}
                    onChange={(e) => setMergePriorityCollection(e.target.value)}
                    placeholder="prices_customer_vip"
                  />
                  <p className="text-xs text-muted-foreground">
                    If this collection has a value, use it directly
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Comparison Field</Label>
                  <Input
                    value={mergeComparisonField}
                    onChange={(e) => setMergeComparisonField(e.target.value)}
                    placeholder="e.g., price"
                  />
                  <p className="text-xs text-muted-foreground">
                    Field for min/max comparison and sorting
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Strategy</Label>
                  <Select
                    value={mergeStrategy}
                    onValueChange={(v) =>
                      setMergeStrategy(v as "min" | "max")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="min">Minimum (lower wins)</SelectItem>
                      <SelectItem value="max">Maximum (higher wins)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Return Fields (optional)</Label>
                  <Input
                    value={mergeReturnFields}
                    onChange={(e) => setMergeReturnFields(e.target.value)}
                    placeholder="price, discount"
                  />
                  <p className="text-xs text-muted-foreground">
                    Fields to include in flattened response
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {results?.facets && Object.keys(results.facets).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Facet Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(results.facets).map(([field, values]) => (
                  <div key={field}>
                    <h4 className="mb-2 font-medium">{field}</h4>
                    <ScrollArea className="h-32">
                      <div className="space-y-1">
                        {values.map((fv) => (
                          <button
                            key={fv.value}
                            onClick={() => addFacetFilter(field, fv.value)}
                            className="flex w-full items-center justify-between rounded px-2 py-1 text-sm hover:bg-muted"
                          >
                            <span className="truncate">
                              {fv.label || fv.value}
                            </span>
                            <Badge variant="secondary" className="ml-2">
                              {fv.count}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {/* Request JSON Editor - Always visible */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Request JSON</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={customRequest || lastRequest || JSON.stringify(buildRequest(0), null, 2)}
                onChange={(e) => setCustomRequest(e.target.value)}
                className="h-40 font-mono text-xs"
              />
              <Button
                onClick={handleCustomSearch}
                disabled={searchMutation.isPending}
                className="w-full"
              >
                {searchMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Send Request
              </Button>
            </CardContent>
          </Card>

          {results && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Found <strong>{results.found.toLocaleString()}</strong>{" "}
                  results in <strong>{results.took_ms}ms</strong>
                  {totalPages > 1 && (
                    <span className="ml-2">
                      (Page {currentPage} of {totalPages})
                    </span>
                  )}
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage <= 1 || searchMutation.isPending}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage >= totalPages || searchMutation.isPending}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Preview</TableHead>
                        {mergeEnabled && mergeReturnFields.split(",").map(s => s.trim()).filter(Boolean).map(field => (
                          <TableHead key={field}>{field}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.hits.map((hit) => (
                        <>
                          <TableRow
                            key={hit.id}
                            className="cursor-pointer"
                            onClick={() =>
                              setExpandedDoc(
                                expandedDoc === hit.id ? null : hit.id
                              )
                            }
                          >
                            <TableCell>
                              {expandedDoc === hit.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {hit.id}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {hit.score.toFixed(3)}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-md truncate">
                              {getPreview(hit, mergeEnabled)}
                            </TableCell>
                            {mergeEnabled && mergeReturnFields.split(",").map(s => s.trim()).filter(Boolean).map(field => {
                              const hitAny = hit as unknown as Record<string, unknown>;
                              const value = hitAny[field];
                              return (
                                <TableCell key={field} className="font-mono text-sm">
                                  {value !== undefined ? String(value) : "-"}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                          {expandedDoc === hit.id && (
                            <TableRow>
                              <TableCell colSpan={4 + (mergeEnabled ? mergeReturnFields.split(",").map(s => s.trim()).filter(Boolean).length : 0)}>
                                <div>
                                  <h4 className="mb-2 text-sm font-medium">
                                    {mergeEnabled ? "Full Response (Flat)" : "Document"}
                                  </h4>
                                  <pre className="max-h-64 overflow-auto rounded bg-muted p-4 text-xs">
                                    {mergeEnabled
                                      ? JSON.stringify(hit, null, 2)
                                      : JSON.stringify(hit.doc, null, 2)}
                                  </pre>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}

          {!results && !searchMutation.isPending && (
            <Card>
              <CardContent className="flex h-64 items-center justify-center">
                <p className="text-muted-foreground">
                  Enter a query and click Search to see results
                </p>
              </CardContent>
            </Card>
          )}

          {searchMutation.isPending && (
            <Card>
              <CardContent className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function getPreview(hit: SearchHit, isMerge: boolean): string {
  // When merge is enabled, response is flat (no doc wrapper)
  const source = isMerge ? (hit as unknown as Record<string, unknown>) : hit.doc;
  if (!source) return "-";

  const { id, score, text_score, vector_score, ...rest } = source as Record<string, unknown>;
  const firstString = Object.values(rest).find(
    (v) => typeof v === "string" && v.length > 0
  );
  if (firstString) return String(firstString);
  return JSON.stringify(rest).slice(0, 100);
}
