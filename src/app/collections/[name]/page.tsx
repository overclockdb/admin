"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, FileText, Trash2, Loader2, Languages, Lightbulb, Pencil, Settings2 } from "lucide-react";
import { useCollection, useDeleteCollection, useRenameCollection, useUpdateSchema } from "@/hooks/use-collections";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const renameCollection = useRenameCollection();
  const updateSchema = useUpdateSchema();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showSchemaDialog, setShowSchemaDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [fieldChanges, setFieldChanges] = useState<Record<string, { index?: boolean; facet?: boolean; sort?: boolean; optional?: boolean }>>({});

  const handleDelete = async () => {
    await deleteCollection.mutateAsync(decodedName);
    router.push("/collections");
  };

  const handleRename = async () => {
    if (!newName.trim() || newName === decodedName) return;
    await renameCollection.mutateAsync({ name: decodedName, newName: newName.trim() });
    router.push(`/collections/${encodeURIComponent(newName.trim())}`);
  };

  const openRenameDialog = () => {
    setNewName(decodedName);
    setShowRenameDialog(true);
  };

  const openSchemaDialog = () => {
    setFieldChanges({});
    setShowSchemaDialog(true);
  };

  const handleFieldChange = (
    fieldName: string,
    property: "index" | "facet" | "sort" | "optional",
    value: boolean
  ) => {
    setFieldChanges((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        [property]: value,
      },
    }));
  };

  const handleSaveSchema = async () => {
    const modifications = Object.entries(fieldChanges).map(([name, changes]) => ({
      name,
      ...changes,
    }));
    if (modifications.length === 0) return;
    await updateSchema.mutateAsync({
      name: decodedName,
      fieldModifications: modifications,
    });
    setShowSchemaDialog(false);
    setFieldChanges({});
  };

  const hasSchemaChanges = Object.keys(fieldChanges).length > 0;

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
            <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={openRenameDialog}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rename Collection</DialogTitle>
                  <DialogDescription>
                    Enter a new name for the collection &quot;{collection.name}&quot;.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="newName">New Name</Label>
                  <Input
                    id="newName"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Enter new collection name"
                    className="mt-2"
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowRenameDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRename}
                    disabled={renameCollection.isPending || !newName.trim() || newName === decodedName}
                  >
                    {renameCollection.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Rename
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={showSchemaDialog} onOpenChange={setShowSchemaDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={openSchemaDialog}>
                  <Settings2 className="mr-2 h-4 w-4" />
                  Edit Schema
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Edit Schema</DialogTitle>
                  <DialogDescription>
                    Modify field properties. This will trigger a full reindex of all{" "}
                    {collection.num_documents.toLocaleString()} documents.
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-96 overflow-auto">
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
                            <Switch
                              checked={fieldChanges[field.name]?.index ?? field.index !== false}
                              onCheckedChange={(checked) =>
                                handleFieldChange(field.name, "index", checked)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={fieldChanges[field.name]?.facet ?? field.facet === true}
                              onCheckedChange={(checked) =>
                                handleFieldChange(field.name, "facet", checked)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={fieldChanges[field.name]?.sort ?? field.sort === true}
                              onCheckedChange={(checked) =>
                                handleFieldChange(field.name, "sort", checked)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={fieldChanges[field.name]?.optional ?? field.optional === true}
                              onCheckedChange={(checked) =>
                                handleFieldChange(field.name, "optional", checked)
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowSchemaDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveSchema}
                    disabled={updateSchema.isPending || !hasSchemaChanges}
                  >
                    {updateSchema.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Save &amp; Reindex
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
              {/* Implicit document ID field */}
              <TableRow className="bg-muted/30">
                <TableCell className="font-medium">
                  id
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Document ID
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">string</Badge>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">No</span>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">No</span>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">No</span>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">No</span>
                </TableCell>
              </TableRow>
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
