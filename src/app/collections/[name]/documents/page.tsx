"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Upload,
} from "lucide-react";
import { useCollection } from "@/hooks/use-collections";
import { useDeleteDocument, useBatchImport } from "@/hooks/use-documents";
import { useSearch } from "@/hooks/use-search";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { SearchHit } from "@/lib/types";

const PAGE_SIZE = 20;

export default function DocumentsPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = use(params);
  const collectionName = decodeURIComponent(name);
  const { data: collection } = useCollection(collectionName);
  const searchMutation = useSearch(collectionName);
  const deleteDocument = useDeleteDocument(collectionName);
  const batchImport = useBatchImport(collectionName);

  const [page, setPage] = useState(0);
  const [documents, setDocuments] = useState<SearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    searchMutation.mutate(
      { q: "*", limit: PAGE_SIZE, offset: page * PAGE_SIZE },
      {
        onSuccess: (data) => {
          setDocuments(data.hits);
          setTotal(data.found);
        },
      }
    );
  }, [page, collectionName]);

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteDocument.mutateAsync(deleteTarget);
      setDeleteTarget(null);
      searchMutation.mutate(
        { q: "*", limit: PAGE_SIZE, offset: page * PAGE_SIZE },
        {
          onSuccess: (data) => {
            setDocuments(data.hits);
            setTotal(data.found);
          },
        }
      );
    }
  };

  const handleImport = async () => {
    setImportError(null);
    try {
      const parsed = JSON.parse(importJson);
      const docs = Array.isArray(parsed) ? parsed : [parsed];
      if (docs.some((d) => !d.id)) {
        setImportError('All documents must have an "id" field');
        return;
      }
      await batchImport.mutateAsync(docs);
      setShowImportDialog(false);
      setImportJson("");
      searchMutation.mutate(
        { q: "*", limit: PAGE_SIZE, offset: 0 },
        {
          onSuccess: (data) => {
            setDocuments(data.hits);
            setTotal(data.found);
            setPage(0);
          },
        }
      );
    } catch {
      setImportError("Invalid JSON format");
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const displayFields = collection?.fields.slice(0, 4).map((f) => f.name) || [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={`/collections/${encodeURIComponent(collectionName)}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {collectionName}
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Documents</h1>
            <p className="mt-1 text-muted-foreground">
              {total.toLocaleString()} documents in {collectionName}
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Batch Import
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Batch Import Documents</DialogTitle>
                  <DialogDescription>
                    Paste JSON array of documents. Each document must have an
                    &quot;id&quot; field.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>JSON Documents</Label>
                    <Textarea
                      value={importJson}
                      onChange={(e) => setImportJson(e.target.value)}
                      placeholder='[{"id": "1", "title": "Example"}]'
                      className="h-64 font-mono text-sm"
                    />
                  </div>
                  {importError && (
                    <p className="text-sm text-destructive">{importError}</p>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowImportDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={batchImport.isPending || !importJson.trim()}
                  >
                    {batchImport.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Import
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button asChild>
              <Link
                href={`/collections/${encodeURIComponent(collectionName)}/documents/new`}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Document
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {searchMutation.isPending && documents.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2">
              <p className="text-muted-foreground">No documents yet</p>
              <Button asChild size="sm">
                <Link
                  href={`/collections/${encodeURIComponent(collectionName)}/documents/new`}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first document
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    {displayFields.map((field) => (
                      <TableHead key={field}>{field}</TableHead>
                    ))}
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((hit) => (
                    <TableRow key={hit.id}>
                      <TableCell className="font-mono text-sm">
                        <Link
                          href={`/collections/${encodeURIComponent(collectionName)}/documents/${encodeURIComponent(hit.id)}`}
                          className="text-primary hover:underline"
                        >
                          {hit.id}
                        </Link>
                      </TableCell>
                      {displayFields.map((field) => (
                        <TableCell key={field} className="max-w-xs truncate">
                          {formatValue(hit.doc[field])}
                        </TableCell>
                      ))}
                      <TableCell>
                        <Dialog
                          open={deleteTarget === hit.id}
                          onOpenChange={(open) =>
                            setDeleteTarget(open ? hit.id : null)
                          }
                        >
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Document</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete document &quot;
                                {hit.id}&quot;?
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setDeleteTarget(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={deleteDocument.isPending}
                              >
                                {deleteDocument.isPending && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Delete
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages - 1, p + 1))
                      }
                      disabled={page >= totalPages - 1}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (Array.isArray(value)) return value.join(", ");
  return JSON.stringify(value);
}
