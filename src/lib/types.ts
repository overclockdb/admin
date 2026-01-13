// Field types supported by OverclockDB
export type FieldType =
  | "string"
  | "string[]"
  | "int32"
  | "int32[]"
  | "int64"
  | "int64[]"
  | "float"
  | "float[]"
  | "bool"
  | "hierarchy"
  | "attributes";

// Field definition in a collection schema
export interface FieldDefinition {
  name: string;
  type: FieldType;
  index?: boolean;
  facet?: boolean;
  sort?: boolean;
  optional?: boolean;
}

// Collection info returned by API
export interface CollectionInfo {
  name: string;
  num_documents: number;
  fields: FieldDefinition[];
}

// Collection summary in list response
export interface CollectionSummary {
  name: string;
  num_documents: number;
}

// Request to create a collection
export interface CreateCollectionRequest {
  name: string;
  fields: FieldDefinition[];
  enable_stemming?: boolean;
  stem_language?: "english" | "russian";
  enable_stop_words?: boolean;
  stop_words_language?: "english" | "russian" | "none";
  enable_vectors?: boolean;
  vector_fields?: string[];
  num_shards?: number;
}

// List collections response
export interface ListCollectionsResponse {
  collections: CollectionSummary[];
}

// Generic success response
export interface SuccessResponse {
  success: boolean;
  message?: string;
}

// Document (generic JSON object with required id)
export interface Document {
  id: string;
  [key: string]: unknown;
}

// Batch import request
export interface BatchImportRequest {
  documents: Document[];
}

// Batch import response
export interface BatchImportResponse {
  imported: number;
  errors: Array<{
    index: number;
    error: string;
  }>;
}

// Search request
export interface SearchRequest {
  q: string;
  query_by?: string[];
  filter?: string;
  facets?: string[];
  sort_by?: string;
  limit?: number;
  offset?: number;
  overlay?: {
    context_key: string;
    base_field: string;
    strategy: "min" | "override" | "max";
  };
  typo_tolerance?: number;
  vector_search?: boolean;
  hybrid_alpha?: number;
  max_facet_values?: number;
  hierarchy_parent?: string;
  language?: string;
}

// Search hit
export interface SearchHit {
  id: string;
  score: number;
  doc: Document;
  effective_value?: number;
  text_score?: number;
  vector_score?: number;
}

// Facet value with count
export interface FacetValue {
  value: string;
  label?: string;
  count: number;
}

// Hierarchy facet value
export interface HierarchyFacetValue {
  path: string;
  name?: string;
  label?: string;
  count: number;
  depth: number;
  has_children: boolean;
}

// Search response
export interface SearchResponse {
  found: number;
  took_ms: number;
  hits: SearchHit[];
  facets?: Record<string, FacetValue[]>;
  hierarchy_facets?: Record<string, HierarchyFacetValue[]>;
}

// Suggestion response
export interface SuggestResponse {
  suggestions: Array<{
    term: string;
    score: number;
  }>;
  took_ms: number;
}

// API error response
export interface ApiError {
  error: string;
  message: string;
}

// Health check response
export interface HealthResponse {
  status: string;
  version: string;
}
