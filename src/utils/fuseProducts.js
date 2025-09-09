import Fuse from "fuse.js";
import { boysItems, girlsDresses, parentsItems } from "../data/products";

export function getAllProducts() {
  return [
    ...boysItems.map((p) => ({ ...p, category: "men" })),
    ...girlsDresses.map((p) => ({ ...p, category: "women" })),
    ...parentsItems.map((p) => ({ ...p, category: "kids" })),
  ];
}

export function getFuseInstance() {
  const allProducts = getAllProducts();
  return new Fuse(allProducts, {
    keys: ["title", "description", "brand", "category", "keywords"],
    threshold: 0.4,
    distance: 100,
  });
}
