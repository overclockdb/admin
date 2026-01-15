"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOverlay,
  getOverlays,
  getOverlayContexts,
  createOverlay,
  updateOverlay,
  deleteOverlay,
  ensureOverlaysCollection,
  getOverlayTargetCollections,
  getAvailableTargetCollections,
  type OverlaySearchParams,
} from "@/lib/api";
import type { OverlayDocument } from "@/lib/types";

// Hook-specific params that allow null targetCollection for disabled queries
interface UseOverlaysParams {
  targetCollection: string | null;
  contextKey?: string;
  entityKeyFilter?: string;
  limit?: number;
  offset?: number;
}

// Get list of collections that have overlay collections
export function useOverlayTargetCollections() {
  return useQuery({
    queryKey: ["overlay-target-collections"],
    queryFn: getOverlayTargetCollections,
  });
}

// Get list of available target collections (for creating new overlays)
export function useAvailableTargetCollections() {
  return useQuery({
    queryKey: ["available-target-collections"],
    queryFn: getAvailableTargetCollections,
  });
}

export function useOverlayContexts(targetCollection: string | null) {
  return useQuery({
    queryKey: ["overlay-contexts", targetCollection],
    queryFn: async () => {
      if (!targetCollection) return { facets: {} };
      await ensureOverlaysCollection(targetCollection);
      return getOverlayContexts(targetCollection);
    },
    enabled: !!targetCollection,
  });
}

export function useOverlays(params: UseOverlaysParams) {
  return useQuery({
    queryKey: ["overlays", params],
    queryFn: async () => {
      if (!params.targetCollection) return { hits: [], found: 0 };
      await ensureOverlaysCollection(params.targetCollection);
      return getOverlays({
        targetCollection: params.targetCollection,
        contextKey: params.contextKey,
        entityKeyFilter: params.entityKeyFilter,
        limit: params.limit,
        offset: params.offset,
      });
    },
    enabled: !!params.targetCollection,
  });
}

export function useOverlay(targetCollection: string | null, id: string | null) {
  return useQuery({
    queryKey: ["overlay", targetCollection, id],
    queryFn: async () => {
      if (!id || !targetCollection) return null;
      await ensureOverlaysCollection(targetCollection);
      return getOverlay(targetCollection, id);
    },
    enabled: !!id && !!targetCollection,
  });
}

export function useCreateOverlay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetCollection, overlay }: { targetCollection: string; overlay: OverlayDocument }) => {
      await ensureOverlaysCollection(targetCollection);
      return createOverlay(targetCollection, overlay);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overlays"] });
      queryClient.invalidateQueries({ queryKey: ["overlay-contexts"] });
      queryClient.invalidateQueries({ queryKey: ["overlay-target-collections"] });
    },
  });
}

export function useUpdateOverlay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ targetCollection, id, overlay }: { targetCollection: string; id: string; overlay: OverlayDocument }) =>
      updateOverlay(targetCollection, id, overlay),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overlays"] });
      queryClient.invalidateQueries({ queryKey: ["overlay-contexts"] });
    },
  });
}

export function useDeleteOverlay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ targetCollection, id }: { targetCollection: string; id: string }) =>
      deleteOverlay(targetCollection, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overlays"] });
      queryClient.invalidateQueries({ queryKey: ["overlay-contexts"] });
    },
  });
}
