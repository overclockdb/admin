"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Pencil,
  Loader2,
  Layers,
  Hash,
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  Database,
} from "lucide-react";
import { useOverlayContexts, useOverlays, useDeleteOverlay, useOverlayTargetCollections, useAvailableTargetCollections } from "@/hooks/use-overlays";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OverlayDocument } from "@/lib/types";

const LIMIT_OPTIONS = [10, 20, 50, 100];
const RESERVED_FIELDS = ["id", "context_key", "entity_key"];

export default function OverlaysPage() {
  // Target collection state
  const [selectedTargetCollection, setSelectedTargetCollection] = useState<string | null>(null);

  // Context list state
  const [contextFilter, setContextFilter] = useState("");
  const [contextPage, setContextPage] = useState(1);
  const [contextLimit, setContextLimit] = useState(10);

  // Selected context & values state
  const [selectedContext, setSelectedContext] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState("");
  const [valuesPage, setValuesPage] = useState(1);
  const [valuesLimit, setValuesLimit] = useState(10);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: targetCollections, isLoading: targetsLoading } = useOverlayTargetCollections();
  const { data: availableCollections } = useAvailableTargetCollections();
  const { data: contextsData, isLoading: contextsLoading, error: contextsError } = useOverlayContexts(selectedTargetCollection);
  const { data: overlaysData, isLoading: overlaysLoading } = useOverlays({
    targetCollection: selectedContext && selectedTargetCollection ? selectedTargetCollection : null,
    contextKey: selectedContext || undefined,
    entityKeyFilter: entityFilter || undefined,
    limit: valuesLimit,
    offset: (valuesPage - 1) * valuesLimit,
  });
  const deleteOverlay = useDeleteOverlay();

  // Get contexts from facets
  const facets = contextsData?.facets as Record<string, { value: string; count: number }[]> | undefined;
  const contexts = facets?.context_key || [];
  const filteredContexts = contexts.filter((c) =>
    c.value.toLowerCase().includes(contextFilter.toLowerCase())
  );
  const totalContexts = filteredContexts.length;
  const contextTotalPages = Math.ceil(totalContexts / contextLimit);
  const paginatedContexts = filteredContexts.slice(
    (contextPage - 1) * contextLimit,
    contextPage * contextLimit
  );

  // Get overlay values for selected context - extract all fields dynamically
  const overlays = useMemo(() => {
    return (
      overlaysData?.hits?.map((hit) => ({
        ...hit.doc,
        id: hit.id,
      } as OverlayDocument)) || []
    );
  }, [overlaysData]);

  // Discover all unique field names from the overlays (excluding reserved fields)
  const dynamicFields = useMemo(() => {
    const fieldSet = new Set<string>();
    for (const overlay of overlays) {
      for (const key of Object.keys(overlay)) {
        if (!RESERVED_FIELDS.includes(key)) {
          fieldSet.add(key);
        }
      }
    }
    return Array.from(fieldSet).sort();
  }, [overlays]);

  const totalOverlays = overlaysData?.found || 0;
  const valuesTotalPages = Math.ceil(totalOverlays / valuesLimit);

  const handleDelete = async (id: string) => {
    if (!selectedTargetCollection) return;
    await deleteOverlay.mutateAsync({ targetCollection: selectedTargetCollection, id });
    setDeleteId(null);
  };

  const handleSelectContext = (contextKey: string) => {
    setSelectedContext(contextKey);
    setEntityFilter("");
    setValuesPage(1);
  };

  const handleBackToContexts = () => {
    setSelectedContext(null);
    setEntityFilter("");
    setValuesPage(1);
  };

  const handleSelectTargetCollection = (collection: string) => {
    setSelectedTargetCollection(collection);
    setSelectedContext(null);
    setContextFilter("");
    setContextPage(1);
  };

  const handleBackToCollections = () => {
    setSelectedTargetCollection(null);
    setSelectedContext(null);
    setContextFilter("");
    setContextPage(1);
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "number") return value.toLocaleString();
    if (typeof value === "string") return value;
    return JSON.stringify(value);
  };

  if (targetsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show overlay values for selected context
  if (selectedContext && selectedTargetCollection) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToContexts}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Contexts
          </Button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Layers className="h-8 w-8" />
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Collection: <Badge variant="outline">{selectedTargetCollection}</Badge>
                </p>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {selectedContext}
                  </Badge>
                </h1>
                <p className="mt-1 text-muted-foreground">
                  {totalOverlays} overlay{totalOverlays !== 1 ? "s" : ""} in this context
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href={`/overlays/new?target=${encodeURIComponent(selectedTargetCollection)}`}>
                <Plus className="mr-2 h-4 w-4" />
                New Overlay
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filter by entity key..."
                  value={entityFilter}
                  onChange={(e) => {
                    setEntityFilter(e.target.value);
                    setValuesPage(1);
                  }}
                  className="pl-9"
                />
              </div>
              <Select
                value={valuesLimit.toString()}
                onValueChange={(v) => {
                  setValuesLimit(parseInt(v));
                  setValuesPage(1);
                }}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIMIT_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt.toString()}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {overlaysLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : overlays.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                No overlays found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background">Entity Key</TableHead>
                      {dynamicFields.map((field) => (
                        <TableHead key={field} className="text-right">
                          {field}
                        </TableHead>
                      ))}
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overlays.map((overlay) => (
                      <TableRow key={overlay.id}>
                        <TableCell className="sticky left-0 bg-background font-mono">
                          {overlay.entity_key as string}
                        </TableCell>
                        {dynamicFields.map((field) => (
                          <TableCell key={field} className="text-right">
                            {overlay[field] != null ? (
                              typeof overlay[field] === "number" ? (
                                <Badge variant="secondary">
                                  {formatValue(overlay[field])}
                                </Badge>
                              ) : (
                                <span className="text-sm">{formatValue(overlay[field])}</span>
                              )
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        ))}
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/overlays/${encodeURIComponent(overlay.id)}/edit?target=${encodeURIComponent(selectedTargetCollection)}`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Dialog
                              open={deleteId === overlay.id}
                              onOpenChange={(open) => setDeleteId(open ? overlay.id : null)}
                            >
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Delete Overlay</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to delete the overlay for{" "}
                                    <strong>{overlay.entity_key as string}</strong>? This action cannot be
                                    undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setDeleteId(null)}>
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleDelete(overlay.id)}
                                    disabled={deleteOverlay.isPending}
                                  >
                                    {deleteOverlay.isPending && (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Delete
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {valuesTotalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {valuesPage} of {valuesTotalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setValuesPage((p) => p - 1)}
                disabled={valuesPage <= 1 || overlaysLoading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setValuesPage((p) => p + 1)}
                disabled={valuesPage >= valuesTotalPages || overlaysLoading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show contexts for selected target collection
  if (selectedTargetCollection) {
    if (contextsLoading) {
      return (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    return (
      <div className="p-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToCollections}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Collections
          </Button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Layers className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold">Overlays for {selectedTargetCollection}</h1>
                <p className="mt-1 text-muted-foreground">
                  {totalContexts} context{totalContexts !== 1 ? "s" : ""} with overlays
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href={`/overlays/new?target=${encodeURIComponent(selectedTargetCollection)}`}>
                <Plus className="mr-2 h-4 w-4" />
                New Overlay
              </Link>
            </Button>
          </div>
        </div>

        {contexts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Layers className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No overlays yet</h3>
              <p className="mb-4 text-center text-muted-foreground">
                Create overlays to apply context-specific values for {selectedTargetCollection}
              </p>
              <Button asChild>
                <Link href={`/overlays/new?target=${encodeURIComponent(selectedTargetCollection)}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Overlay
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Contexts
                <Badge variant="secondary" className="ml-2">
                  {totalContexts}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-4 pt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Filter contexts..."
                    value={contextFilter}
                    onChange={(e) => {
                      setContextFilter(e.target.value);
                      setContextPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={contextLimit.toString()}
                  onValueChange={(v) => {
                    setContextLimit(parseInt(v));
                    setContextPage(1);
                  }}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LIMIT_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt.toString()}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {paginatedContexts.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                  No contexts match your filter
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Context Key</TableHead>
                      <TableHead className="text-right">Overlays</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedContexts.map((context) => (
                      <TableRow
                        key={context.value}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSelectContext(context.value)}
                      >
                        <TableCell className="font-mono">{context.value}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{context.count}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {contextTotalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {contextPage} of {contextTotalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setContextPage((p) => p - 1)}
                disabled={contextPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setContextPage((p) => p + 1)}
                disabled={contextPage >= contextTotalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show target collection list
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Overlays</h1>
            <p className="mt-1 text-muted-foreground">
              Manage context-specific value overrides per collection
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/overlays/new">
            <Plus className="mr-2 h-4 w-4" />
            New Overlay
          </Link>
        </Button>
      </div>

      {(!targetCollections || targetCollections.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Layers className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No overlays yet</h3>
            <p className="mb-4 text-center text-muted-foreground max-w-md">
              Create overlays to apply context-specific values. Overlays are stored per target collection
              using the naming pattern <code className="bg-muted px-1 rounded">overlays_&#123;collection&#125;</code>.
            </p>
            <Button asChild>
              <Link href="/overlays/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Overlay
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Collections with Overlays
              <Badge variant="secondary" className="ml-2">
                {targetCollections.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Select a collection to manage its context-specific overlays
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target Collection</TableHead>
                  <TableHead className="text-right">Overlay Collection</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {targetCollections.map((collection) => (
                  <TableRow
                    key={collection}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSelectTargetCollection(collection)}
                  >
                    <TableCell className="font-mono font-medium">{collection}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">overlays_{collection}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
