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
  /** Whether this field is merge-enabled (for collection merge queries) */
  merge?: boolean;
}

// Collection info returned by API
export interface CollectionInfo {
  name: string;
  num_documents: number;
  fields: FieldDefinition[];
  shard_key?: string;
  num_shards?: number;
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
  shard_key?: string;
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
  /** Collection merge configuration for joining separate collections at query time */
  merge?: {
    collections: string[];
    priority_collection?: string;
    comparison_field?: string;
    strategy: "min" | "max";
    return_fields?: string[];
  };
  typo_tolerance?: number;
  vector_search?: boolean;
  hybrid_alpha?: number;
  max_facet_values?: number;
  hierarchy_parent?: string;
  language?: string;
}

// Merge fields returned in search results (flat map of field -> value)
export type MergeFields = Record<string, number | string>;

// Search hit (standard format with doc wrapper)
export interface SearchHit {
  id: string;
  score: number;
  doc: Document;
  text_score?: number;
  vector_score?: number;
  /** Merge fields from collection merge queries */
  merge_fields?: MergeFields;
}

// Flat search hit (for merge queries - all fields at root level, no doc wrapper)
// Reserved fields: id, score, text_score, vector_score
// All other document and merge fields are flattened to root
export interface FlatSearchHit {
  id: string;
  score: number;
  text_score?: number;
  vector_score?: number;
  // All other fields from document and merge collections
  [key: string]: unknown;
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

// Facet suggestion response
export interface FacetSuggestion {
  field: string;
  score: number;
  reason: string;
  cardinality: number;
  already_facet: boolean;
}

export interface FacetSuggestResponse {
  suggestions: FacetSuggestion[];
  took_ms: number;
}

// Translation types
export interface TranslationLabel {
  [language: string]: string;
}

export interface TranslationEntry {
  value: string;
  labels: TranslationLabel;
}

export interface SetTranslationsRequest {
  field: string;
  translations: TranslationEntry[];
}

export interface FieldTranslationsResponse {
  field: string;
  translations: Record<string, { labels: TranslationLabel }>;
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

// Aggregation Config types
export type PriorityStrategyType = "by_priority" | "min_value" | "max_value" | "first_match" | "all";

export interface AggregationSource {
  collection?: string;
  pattern?: string;
  priority?: number;
  exact?: boolean;
  for_each?: string;
  shard_by?: string;
  condition?: string;
  fields?: Record<string, string>;
}

export interface ComputedField {
  name: string;
  expression: string;
  dependencies?: string[];
}

export interface PriorityStrategy {
  type: PriorityStrategyType;
  field?: string;
  prefer_exact?: boolean;
}

export interface AggregationConfig {
  name: string;
  merge_key: string;
  sources: AggregationSource[];
  priority_strategy: PriorityStrategy;
  computed_fields?: ComputedField[];
}

export interface AggregationConfigSummary {
  name: string;
  merge_key: string;
  num_sources: number;
  num_computed_fields: number;
  strategy_type: string;
}

export interface ListAggregationsResponse {
  configs: AggregationConfigSummary[];
}

// Schema update types
export interface FieldModification {
  name: string;
  index?: boolean;
  facet?: boolean;
  sort?: boolean;
  optional?: boolean;
}

export interface UpdateSchemaRequest {
  field_modifications: FieldModification[];
}

export interface UpdateSchemaResponse {
  name: string;
  documents_reindexed: number;
  message: string;
}
