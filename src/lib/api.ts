import type {
  CollectionInfo,
  CreateCollectionRequest,
  ListCollectionsResponse,
  SuccessResponse,
  Document,
  BatchImportRequest,
  BatchImportResponse,
  SearchRequest,
  SearchResponse,
  HealthResponse,
  ApiError,
  SuggestResponse,
  FacetSuggestResponse,
  SetTranslationsRequest,
  FieldTranslationsResponse,
  OverlayDocument,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8108";

class ApiClientError extends Error {
  constructor(
    public status: number,
    public error: ApiError
  ) {
    super(error.message);
    this.name = "ApiClientError";
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw new ApiClientError(response.status, error);
  }

  return response.json() as Promise<T>;
}

// Health endpoints
export async function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/health");
}

export async function getReady(): Promise<HealthResponse> {
  return request<HealthResponse>("/ready");
}

// Collection endpoints
export async function getCollections(): Promise<ListCollectionsResponse> {
  return request<ListCollectionsResponse>("/api/v1/collections");
}

export async function getCollection(name: string): Promise<CollectionInfo> {
  return request<CollectionInfo>(`/api/v1/collections/${encodeURIComponent(name)}`);
}

export async function createCollection(
  data: CreateCollectionRequest
): Promise<CollectionInfo> {
  return request<CollectionInfo>("/api/v1/collections", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteCollection(name: string): Promise<SuccessResponse> {
  return request<SuccessResponse>(`/api/v1/collections/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
}

// Document endpoints
export async function getDocument(
  collection: string,
  id: string
): Promise<Document> {
  return request<Document>(
    `/api/v1/collections/${encodeURIComponent(collection)}/docs/${encodeURIComponent(id)}`
  );
}

export async function createDocument(
  collection: string,
  doc: Document
): Promise<{ id: string; success: boolean }> {
  return request<{ id: string; success: boolean }>(
    `/api/v1/collections/${encodeURIComponent(collection)}/docs`,
    {
      method: "POST",
      body: JSON.stringify(doc),
    }
  );
}

export async function updateDocument(
  collection: string,
  id: string,
  doc: Document
): Promise<{ id: string; success: boolean }> {
  return request<{ id: string; success: boolean }>(
    `/api/v1/collections/${encodeURIComponent(collection)}/docs/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify(doc),
    }
  );
}

export async function deleteDocument(
  collection: string,
  id: string
): Promise<SuccessResponse> {
  return request<SuccessResponse>(
    `/api/v1/collections/${encodeURIComponent(collection)}/docs/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );
}

export async function batchImportDocuments(
  collection: string,
  documents: Document[]
): Promise<BatchImportResponse> {
  const body: BatchImportRequest = { documents };
  return request<BatchImportResponse>(
    `/api/v1/collections/${encodeURIComponent(collection)}/docs/batch`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

// Search endpoints
export async function search(
  collection: string,
  query: SearchRequest
): Promise<SearchResponse> {
  return request<SearchResponse>(
    `/api/v1/collections/${encodeURIComponent(collection)}/search`,
    {
      method: "POST",
      body: JSON.stringify(query),
    }
  );
}

// Suggestion endpoints
export async function getSuggestions(
  collection: string,
  prefix: string,
  limit: number = 5
): Promise<SuggestResponse> {
  const params = new URLSearchParams({ prefix, limit: limit.toString() });
  return request<SuggestResponse>(
    `/api/v1/collections/${encodeURIComponent(collection)}/suggest?${params}`
  );
}

export async function getFacetSuggestions(
  collection: string
): Promise<FacetSuggestResponse> {
  return request<FacetSuggestResponse>(
    `/api/v1/collections/${encodeURIComponent(collection)}/suggest-facets`
  );
}

// Translation endpoints
export async function setTranslations(
  collection: string,
  data: SetTranslationsRequest
): Promise<SuccessResponse> {
  return request<SuccessResponse>(
    `/api/v1/collections/${encodeURIComponent(collection)}/translations`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

export async function getTranslations(
  collection: string,
  field: string
): Promise<FieldTranslationsResponse> {
  return request<FieldTranslationsResponse>(
    `/api/v1/collections/${encodeURIComponent(collection)}/translations/${encodeURIComponent(field)}`
  );
}

// Overlay endpoints (using _overlays collection)
const OVERLAYS_COLLECTION = "_overlays";

export interface OverlaySearchParams {
  contextKey?: string;
  entityKeyFilter?: string;
  limit?: number;
  offset?: number;
}

export async function getOverlays(params: OverlaySearchParams = {}): Promise<SearchResponse> {
  const { contextKey, entityKeyFilter, limit = 10, offset = 0 } = params;

  let filter: string | undefined;
  if (contextKey) {
    filter = `context_key:=${contextKey}`;
    if (entityKeyFilter) {
      filter += ` AND entity_key:${entityKeyFilter}`;
    }
  } else if (entityKeyFilter) {
    filter = `entity_key:${entityKeyFilter}`;
  }

  return search(OVERLAYS_COLLECTION, {
    q: "*",
    filter,
    facets: ["context_key"],
    limit,
    offset: offset > 0 ? offset : undefined,
  });
}

export async function getOverlayContexts(): Promise<SearchResponse> {
  return search(OVERLAYS_COLLECTION, {
    q: "*",
    facets: ["context_key"],
    limit: 0,
    max_facet_values: 1000,
  });
}

export async function getOverlay(id: string): Promise<OverlayDocument> {
  return getDocument(OVERLAYS_COLLECTION, id) as Promise<OverlayDocument>;
}

export async function createOverlay(
  overlay: OverlayDocument
): Promise<{ id: string; success: boolean }> {
  return createDocument(OVERLAYS_COLLECTION, overlay);
}

export async function updateOverlay(
  id: string,
  overlay: OverlayDocument
): Promise<{ id: string; success: boolean }> {
  return updateDocument(OVERLAYS_COLLECTION, id, overlay);
}

export async function deleteOverlay(id: string): Promise<SuccessResponse> {
  return deleteDocument(OVERLAYS_COLLECTION, id);
}

export async function ensureOverlaysCollection(): Promise<CollectionInfo> {
  try {
    return await getCollection(OVERLAYS_COLLECTION);
  } catch {
    // Create collection with only required fields - additional fields are dynamic
    return createCollection({
      name: OVERLAYS_COLLECTION,
      fields: [
        { name: "context_key", type: "string", index: true, facet: true },
        { name: "entity_key", type: "string", index: true, facet: true },
      ],
    });
  }
}

export { ApiClientError };
