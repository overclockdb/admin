"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPricingSchemas,
  getPricingSchema,
  createPricingSchema,
  updatePricingSchema,
  deletePricingSchema,
} from "@/lib/api";
import type { PricingSchema } from "@/lib/types";

export function usePricingSchemas() {
  return useQuery({
    queryKey: ["pricing-schemas"],
    queryFn: getPricingSchemas,
  });
}

export function usePricingSchema(name: string) {
  return useQuery({
    queryKey: ["pricing-schema", name],
    queryFn: () => getPricingSchema(name),
    enabled: !!name,
  });
}

export function useCreatePricingSchema() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (schema: PricingSchema) => createPricingSchema(schema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-schemas"] });
    },
  });
}

export function useUpdatePricingSchema() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, schema }: { name: string; schema: PricingSchema }) =>
      updatePricingSchema(name, schema),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pricing-schemas"] });
      queryClient.invalidateQueries({
        queryKey: ["pricing-schema", variables.name],
      });
    },
  });
}

export function useDeletePricingSchema() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => deletePricingSchema(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-schemas"] });
    },
  });
}
