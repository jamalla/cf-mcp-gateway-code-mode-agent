# tool-cart-intel

**Cloudflare Worker · Tool Layer (called in Step 3)**

Live URL: `https://cf-tool-cart-intel.to-jamz.workers.dev`

## What it does

Performs **product ranking and shortlist generation**. Given a list of product candidates with prices, ratings, and stock status — plus a currency rate map — it normalizes prices to a target currency and returns a ranked shortlist based on configurable preferences.

This is a fully self-contained computation worker with no external upstream dependency. It ranks products deterministically using the preference weights passed in the request body. In the demo scenario it receives products from `tool-products` and exchange rates from `tool-fx` (consolidated by the sandbox runner) to produce a MYR-normalized shortlist.

## Sequence position

```
[1] agent-web  ──► mcp-gateway /specs
[2]            ──► agent-py /plan
[3]            ──► sandbox-runner /execute
                       ├─► tool-products /products
                       ├─► tool-fx /rates
                       └─► tool-cart-intel /analyze  ◄── you are here
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Service info and link index |
| GET | `/health` | Liveness check |
| POST | `/analyze` | Rank and shortlist products |

### POST `/analyze` request body

```json
{
  "targetCurrency": "MYR",
  "rates": { "MYR": 4.47, "SAR": 3.75 },
  "preferences": {
    "prioritizeRating": true,
    "prioritizeLowerPrice": true,
    "inStockOnly": true,
    "preferredCategory": "smartphones"
  },
  "products": [
    {
      "id": 1,
      "title": "Galaxy S25",
      "price": 999,
      "currency": "USD",
      "rating": 4.8,
      "stock": 12,
      "category": "smartphones"
    }
  ]
}
```

### Example response

```json
{
  "ok": true,
  "targetCurrency": "MYR",
  "data": {
    "shortlist": [
      {
        "rank": 1,
        "id": 1,
        "title": "Galaxy S25",
        "originalPrice": 999,
        "originalCurrency": "USD",
        "convertedPrice": 4465.53,
        "targetCurrency": "MYR",
        "rating": 4.8,
        "score": 0.94
      }
    ]
  }
}
```

## Stack

- Runtime: Cloudflare Workers (TypeScript, Hono, Zod)
- Upstream: none (pure computation)
- Called by: `sandbox-runner` via service binding `CART_INTEL_SERVICE`
