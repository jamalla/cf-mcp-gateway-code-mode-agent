# tool-products

**Cloudflare Worker · Tool Layer (called in Step 3)**

Live URL: `https://cf-tool-products.to-jamz.workers.dev`

## What it does

Provides a **product catalog** for the demo scenario. It is a thin proxy over the public [DummyJSON](https://dummyjson.com/products) API, reformatting responses into a consistent `{ ok, source, data }` envelope.

The sandbox runner calls this worker via a **Cloudflare service binding** (not a direct HTTP call) when `products` is in the selected tools list. Using a service binding keeps latency near-zero and avoids the cross-`workers.dev` routing restrictions that affect plain `fetch()` calls between workers.

## Sequence position

```
[1] agent-web  ──► mcp-gateway /specs
[2]            ──► agent-py /plan
[3]            ──► sandbox-runner /execute
                       ├─► tool-products /products   ◄── you are here
                       ├─► tool-fx /rates
                       └─► tool-cart-intel /analyze
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Service info and link index |
| GET | `/health` | Liveness check |
| GET | `/products` | List products (supports `limit`, `skip`, `sortBy`, `order`, `q`) |
| GET | `/products/categories` | List all product categories |
| GET | `/products/category/:slug` | Products filtered by category slug (e.g. `smartphones`) |

### Example — list 8 products

```bash
curl "https://cf-tool-products.to-jamz.workers.dev/products?limit=8"
```

```json
{
  "ok": true,
  "source": "dummyjson",
  "data": {
    "products": [ ... ],
    "total": 194,
    "skip": 0,
    "limit": 8
  }
}
```

### Example — smartphones only

```bash
curl "https://cf-tool-products.to-jamz.workers.dev/products/category/smartphones"
```

## Stack

- Runtime: Cloudflare Workers (TypeScript, Hono)
- Upstream: DummyJSON public REST API
- Called by: `sandbox-runner` via service binding `PRODUCTS_SERVICE`
