/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import heroProduct from "../src/data/heroProduct.js";
import { boysItems, girlsDresses, parentsItems } from "../src/data/products.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const products = [heroProduct, ...boysItems, ...girlsDresses, ...parentsItems];

const ensureDir = (p) => {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
};

const feedsDir = path.resolve(__dirname, "../public/feeds");
ensureDir(feedsDir);

// CSV (Google Merchant basic)
const csvHeaders = [
  "id",
  "title",
  "description",
  "link",
  "image_link",
  "price",
  "availability",
  "brand",
  "condition",
  "google_product_category",
];

const toPrice = (p) => `${parseFloat(String(p).replace(/[^0-9.]/g, ""))} BDT`;

const csvRows = [csvHeaders.join(",")];
for (const p of products) {
  csvRows.push(
    [
      p.id,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${(p.description || p.title).replace(/"/g, '""')}"`,
      `"https://www.softwareseba.com/product/${p.id}"`,
      `"${p.image}"`,
      `"${toPrice(p.price)}"`,
      "in_stock",
      "softwareseba",
      "new",
      `"${p.category || "Apparel & Accessories"}"`,
    ].join(",")
  );
}
fs.writeFileSync(path.join(feedsDir, "products.csv"), csvRows.join("\n"));

// Simple XML feed
const xml = [
  `<?xml version="1.0" encoding="UTF-8"?>`,
  `<products>`,
  ...products.map((p) => {
    const price = toPrice(p.price);
    return `  <product>\n    <id>${p.id}</id>\n    <title>${escapeXml(
      p.title
    )}</title>\n    <description>${escapeXml(
      p.description || p.title
    )}</description>\n    <link>https://www.softwareseba.com/product/${p.id}</link>\n    <image_link>${escapeXml(
      p.image
    )}</image_link>\n    <price>${price}</price>\n    <availability>in_stock</availability>\n    <brand>softwareseba</brand>\n    <condition>new</condition>\n    <google_product_category>${escapeXml(
      p.category || "Apparel & Accessories"
    )}</google_product_category>\n  </product>`;
  }),
  `</products>`,
].join("\n");
fs.writeFileSync(path.join(feedsDir, "products.xml"), xml);

console.log("Feeds generated at public/feeds (products.csv, products.xml)");

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}


