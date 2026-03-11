export type ToolSpecEntry = {
  key: string;
  name: string;
  version: string;
  description: string;
  fileName: string;
};

export const TOOL_SPECS: ToolSpecEntry[] = [
  {
    key: "products",
    name: "Trending Products Tool",
    version: "1.0.0",
    description: "Public product catalog and trending product retrieval tool.",
    fileName: "products.openapi.json"
  },
  {
    key: "fx",
    name: "FX Rates Tool",
    version: "1.0.0",
    description: "Exchange-rate retrieval tool for price normalization.",
    fileName: "fx.openapi.json"
  },
  {
    key: "cart-intel",
    name: "Cart Intelligence Tool",
    version: "1.0.0",
    description: "Cart and shortlist analysis tool.",
    fileName: "cart-intel.openapi.json"
  }
];
