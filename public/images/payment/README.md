# Payment brand assets

Production logos: **`public/photos/pay/*.webp`** (see `PAYMENT_PHOTO_ASSETS` in `src/shared/ui/PaymentLogos/paymentLogosConfig.ts`).

Sources for regeneration: **`public/images/payment/`** and `public/photos/pay/ерип.svg`.

Regenerate optimized WebP (max height 128px @2x):

```bash
node scripts/generate-payment-logos.mjs
```

| ID | Output |
|----|--------|
| bepaid | `photos/pay/bepaid.webp` |
| erip | `photos/pay/erip.webp` |
| visa | `photos/pay/visa.webp` |
| mastercard | `photos/pay/mastercard.webp` |
| belkart | `photos/pay/belkart.webp` |

Do not recolor or stretch logos in UI — use `object-contain` only.
