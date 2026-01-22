"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCollections,
  getCollection,
  createCollection,
  deleteCollection,
  renameCollection,
  updateCollectionSchema,
} from "@/lib/api";
import type { CreateCollectionRequest } from "@/lib/types";

export function useCollections() {
  return useQuery({
    queryKey: ["collections"],
    queryFn: getCollections,
  });
}

export function useCollection(name: string) {
  return useQuery({
    queryKey: ["collection", name],
    queryFn: () => getCollection(name),
    enabled: !!name,
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCollectionRequest) => createCollection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => deleteCollection(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

export function useRenameCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, newName }: { name: string; newName: string }) =>
      renameCollection(name, newName),
    onSuccess: (_, { newName }) => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["collection", newName] });
    },
  });
}

export function useUpdateSchema() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      name,
      fieldModifications,
    }: {
      name: string;
      fieldModifications: {
        name: string;
        index?: boolean;
        facet?: boolean;
        sort?: boolean;
        optional?: boolean;
      }[];
    }) => updateCollectionSchema(name, fieldModifications),
    onSuccess: (_, { name }) => {
      queryClient.invalidateQueries({ queryKey: ["collection", name] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}
