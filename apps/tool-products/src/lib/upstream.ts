const DUMMYJSON_BASE_URL = "https://dummyjson.com";

export const buildProductsUrl = (params: {
  limit?: string;
  skip?: string;
  sortBy?: string;
  order?: string;
  q?: string;
}) => {
  const url = new URL(`${DUMMYJSON_BASE_URL}/products`);

  if (params.limit) url.searchParams.set("limit", params.limit);
  if (params.skip) url.searchParams.set("skip", params.skip);
  if (params.sortBy) url.searchParams.set("sortBy", params.sortBy);
  if (params.order) url.searchParams.set("order", params.order);

  if (params.q) {
    url.pathname = "/products/search";
    url.searchParams.set("q", params.q);
  }

  return url.toString();
};

export const buildCategoriesUrl = () => {
  return `${DUMMYJSON_BASE_URL}/products/categories`;
};

export const buildProductsByCategoryUrl = (
  slug: string,
  params: {
    limit?: string;
    skip?: string;
    sortBy?: string;
    order?: string;
  }
) => {
  const url = new URL(
    `${DUMMYJSON_BASE_URL}/products/category/${encodeURIComponent(slug)}`
  );

  if (params.limit) url.searchParams.set("limit", params.limit);
  if (params.skip) url.searchParams.set("skip", params.skip);
  if (params.sortBy) url.searchParams.set("sortBy", params.sortBy);
  if (params.order) url.searchParams.set("order", params.order);

  return url.toString();
};
