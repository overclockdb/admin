#!/usr/bin/env npx ts-node

const API_URL = process.env.API_URL || "http://localhost:8190";

const TOTAL_PRODUCTS = 50_000; // Smaller default for quicker testing
const BATCH_SIZE = 1_000;
const PRICE_COVERAGE = 0.3; // 30% of products get prices in each merge collection

// Merge collections - each represents a separate pricing context
const MERGE_COLLECTIONS = [
  "prices_customer_vip",
  "prices_customer_wholesale",
  "prices_region_eu",
  "prices_region_us",
  "prices_promo_summer"
];

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

async function deleteCollection(name: string) {
  try {
    await request(`/api/v1/collections/${name}`, { method: "DELETE" });
    console.log(`Deleted collection ${name}`);
  } catch {
    // Collection doesn't exist, ignore
  }
}

async function createCollection(name: string, fields: Record<string, unknown>[], options: Record<string, unknown> = {}) {
  await request("/api/v1/collections", {
    method: "POST",
    body: JSON.stringify({ name, fields, ...options }),
  });
  console.log(`Created collection ${name}`);
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
  const categories = ["Electronics", "Clothing", "Home", "Sports", "Toys", "Books", "Food", "Beauty"];
  const brands = ["Apple", "Samsung", "Sony", "Nike", "Adidas", "Generic", "LG", "Dell"];

  return {
    id: `prod_${id.toString().padStart(8, "0")}`,
    title: `Product ${id} - ${brands[id % brands.length]} ${categories[id % categories.length]} Item`,
    description: `This is the description for product number ${id}. It contains various features and specifications.`,
    category: categories[id % categories.length],
    brand: brands[id % brands.length],
    default_price: Math.round((10 + Math.random() * 990) * 100) / 100, // $10 - $1000
    stock: Math.floor(Math.random() * 1000),
    rating: Math.round((1 + Math.random() * 4) * 10) / 10, // 1.0 - 5.0
  };
}

function generateMergePrice(productId: string, collectionName: string) {
  // Different pricing strategies for different contexts
  const basePrice = 10 + Math.random() * 500;
  let discount = 0;

  if (collectionName.includes("vip")) {
    discount = 0.15 + Math.random() * 0.15; // 15-30% VIP discount
  } else if (collectionName.includes("wholesale")) {
    discount = 0.20 + Math.random() * 0.20; // 20-40% wholesale discount
  } else if (collectionName.includes("promo")) {
    discount = 0.10 + Math.random() * 0.25; // 10-35% promo discount
  } else if (collectionName.includes("region_eu")) {
    discount = -0.10 + Math.random() * 0.15; // -10% to +5% (EU premium/discount)
  } else if (collectionName.includes("region_us")) {
    discount = Math.random() * 0.10; // 0-10% US discount
  }

  const price = Math.round(basePrice * (1 - discount) * 100) / 100;
  const discountPercent = Math.round(discount * 100);

  return {
    id: productId, // Same as product ID for merge join
    price,
    discount: discountPercent,
    in_stock: Math.random() > 0.1, // 90% in stock
  };
}

async function main() {
  console.log("========================================");
  console.log("  OverclockDB Seed Data (Collection Merge)");
  console.log("========================================");
  console.log(`API URL:      ${API_URL}`);
  console.log(`Products:     ${TOTAL_PRODUCTS.toLocaleString()}`);
  console.log(`Merge colls:  ${MERGE_COLLECTIONS.length}`);
  console.log(`Price coverage: ${PRICE_COVERAGE * 100}%`);
  console.log("========================================\n");

  // Delete existing collections
  console.log("Cleaning up existing collections...");
  await deleteCollection("products");
  for (const coll of MERGE_COLLECTIONS) {
    await deleteCollection(coll);
  }

  // Create products collection
  console.log("\nCreating products collection...");
  await createCollection("products", [
    { name: "title", type: "string", index: true },
    { name: "description", type: "string", index: true },
    { name: "category", type: "string", index: true, facet: true },
    { name: "brand", type: "string", index: true, facet: true },
    { name: "default_price", type: "float", sort: true },
    { name: "stock", type: "int32", sort: true },
    { name: "rating", type: "float", sort: true, facet: true },
  ]);

  // Create merge-enabled pricing collections
  console.log("\nCreating merge-enabled pricing collections...");
  for (const collName of MERGE_COLLECTIONS) {
    await createCollection(collName, [
      { name: "price", type: "float", merge: true, sort: true },
      { name: "discount", type: "int32", merge: true },
      { name: "in_stock", type: "bool", merge: true },
    ]);
  }

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

  // Insert prices into each merge collection
  const priceCount = Math.floor(TOTAL_PRODUCTS * PRICE_COVERAGE);
  console.log(`Inserting prices into ${MERGE_COLLECTIONS.length} merge collections (~${priceCount.toLocaleString()} each)...`);

  const priceStartTime = Date.now();
  let totalPrices = 0;

  for (const collName of MERGE_COLLECTIONS) {
    console.log(`\n  ${collName}:`);
    let collInserted = 0;
    const collStartTime = Date.now();

    // Generate random product indices to price
    const productIndices = new Set<number>();
    while (productIndices.size < priceCount) {
      productIndices.add(Math.floor(Math.random() * TOTAL_PRODUCTS));
    }
    const sortedIndices = Array.from(productIndices).sort((a, b) => a - b);

    // Batch insert prices
    for (let batch = 0; batch < Math.ceil(sortedIndices.length / BATCH_SIZE); batch++) {
      const batchStart = batch * BATCH_SIZE;
      const batchEnd = Math.min(batchStart + BATCH_SIZE, sortedIndices.length);
      const batchIndices = sortedIndices.slice(batchStart, batchEnd);

      const prices = batchIndices.map(i => {
        const productId = `prod_${i.toString().padStart(8, "0")}`;
        return generateMergePrice(productId, collName);
      });

      const result = await batchImport(collName, prices);
      collInserted += result.imported;
      totalPrices += result.imported;
    }

    const collElapsed = ((Date.now() - collStartTime) / 1000).toFixed(1);
    console.log(`    Inserted ${collInserted.toLocaleString()} prices in ${collElapsed}s`);
  }

  console.log(`\n  Done! Inserted ${totalPrices.toLocaleString()} total prices in ${((Date.now() - priceStartTime) / 1000).toFixed(1)}s`);

  // Print summary and example search
  console.log("\n========================================");
  console.log("  Summary");
  console.log("========================================");
  console.log(`Products:     ${totalInserted.toLocaleString()}`);
  console.log(`Prices:       ${totalPrices.toLocaleString()} total`);
  console.log(`Merge colls:  ${MERGE_COLLECTIONS.join(", ")}`);
  console.log(`Total time:   ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

  console.log("\n========================================");
  console.log("  Example Search with Collection Merge");
  console.log("========================================");
  console.log(`
POST ${API_URL}/api/v1/collections/products/search
{
  "q": "laptop",
  "merge": {
    "collections": ["prices_customer_vip", "prices_region_us"],
    "priority_collection": "prices_customer_vip",
    "comparison_field": "price",
    "strategy": "min",
    "return_fields": ["price", "discount"]
  },
  "sort_by": "price:asc",
  "limit": 10
}
`);
}

main().catch(console.error);
