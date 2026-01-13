"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTranslations, setTranslations } from "@/lib/api";
import type { SetTranslationsRequest } from "@/lib/types";

export function useTranslations(collection: string, field: string) {
  return useQuery({
    queryKey: ["translations", collection, field],
    queryFn: () => getTranslations(collection, field),
    enabled: !!collection && !!field,
  });
}

export function useSetTranslations(collection: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SetTranslationsRequest) =>
      setTranslations(collection, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["translations", collection, variables.field],
      });
    },
  });
}
