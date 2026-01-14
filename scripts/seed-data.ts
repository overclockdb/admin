#!/usr/bin/env npx ts-node

const API_URL = process.env.API_URL || "http://localhost:8190";

const TOTAL_PRODUCTS = 2_000_000;
const BATCH_SIZE = 1_000;
const OVERLAY_PERCENTAGE = 0.05; // 5% of products get overlays
const CONTEXTS = ["customer_vip", "customer_wholesale", "region_eu", "region_us", "promo_summer"];

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${response.status} - ${error}`);
  }

  return response.json() as Promise<T>;
}

async function ensureCollection(name: string, fields: any[]) {
  try {
    await request(`/api/v1/collections/${name}`);
    console.log(`Collection ${name} already exists`);
  } catch {
    await request("/api/v1/collections", {
      method: "POST",
      body: JSON.stringify({ name, fields }),
    });
    console.log(`Created collection ${name}`);
  }
}

async function batchImport(collection: string, documents: any[]) {
  return request<{ imported: number; errors: any[] }>(
    `/api/v1/collections/${collection}/docs/batch`,
    {
      method: "POST",
      body: JSON.stringify({ documents }),
    }
  );
}

function generateProduct(id: number) {
  const categories = ["electronics", "clothing", "home", "sports", "toys", "books", "food", "beauty"];
  const brands = ["BrandA", "BrandB", "BrandC", "BrandD", "BrandE", "Generic"];

  return {
    id: `prod_${id.toString().padStart(8, "0")}`,
    name: `Product ${id}`,
    description: `This is the description for product number ${id}. It contains various features and specifications.`,
    category: categories[id % categories.length],
    brand: brands[id % brands.length],
    base_price: Math.round((10 + Math.random() * 990) * 100) / 100, // $10 - $1000
    stock: Math.floor(Math.random() * 1000),
    rating: Math.round((1 + Math.random() * 4) * 10) / 10, // 1.0 - 5.0
    reviews_count: Math.floor(Math.random() * 5000),
  };
}

function generateOverlay(productId: string, contextKey: string) {
  const baseDiscount = Math.random() * 0.3; // 0-30% discount
  const price = Math.round((10 + Math.random() * 500) * 100) / 100;

  return {
    id: `overlay_${contextKey}_${productId}`,
    context_key: contextKey,
    entity_key: productId,
    price: Math.round(price * (1 - baseDiscount) * 100) / 100,
    discount_percent: Math.round(baseDiscount * 100),
    special_label: contextKey.startsWith("promo_") ? "SALE" : undefined,
  };
}

async function main() {
  console.log("Starting data seed...\n");

  // Ensure products collection exists
  await ensureCollection("products", [
    { name: "name", type: "string", index: true },
    { name: "description", type: "string", index: true },
    { name: "category", type: "string", index: true, facet: true },
    { name: "brand", type: "string", index: true, facet: true },
    { name: "base_price", type: "float", sort: true, facet: true },
    { name: "stock", type: "int32", sort: true },
    { name: "rating", type: "float", sort: true, facet: true },
    { name: "reviews_count", type: "int32", sort: true },
  ]);

  // Ensure _overlays collection exists
  await ensureCollection("_overlays", [
    { name: "context_key", type: "string", index: true, facet: true },
    { name: "entity_key", type: "string", index: true, facet: true },
  ]);

  // Insert products in batches
  console.log(`\nInserting ${TOTAL_PRODUCTS.toLocaleString()} products...`);
  const startTime = Date.now();
  let totalInserted = 0;

  for (let batch = 0; batch < Math.ceil(TOTAL_PRODUCTS / BATCH_SIZE); batch++) {
    const batchStart = batch * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, TOTAL_PRODUCTS);

    const products = [];
    for (let i = batchStart; i < batchEnd; i++) {
      products.push(generateProduct(i));
    }

    const result = await batchImport("products", products);
    totalInserted += result.imported;

    const progress = ((batchEnd / TOTAL_PRODUCTS) * 100).toFixed(1);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate = Math.round(totalInserted / ((Date.now() - startTime) / 1000));

    process.stdout.write(`\r  Progress: ${progress}% (${totalInserted.toLocaleString()} products, ${rate}/sec, ${elapsed}s elapsed)`);
  }

  console.log(`\n  Done! Inserted ${totalInserted.toLocaleString()} products in ${((Date.now() - startTime) / 1000).toFixed(1)}s\n`);

  // Insert overlays for a subset of products
  const overlayCount = Math.floor(TOTAL_PRODUCTS * OVERLAY_PERCENTAGE);
  console.log(`Inserting overlays for ~${overlayCount.toLocaleString()} products across ${CONTEXTS.length} contexts...`);

  const overlayStartTime = Date.now();
  let totalOverlays = 0;
  const overlayBatchSize = 1000;

  // For each context, create overlays for random products
  for (const context of CONTEXTS) {
    console.log(`  Context: ${context}`);
    const contextOverlayCount = Math.floor(overlayCount / CONTEXTS.length);
    let contextInserted = 0;

    for (let batch = 0; batch < Math.ceil(contextOverlayCount / overlayBatchSize); batch++) {
      const overlays = [];
      const batchSize = Math.min(overlayBatchSize, contextOverlayCount - batch * overlayBatchSize);

      for (let i = 0; i < batchSize; i++) {
        // Random product ID
        const productNum = Math.floor(Math.random() * TOTAL_PRODUCTS);
        const productId = `prod_${productNum.toString().padStart(8, "0")}`;
        overlays.push(generateOverlay(productId, context));
      }

      const result = await batchImport("_overlays", overlays);
      contextInserted += result.imported;
      totalOverlays += result.imported;
    }

    console.log(`    Inserted ${contextInserted.toLocaleString()} overlays`);
  }

  console.log(`\n  Done! Inserted ${totalOverlays.toLocaleString()} overlays in ${((Date.now() - overlayStartTime) / 1000).toFixed(1)}s`);

  console.log("\n=== Summary ===");
  console.log(`Products: ${totalInserted.toLocaleString()}`);
  console.log(`Overlays: ${totalOverlays.toLocaleString()}`);
  console.log(`Contexts: ${CONTEXTS.join(", ")}`);
  console.log(`Total time: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
}

main().catch(console.error);
