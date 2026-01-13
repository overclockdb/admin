"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useCollection } from "@/hooks/use-collections";
import { useSearch } from "@/hooks/use-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [typoTolerance, setTypoTolerance] = useState(0);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const facetFields =
    collection?.fields.filter((f) => f.facet).map((f) => f.name) || [];
  const sortFields =
    collection?.fields.filter((f) => f.sort).map((f) => f.name) || [];
  const searchFields =
    collection?.fields
      .filter((f) => f.type === "string" && f.index !== false)
      .map((f) => f.name) || [];

  const handleSearch = () => {
    searchMutation.mutate(
      {
        q: query || "*",
        filter: filter || undefined,
        facets: selectedFacets.length > 0 ? selectedFacets : undefined,
        sort_by: sortBy || undefined,
        limit,
        typo_tolerance: typoTolerance > 0 ? typoTolerance : undefined,
      },
      {
        onSuccess: (data) => setResults(data),
      }
    );
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
                    {sortFields.map((field) => (
                      <>
                        <SelectItem key={`${field}:asc`} value={`${field}:asc`}>
                          {field} (asc)
                        </SelectItem>
                        <SelectItem
                          key={`${field}:desc`}
                          value={`${field}:desc`}
                        >
                          {field} (desc)
                        </SelectItem>
                      </>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Limit</Label>
                  <Select
                    value={limit.toString()}
                    onValueChange={(v) => setLimit(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
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

              <Button
                onClick={handleSearch}
                className="w-full"
                disabled={searchMutation.isPending}
              >
                {searchMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Search
              </Button>
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
          {results && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Found <strong>{results.found.toLocaleString()}</strong>{" "}
                  results in <strong>{results.took_ms}ms</strong>
                </p>
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
                              {getPreview(hit)}
                            </TableCell>
                          </TableRow>
                          {expandedDoc === hit.id && (
                            <TableRow>
                              <TableCell colSpan={4}>
                                <pre className="max-h-64 overflow-auto rounded bg-muted p-4 text-xs">
                                  {JSON.stringify(hit.doc, null, 2)}
                                </pre>
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

function getPreview(hit: SearchHit): string {
  const { id, ...rest } = hit.doc;
  const firstString = Object.values(rest).find(
    (v) => typeof v === "string" && v.length > 0
  );
  if (firstString) return String(firstString);
  return JSON.stringify(rest).slice(0, 100);
}
