"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, FileText, Trash2, Loader2, Languages, Lightbulb } from "lucide-react";
import { useCollection, useDeleteCollection } from "@/hooks/use-collections";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { useState } from "react";

export default function CollectionDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = use(params);
  const decodedName = decodeURIComponent(name);
  const router = useRouter();
  const { data: collection, isLoading, error } = useCollection(decodedName);
  const deleteCollection = useDeleteCollection();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    await deleteCollection.mutateAsync(decodedName);
    router.push("/collections");
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="p-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/collections">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Collections
          </Link>
        </Button>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              Collection not found
            </CardTitle>
            <CardDescription>
              The collection &quot;{decodedName}&quot; does not exist.
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
          <Link href="/collections">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Collections
          </Link>
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{collection.name}</h1>
            <p className="mt-1 text-muted-foreground">
              <Badge variant="secondary" className="mr-2">
                {collection.num_documents.toLocaleString()} documents
              </Badge>
              <Badge variant="outline" className="mr-2">
                {collection.fields.length} fields
              </Badge>
              {collection.shard_key && collection.num_shards && (
                <Badge variant="default" className="mr-2">
                  Shard-keyed: {collection.shard_key} ({collection.num_shards} shards)
                </Badge>
              )}
              {collection.num_shards && !collection.shard_key && (
                <Badge variant="default">
                  {collection.num_shards} shards (doc ID)
                </Badge>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href={`/collections/${encodeURIComponent(decodedName)}/search`}>
                <Search className="mr-2 h-4 w-4" />
                Search
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/collections/${encodeURIComponent(decodedName)}/documents`}>
                <FileText className="mr-2 h-4 w-4" />
                Documents
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/collections/${encodeURIComponent(decodedName)}/translations`}>
                <Languages className="mr-2 h-4 w-4" />
                Translations
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/collections/${encodeURIComponent(decodedName)}/suggest`}>
                <Lightbulb className="mr-2 h-4 w-4" />
                Suggest
              </Link>
            </Button>
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Collection</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete &quot;{collection.name}
                    &quot;? This action cannot be undone and will delete all{" "}
                    {collection.num_documents.toLocaleString()} documents.
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
                    disabled={deleteCollection.isPending}
                  >
                    {deleteCollection.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schema</CardTitle>
          <CardDescription>
            Field definitions for this collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Index</TableHead>
                <TableHead>Facet</TableHead>
                <TableHead>Sort</TableHead>
                <TableHead>Optional</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collection.fields.map((field) => (
                <TableRow key={field.name}>
                  <TableCell className="font-medium">{field.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{field.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {field.index !== false ? (
                      <Badge>Yes</Badge>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {field.facet ? (
                      <Badge>Yes</Badge>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {field.sort ? (
                      <Badge>Yes</Badge>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {field.optional ? (
                      <Badge variant="secondary">Yes</Badge>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
