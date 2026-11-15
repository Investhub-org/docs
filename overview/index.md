# API Overview

Investhub’s backend is built on **Supabase Edge Functions**. The frontend calls them via the Supabase client:

```ts
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { ... }
});
```

## Try the API (interactive docs)

Use the **API Reference** in this documentation to browse all endpoints and **try them out** (send requests, see responses). That experience is powered by the same standard as [Swagger / OpenAPI](https://swagger.io/why-swagger/) — an OpenAPI spec is imported into GitBook so you get interactive “Test it” for each endpoint. You do **not** need to open the raw spec file on GitHub; everything is available here in the API Reference section.

If the API Reference is not yet visible in the sidebar, an admin needs to add the OpenAPI specification once in GitBook (Integrations → Add OpenAPI specification → URL or File). After that, readers can try endpoints directly from the docs.

## Base URL

Edge Functions are served under your project’s Supabase URL:

- **Production**: `https://<project-ref>.supabase.co/functions/v1/<function-name>`
- Requests use **POST** with `Content-Type: application/json` when sending a body.

## Authentication

Most endpoints require a **Privy JWT**. Send it in the `Authorization` header:

```http
Authorization: Bearer <privy_access_token>
```

The backend verifies the token and derives the user ID from the JWT `sub` claim. Some endpoints are **public** (e.g. `get-opportunities`, `get-opportunity`, `get-token-price`, `create-commitment`). The API Reference indicates which require auth.

## What’s documented

The OpenAPI spec used by this space covers a large part of the app:

| Area | Examples |
|------|----------|
| **Auth** | `get-profile`, `update-profile`, `sync-privy-profile`, `wallet-auth`, `verify-wallet-signature` |
| **Opportunities** | `get-opportunities`, `get-opportunity`, `create-opportunity` |
| **Investments** | `create-investment`, `pay-investment`, `process-crypto-payment`, `get-user-investments`, `sponsored-transaction` |
| **KYC** | `get-kyc-status`, `get-kyc-info`, `submit-kyc`, `get-sumsub-token` |
| **Company** | `get-company`, `update-company`, `create-tenant`, `manage-shareholders` |
| **Incorporate** | `save-incorporation-draft`, `get-incorporation-draft`, `create-incorporation-checkout`, `create-tokenized-ag`, `generate-lvc-documents`, `calculate-lvc-risk-factors` |
| **Manage – Expenses** | `get-expenses`, `create-expense`, `approve-expense`, `reject-expense`, `manage-expense-report-templates` |
| **Manage – Accounts / Branches / Cards** | `get-accounts`, `create-account`, `get-branches`, `create-branch`, `get-cards`, `create-card` |
| **Manage – Categories / Groups / Tax / Users** | `get-categories`, `manage-groups`, `get-tax-rates`, `get-users`, `invite-user-with-role` |
| **Manage – Xero** | `get-xero-settings`, `sync-xero-data`, `create-xero-invoice`, `create-xero-payment` |
| **Wallets** | `get-wallets`, `add-wallet`, `manage-wallet-tokens`, `get-wallet-assets-v2`, `get-token-price`, `get-swap-quote` |
| **Portfolio** | `get-portfolio-cached`, `get-portfolio-snapshots`, `save-portfolio-snapshot` |
| **Payments** | `assign-volt-viban`, `create-stripe-checkout-session`, Monerium endpoints, Coinbase onramp, subscriptions |
| **Security** | IP whitelist, MFA status |
| **Documents** | `upload-document-v2`, `extract-document-data-v2`, `parse-invoice` |

For the full list and to try any endpoint, use the **API Reference** in the sidebar (OpenAPI-powered).

## Regenerating the spec (maintainers)

The OpenAPI YAML is generated from `scripts/openapi-config.json`. To add or change endpoints:

```bash
npm run docs:generate
```

Then commit and push `docs/gitbook/api/openapi.yaml`. If GitBook is configured to use the spec via URL, it will pick up updates automatically; otherwise update the spec in GitBook (Integrations → OpenAPI → Update).
