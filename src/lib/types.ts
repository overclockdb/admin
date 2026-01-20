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

// Pricing Schema types
export type ApplyOn = "MSRP" | "DELIVERY_PRICE" | "DEFAULT_PRICE";
export type CalcType = "PERCENT" | "ABSOLUTE";
export type PriceType = "DEFAULT_PRICE" | "SALE_PRICE" | "END_PRICE";

export interface BaseFields {
  msrp?: string;
  delivery_price?: string;
}

export interface PriceLayer {
  pattern?: string;
  collection?: string;
  shard_by?: string;
  priority: number;
  for_each?: string;
  exact_price?: boolean;
  condition?: string;
}

export interface PriceRulesConfig {
  layers: PriceLayer[];
  apply_on_field: string;
  calculate_type_field: string;
  amount_field: string;
}

export interface DirectPricesConfig {
  layers: PriceLayer[];
  price_field: string;
  type_field?: string;
  allow_line_discount_field?: string;
}

export interface DiscountRulesConfig {
  layers: PriceLayer[];
  condition?: string;
  calculate_type_field: string;
  amount_field: string;
}

export interface ResolutionConfig {
  priority_order?: string[];
  search_exact_price: boolean;
}

export interface PricingSchema {
  name: string;
  base_fields?: BaseFields;
  price_rules?: PriceRulesConfig;
  direct_prices?: DirectPricesConfig;
  discount_rules?: DiscountRulesConfig;
  price_layers?: PriceLayer[];
  discount_layers?: PriceLayer[];
  resolution: ResolutionConfig;
  compute: Record<string, string>;
}

export interface PricingSchemaSummary {
  name: string;
  has_price_rules: boolean;
  has_direct_prices: boolean;
  has_discount_rules: boolean;
  num_price_layers: number;
  num_discount_layers: number;
}

export interface ListPricingSchemasResponse {
  schemas: PricingSchemaSummary[];
}
