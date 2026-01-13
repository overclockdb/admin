"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOverlays,
  getOverlayContexts,
  createOverlay,
  updateOverlay,
  deleteOverlay,
  ensureOverlaysCollection,
  type OverlaySearchParams,
} from "@/lib/api";
import type { OverlayDocument } from "@/lib/types";

export function useOverlayContexts() {
  return useQuery({
    queryKey: ["overlay-contexts"],
    queryFn: async () => {
      await ensureOverlaysCollection();
      return getOverlayContexts();
    },
  });
}

export function useOverlays(params: OverlaySearchParams = {}) {
  return useQuery({
    queryKey: ["overlays", params],
    queryFn: async () => {
      await ensureOverlaysCollection();
      return getOverlays(params);
    },
  });
}

export function useCreateOverlay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (overlay: OverlayDocument) => {
      await ensureOverlaysCollection();
      return createOverlay(overlay);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overlays"] });
      queryClient.invalidateQueries({ queryKey: ["overlay-contexts"] });
    },
  });
}

export function useUpdateOverlay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, overlay }: { id: string; overlay: OverlayDocument }) =>
      updateOverlay(id, overlay),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overlays"] });
      queryClient.invalidateQueries({ queryKey: ["overlay-contexts"] });
    },
  });
}

export function useDeleteOverlay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteOverlay(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overlays"] });
      queryClient.invalidateQueries({ queryKey: ["overlay-contexts"] });
    },
  });
}
