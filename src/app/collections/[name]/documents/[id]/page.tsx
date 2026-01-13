"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";
import { useDocument, useUpdateDocument, useDeleteDocument } from "@/hooks/use-documents";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ name: string; id: string }>;
}) {
  const { name, id } = use(params);
  const collectionName = decodeURIComponent(name);
  const docId = decodeURIComponent(id);
  const router = useRouter();

  const { data: document, isLoading, error } = useDocument(collectionName, docId);
  const updateDocument = useUpdateDocument(collectionName);
  const deleteDocument = useDeleteDocument(collectionName);

  const [json, setJson] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (document) {
      setJson(JSON.stringify(document, null, 2));
    }
  }, [document]);

  const handleSave = async () => {
    setSaveError(null);
    try {
      const doc = JSON.parse(json);
      if (doc.id !== docId) {
        setSaveError("Cannot change document ID");
        return;
      }
      await updateDocument.mutateAsync({ id: docId, doc });
    } catch (err) {
      if (err instanceof SyntaxError) {
        setSaveError("Invalid JSON format");
      } else {
        setSaveError(
          err instanceof Error ? err.message : "Failed to update document"
        );
      }
    }
  };

  const handleDelete = async () => {
    await deleteDocument.mutateAsync(docId);
    router.push(`/collections/${encodeURIComponent(collectionName)}/documents`);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="p-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link
            href={`/collections/${encodeURIComponent(collectionName)}/documents`}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Documents
          </Link>
        </Button>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              Document not found
            </CardTitle>
            <CardDescription>
              The document &quot;{docId}&quot; does not exist.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold font-mono">{docId}</h1>
            <p className="mt-1 text-muted-foreground">
              Document in {collectionName}
            </p>
          </div>
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Document</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete document &quot;{docId}&quot;?
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
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
        </div>
      </div>

      <div className="max-w-3xl space-y-6">
        {saveError && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="pt-4 text-destructive">
              {saveError}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Document JSON</CardTitle>
            <CardDescription>
              Edit the document. The ID field cannot be changed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="json">JSON</Label>
              <Textarea
                id="json"
                value={json}
                onChange={(e) => setJson(e.target.value)}
                className="h-96 font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button onClick={handleSave} disabled={updateDocument.isPending}>
            {updateDocument.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
          <Button variant="outline" asChild>
            <Link
              href={`/collections/${encodeURIComponent(collectionName)}/documents`}
            >
              Cancel
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
