const FRANKFURTER_BASE_URL = "https://api.frankfurter.dev/v1";

export const buildLatestRatesUrl = (params: {
  base?: string;
  symbols?: string;
}) => {
  const url = new URL(`${FRANKFURTER_BASE_URL}/latest`);

  if (params.base) {
    url.searchParams.set("base", params.base.toUpperCase());
  }

  if (params.symbols) {
    url.searchParams.set("symbols", params.symbols.toUpperCase());
  }

  return url.toString();
};

export const buildCurrenciesUrl = () => {
  return `${FRANKFURTER_BASE_URL}/currencies`;
};
