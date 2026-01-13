"use client";

import { useMutation } from "@tanstack/react-query";
import { search } from "@/lib/api";
import type { SearchRequest, SearchResponse } from "@/lib/types";

export function useSearch(collection: string) {
  return useMutation({
    mutationFn: (query: SearchRequest) => search(collection, query),
  });
}

export type { SearchRequest, SearchResponse };
