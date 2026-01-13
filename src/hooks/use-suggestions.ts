"use client";

import { useQuery } from "@tanstack/react-query";
import { getSuggestions, getFacetSuggestions } from "@/lib/api";

export function useSuggestions(
  collection: string,
  prefix: string,
  limit: number = 5
) {
  return useQuery({
    queryKey: ["suggestions", collection, prefix, limit],
    queryFn: () => getSuggestions(collection, prefix, limit),
    enabled: !!collection && prefix.length > 0,
  });
}

export function useFacetSuggestions(collection: string) {
  return useQuery({
    queryKey: ["facet-suggestions", collection],
    queryFn: () => getFacetSuggestions(collection),
    enabled: !!collection,
  });
}
