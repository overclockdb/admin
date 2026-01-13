"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  batchImportDocuments,
} from "@/lib/api";
import type { Document } from "@/lib/types";

export function useDocument(collection: string, id: string) {
  return useQuery({
    queryKey: ["document", collection, id],
    queryFn: () => getDocument(collection, id),
    enabled: !!collection && !!id,
  });
}

export function useCreateDocument(collection: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (doc: Document) => createDocument(collection, doc),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection", collection] });
      queryClient.invalidateQueries({ queryKey: ["search", collection] });
    },
  });
}

export function useUpdateDocument(collection: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, doc }: { id: string; doc: Document }) =>
      updateDocument(collection, id, doc),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["document", collection, variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["search", collection] });
    },
  });
}

export function useDeleteDocument(collection: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDocument(collection, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection", collection] });
      queryClient.invalidateQueries({ queryKey: ["search", collection] });
    },
  });
}

export function useBatchImport(collection: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documents: Document[]) =>
      batchImportDocuments(collection, documents),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection", collection] });
      queryClient.invalidateQueries({ queryKey: ["search", collection] });
    },
  });
}
