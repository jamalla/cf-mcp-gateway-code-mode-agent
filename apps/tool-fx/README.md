# tool-fx

**Cloudflare Worker · Tool Layer (called in Step 3)**

Live URL: `https://cf-tool-fx.to-jamz.workers.dev`

## What it does

Provides **live currency exchange rates** for price normalization. It is a thin proxy over the public [Frankfurter](https://frankfurter.app) API, returning rates in the standard `{ ok, source, data }` envelope.

In the demo scenario this worker is selected when the prompt references a target currency such as MYR or SAR. The sandbox runner uses the exchange rates it returns to convert product prices before passing them to the cart intelligence worker.

## Sequence position

```
[1] agent-web  ──► mcp-gateway /specs
[2]            ──► agent-py /plan
[3]            ──► sandbox-runner /execute
                       ├─► tool-products /products
                       ├─► tool-fx /rates            ◄── you are here
                       └─► tool-cart-intel /analyze
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Service info and link index |
| GET | `/health` | Liveness check |
| GET | `/rates` | Latest exchange rates (params: `base`, `symbols`) |
| GET | `/currencies` | List of all supported currency codes |

### Example — USD base, MYR/SAR/EUR output

```bash
curl "https://cf-tool-fx.to-jamz.workers.dev/rates?base=USD&symbols=MYR,SAR,EUR"
```

```json
{
  "ok": true,
  "source": "frankfurter",
  "data": {
    "amount": 1,
    "base": "USD",
    "date": "2026-03-11",
    "rates": { "EUR": 0.921, "MYR": 4.47, "SAR": 3.75 }
  }
}
```

## Stack

- Runtime: Cloudflare Workers (TypeScript, Hono)
- Upstream: Frankfurter public REST API
- Called by: `sandbox-runner` via service binding `FX_SERVICE`
