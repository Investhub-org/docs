# Agents & MCP

InvestHub is an MCP server for agents in ChatGPT, Claude, and Grok. The server is a Cloudflare Worker. It can read the catalog, prepare an investment, a vote, or a dividend claim, and hand the person an unsigned transaction. The person signs. The server does not.

::: warning Not an ECSP licence, and not investment advice
Crowdfunding and tokenized offerings are offered via a licensed partner (in review). InvestHub does not hold an ECSP licence. The interface fee goes to the Digihub.li Genossenschaft. Tokenized stocks (Coinbase B20 "c" tokens) are not for US persons.
:::

## Principles

- **Non-custodial.** The server never holds the user's keys and never signs.
- **Unsigned transactions.** Tools that move value return `to`, `data`, `value`, and `chainId` for the user's wallet.
- **Simulated first.** Those calls are simulated with `eth_call` and `estimateGas` before the user is asked to sign. A revert is returned as a reason, without a transaction.
- **Human approval for every signature.** An agent may prepare a call. It may not approve a token spend, cast a vote, or submit a profile update on its own.
- **Sign-In with Ethereum for general-meeting data.** Public metadata (a meeting exists, its date, its token) is readable without a session. Agendas, documents, results, and voter lists need `gv_siwe_nonce` and `gv_siwe_verify`, and only for a wallet that still holds the token.
- **A living profile, not a static questionnaire.** Appropriateness is a continuous, anonymous ECSP Article 21-style profile credential. The user co-signs an EIP-712 challenge. The server stores the credential hash, not the raw personal figures. The licensed partner remains responsible for the statutory review.
- **No all-in bets.** Basket tools refuse an all-in request and stay inside ECSP-style limits: loss-absorption capacity, the per-deal ticket, the illiquid-share cap, and a diversification cap.

## Endpoint

TODO: publish the production Worker URL. Until that URL is written here, use only this placeholder. Do not guess a host.

`https://<investhub-mcp-endpoint>/mcp`

```json
{
  "mcpServers": {
    "investhub": {
      "url": "https://<investhub-mcp-endpoint>/mcp"
    }
  }
}
```

Which calls are free, and which are premium with a price still to be published, is on [x402 (paid agent calls)](/agents/x402). Issuers who deploy their own Governor, timelock, and dividend contracts should read [Governance on-chain](/governance/).

## Tools

Inputs below are the key fields. Wallet fields are the address that will sign. They are not a private key.

### About

| Tool | What it does | Key inputs |
| --- | --- | --- |
| `about_investhub` | What InvestHub is, including the partner and fee wording above. | none |

### Catalog and deals

Read-only catalog and quote tools do not publish a deal and do not sign.

| Tool | What it does | Key inputs |
| --- | --- | --- |
| `search_catalog` | Free-text search of the token catalog. Use this before a quote so the agent does not invent token addresses. | `query` (required). Optional exact filters: `status`, `sector`, `platform`. |
| `list_deals` | Deals shown on the InvestHub deals page, including live deals, simulations, and drafts. | Optional: `search`, `chainId`, `kycRequired`, `hasPaidDividends`, `minYield`. |
| `get_deal` | One deal by catalog id, symbol, or name. INV includes the live sale terms when they are on-chain. | `id` (for example `8453:inv`), or `symbol` plus optional `chainId`. |
| `get_quote` | A quote for one pair. When the route can be simulated, returns unsigned transactions and a link to the Swap UI. INV uses the sale contract unless `allowSecondary` is true. DAKS uses the Aktionariat brokerbot. | `sellToken`, `buyToken`, `amount` (human units), `chainId` (`8453`, `1`, `137`, or `84532`), `wallet`. Optional `allowSecondary`. |
| `create_deal_draft` | Stores a draft as a simulation. It is never published as a live offering. | `name`, `summary`, `min_usd`. Optional `chain_id`, `kyc_required`, `sector`. |
| `express_interest` | Records interest in a simulation deal. Does not build a transaction. | `deal_id`, `wallet`. Optional `note`. |
| `commit_to_opportunity` | Soft-commit to a simulation opportunity. Returns unsigned USDC `approve` plus `commit` calldata, simulated from the wallet when a commit contract is configured. No contract address is invented when it is not configured. | `deal_id`, `amount_usdc`, `wallet`. |
| `prepare_invest` | Unsigned INV subscription: USDC `approve` plus the sale buy, only when the buy method and a price are on-chain. Refuses an amount over the cap. | `symbol` (`INV`), `amount`, `wallet`. |

### Profile

`risk_profile_questionnaire` returns the questions. The server does not store the answers. `assess_risk_profile` scores them into a profile the client must keep. Later updates are EIP-712 challenges. Nothing changes until `submit_profile_update` recovers the user's signature.

| Tool | What it does | Key inputs |
| --- | --- | --- |
| `risk_profile_questionnaire` | Returns the Article 21-style questions. Pass the answers only to `assess_risk_profile`. | none |
| `assess_risk_profile` | Scores loss-absorption capacity, sophisticated or not, risk class 1–5, the max single-deal ticket, and the max illiquid share. Valid for 90 days. Writes no personal data. | Required answers: `understands_loss_of_capital`, `understands_illiquidity`, `understands_no_guarantee`, `instruments`, `years_investing`, `transactions_per_year`, `professional_finance_role`, `crowdfunding_before`, `net_worth_eur`, `annual_income_eur`, `annual_obligations_eur`, `portfolio_eur`, `horizon_years`, `loss_tolerance_percent`, `purpose` (`preserve`, `income`, `growth`, or `speculation`), `requests_sophisticated_status`. |
| `propose_profile_update` | Proposes a continuous Article 21 refresh (risk class, loss-capacity band, sophisticated flag, knowledge score). Returns a diff and an EIP-712 challenge. Raising the class or the loss band is refused. Raw euro figures are not stored. | `wallet`, `signals`, `rationale`. Optional `proposed`, `current_credential`, `source_profile`. |
| `micro_knowledge_check` | One contextual question for a deal (illiquidity, total loss, lock-up, or dilution). The answer is not included. | `deal_id` |
| `answer_knowledge_check` | Scores that answer and proposes a knowledge-score change of at most 10 points. Still needs the wallet's EIP-712 signature, then `submit_profile_update`. | `deal_id`, `question_id`, `answer` (`a`, `b`, or `c`), `wallet`, `current_credential`. |
| `submit_profile_update` | Applies a pending update only when the signature recovers to the wallet in the challenge. Issues the profile credential. A bad signature stores nothing. | `pending_id`, `signature` |
| `verify_profile_credential` | For the licensed partner or the platform. Checks the server signatures, the 90-day window, and that this credential is the latest for that wallet. Returns no personal data. | `credential` |

### Baskets

A basket is a proposal, not an order. `propose_basket` uses the catalog already loaded. `propose_basket_live` refreshes it and is the premium path. Neither returns a transaction. `prepare_basket_transactions` builds the unsigned legs (approve, swap, then the Digihub.li Genossenschaft interface-fee transfer when that route charges one) and simulates each leg.

| Tool | What it does | Key inputs |
| --- | --- | --- |
| `propose_basket` | Deterministic basket from a stored risk profile and a euro budget. Refuses all-in. Respects the illiquid cap, the per-deal ticket, and a 25% diversification cap. | `profile` (the `assess_risk_profile` object), `budget_eur`. Optional `preferences`, `wallet` (applies client-signed advisor limits). |
| `propose_basket_live` | Same rules, with a live catalog refresh. This is the premium path. | Same as `propose_basket`. |
| `prepare_basket_transactions` | Unsigned transactions for each leg, simulated from the wallet. A reverted leg comes back with the reason and no transaction. | `profile`, `basket` (the proposal), `wallet`. |

### Advisors

Links are EIP-712. The advisor can read a client only after the client signs, and loses that access when the client revokes. No name is stored.

| Tool | What it does | Key inputs |
| --- | --- | --- |
| `grant_advisor_consent` | Starts a link. The second call, with `pending_id` and the client `signature`, stores it. | `client`, `advisor`. Then `pending_id`, `signature`. |
| `revoke_advisor_consent` | Client signs an EIP-712 payload. After that the advisor can no longer read the account. | `client`, `advisor`. Then `pending_id`, `signature`. |
| `advisor_list_clients` | Read-only list of wallets that consented: wallet, consent hash, and profile bands. No holdings and no raw personal data. | `advisor` |
| `advisor_client_view` | Read-only view of one linked wallet: balances, profile bands, drift alerts, and upcoming votes published in the catalog. Refused without consent. | `advisor`, `client` |
| `advisor_set_limits` | Proposes a max ticket, allowed sectors, excluded symbols, and a liquidity policy. Stored only after the client co-signs. | `advisor`, `client`, `limits`. Then `pending_id`, `signature`. |
| `advisor_review_basket` | Advisor approves or rejects a basket above the advisor threshold. The attestation is attached before the client is asked to sign the transactions. | `advisor`, `client`, `decision` (`approve` or `reject`), `basket`. Then `pending_id`, `signature`. |
| `advisor_confirm_profile_update` | Advisor attestation on a pending profile update. It does not replace the client's own EIP-712 signature. | `advisor`, `client`, `subject_hash`. Optional `pending_id`, `signature`. |

### Governance (general meetings)

`prepare_vote` and `record_vote` do not cast or store a vote. Use `gv_prepare_vote`.

| Tool | What it does | Key inputs |
| --- | --- | --- |
| `list_meetings` | Public list: a meeting exists, its date, and its token. No agenda. | none |
| `get_meeting` | Public metadata for one meeting. Agenda, documents, results, and the voter list need a SIWE session. | `id`. Optional `wallet`. |
| `gv_list_proposals` | Same public list. With a SIWE session and a current token balance, agendas and results are included. | Optional `session` or `proof`. |
| `gv_get_proposal` | One meeting or one numeric governor proposal. Without a session, public metadata only. | `id`. Optional `gv_id`, `session` or `proof`. |
| `gv_siwe_nonce` | Starts Sign-In with Ethereum. Returns a one-time EIP-4361 message. No agenda yet. | `gv_id`, `wallet` |
| `gv_siwe_verify` | Checks the signature, then `balanceOf` and `getVotes`. A holder receives a short-lived session. A non-holder receives no session and no agenda. | `message`, `signature` |
| `gv_prepare_vote` | Unsigned `castVote` for Ja, Nein, or Enthaltung. The server never votes by itself. Without a session for a wallet that still holds the token, no transaction and no agenda are returned. | `id` (proposal id), `gv_id`, `choice` (`Ja`, `Nein`, or `Enthaltung`), `wallet`, and `session` or `proof`. |
| `gv_prepare_delegate` | Unsigned `delegate(address)` for the meeting's voting token. | `gv_id`, `wallet`, `delegatee`, and `session` or `proof`. |
| `gv_prepare_wrap` | Unsigned `approve` plus `depositFor` for an ERC-20 wrapper voting token such as wINV-votes. A native ERC20Votes share has no wrapper, and the tool says so. | `gv_id`, `wallet`, `amount`, and `session` or `proof`. |

### Dividends

| Tool | What it does | Key inputs |
| --- | --- | --- |
| `get_claimable` | Reads `getClaimable` and whether this wallet has already withdrawn. Read-only. | `wallet`. Optional `token` (default USDC on Base), `gv_id`, `pack`. |
| `prepare_claim` | Unsigned `withdraw` when `getClaimable` is above zero, then simulated from the wallet. No transaction when the claim is zero or already withdrawn. The server never signs. | `wallet`. Optional `token`, `gv_id`, `pack`. |

## Not yet deployed

These tools are on the server and answer. They do not have a live contract, and they do not invent a pool address.

| Tool | What it does | Key inputs |
| --- | --- | --- |
| `board_status` | Reads board status. The P2P board escrow is unaudited and is not deployed. | none |
| `prepare_board` | Would prepare a board buy or sell. Returns not deployed and no transaction. | `side` (`buy` or `sell`), `symbol`, `amount`, `wallet` |
| `staking_status` | Reads USDC staking status. The staking escrow is unaudited and is not deployed. | none |
| `prepare_stake` | Would prepare a USDC stake. Returns not deployed and no transaction. | `amount_usdc`, `wallet` |
