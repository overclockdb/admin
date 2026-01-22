"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAggregations,
  getAggregation,
  createAggregation,
  updateAggregation,
  deleteAggregation,
} from "@/lib/api";
import type { AggregationConfig } from "@/lib/types";

export function useAggregations() {
  return useQuery({
    queryKey: ["aggregations"],
    queryFn: getAggregations,
  });
}

export function useAggregation(name: string) {
  return useQuery({
    queryKey: ["aggregation", name],
    queryFn: () => getAggregation(name),
    enabled: !!name,
  });
}

export function useCreateAggregation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: AggregationConfig) => createAggregation(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aggregations"] });
    },
  });
}

export function useUpdateAggregation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, config }: { name: string; config: AggregationConfig }) =>
      updateAggregation(name, config),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["aggregations"] });
      queryClient.invalidateQueries({
        queryKey: ["aggregation", variables.name],
      });
    },
  });
}

export function useDeleteAggregation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => deleteAggregation(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aggregations"] });
    },
  });
}
