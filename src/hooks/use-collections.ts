"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCollections,
  getCollection,
  createCollection,
  deleteCollection,
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
