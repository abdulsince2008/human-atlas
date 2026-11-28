# Alphatomy — Commercial & Whop Readiness Matrix

Status taxonomy: `READY` | `PARTIAL` | `BLOCKED_HUMAN_INPUT` | `BLOCKED_PROVIDER_CONFIRMATION` | `NOT_IMPLEMENTED` | `UNVERIFIED`

*(External human, legal, and payment-provider approvals are never marked `READY` based merely on code presence.)*

---

## 1. Product

| Check Item | Status | Notes / Evidence |
|---|---|---|
| Product description | `READY` | Accurately written on `HomePage`, `FeaturesPage`, `AboutPage`, and `BILLING_PRODUCT_REVIEW.md` |
| Genuine screenshots | `READY` | Real captures of running `explorer`, `study`, and `educator` views in `public/assets/screenshots/` |
| Feature accuracy | `READY` | All Feature cards route to live modules; coverage gaps transparently disclosed on `AboutPage` |
| Product ownership | `BLOCKED_HUMAN_INPUT` | Pending legal confirmation of owner / eligible adult operator (`SELLER_READINESS.md`) |
| Dataset licenses | `READY` | BodyParts3D 4.0 (CC BY 4.0), HuBMAP HRA (CC BY 4.0), Human Atlas (MIT) & `THIRD_PARTY_LICENSES.md` documented |
| Educational disclaimer | `READY` | Displayed on Home, Features, Terms, Privacy, and About pages (not for diagnosis/treatment) |
| Product category approval | `BLOCKED_PROVIDER_CONFIRMATION` | Pending chosen payment provider selection & written review (`BILLING_PRODUCT_REVIEW.md`) |
| Exam-preparation clarification | `BLOCKED_PROVIDER_CONFIRMATION` | MDCAT / exam practice disclosed transparently; awaiting written review from chosen provider |
| Affiliate programme clarification | `BLOCKED_PROVIDER_CONFIRMATION` | Exact question drafted (`AFFILIATE_APPROVAL_REQUEST.md`); awaiting chosen provider confirmation |

---

## 2. Website

| Check Item | Status | Notes / Evidence |
|---|---|---|
| HTTPS | `BLOCKED_HUMAN_INPUT` | Production domain SSL depends on final deployment host configuration |
| Product page | `READY` | `app/pages/HomePage.tsx` explains platform, audience tracks, and live captures |
| Features page | `READY` | `app/pages/FeaturesPage.tsx` (`#/features`) across 6 functional categories |
| Pricing page | `READY` | `app/pages/PricingPage.tsx` (`#/pricing`) publicly accessible without login; live checkout safely gated off |
| Terms | `READY` | `app/pages/TermsPage.tsx` (`#/terms`) provider-agnostic commercial terms; seller identity dynamic from env |
| Privacy | `PARTIAL` | `app/pages/PrivacyPage.tsx` (`#/privacy`) audits code & discloses COPPA/under-13 safeguards gap (`PARTIAL` pending minor safeguards) |
| Refund Policy | `READY` | `app/pages/RefundPolicyPage.tsx` (`#/refunds`) aligned with consumer law, cancellation & AI credit reversal rules |
| Contact | `READY` | `app/pages/ContactPage.tsx` (`#/contact`) + `SiteFooter` links on public pages |
| Support email | `BLOCKED_HUMAN_INPUT` | `COMMERCIAL_SUPPORT_EMAIL` intentionally blank until owner supplies monitored email |
| Support phone | `BLOCKED_HUMAN_INPUT` | `COMMERCIAL_SUPPORT_PHONE` intentionally blank until owner supplies monitored phone |
| Seller identity | `BLOCKED_HUMAN_INPUT` | `COMMERCIAL_SELLER_NAME`, `COMMERCIAL_SELLER_TYPE`, `COMMERCIAL_SELLER_COUNTRY` await owner confirmation |
| Footer navigation | `READY` | `app/components/SiteFooter.tsx` links Features, Pricing, Terms, Privacy, Refund Policy, Contact, About & Tools |
| Public accessibility | `READY` | Desktop (`1440px`) and mobile (`390px`) verified publicly without requiring authentication |
| Approved domain | `BLOCKED_HUMAN_INPUT` | `BILLING_APPROVED_DOMAIN` & `COMMERCIAL_DOMAIN_APPROVED` pending final domain & chosen provider |

---

## 3. Seller Account

| Check Item | Status | Notes / Evidence |
|---|---|---|
| Payment provider choice | `READY` | Whop finalized (`BILLING_PROVIDER=whop`, `BILLING_CHECKOUT_MODE=whop_embedded`) |
| Legal identity | `BLOCKED_HUMAN_INPUT` | Missing verified legal name / sole-proprietor / entity details |
| Identity verification | `BLOCKED_HUMAN_INPUT` | KYC ID & address check not yet submitted |
| Account-holder eligibility | `BLOCKED_HUMAN_INPUT` | Possible minor (<18) owner blocker; requires lawful eligible adult structure + provider confirmation |
| Business or sole-proprietor details | `BLOCKED_HUMAN_INPUT` | Pending owner business registration decision |
| Tax details | `BLOCKED_HUMAN_INPUT` | Pending owner tax ID / country registration forms |
| Payout method & banking | `BLOCKED_HUMAN_INPUT` | Pending matching Bank / Payoneer / Stripe Express payout setup |
| Legal authority | `BLOCKED_HUMAN_INPUT` | Pending owner / authorized adult signatory confirmation |

---

## 4. Billing

| Check Item | Status | Notes / Evidence |
|---|---|---|
| Provider catalog & checkout links | `BLOCKED_HUMAN_INPUT` | Whop Plan IDs (`plan_...`), `BILLING_API_KEY`, and `BILLING_WEBHOOK_SECRET` (`ws_...`) await live Dashboard values |
| On-site embedded checkout | `READY` | `@whop/checkout/react` `<WhopCheckoutEmbed />` inside `<WhopCheckoutModal />` + Whop `/checkout_configurations` session API |
| Live checkout | `BLOCKED_PROVIDER_CONFIRMATION` | Intentionally hard-disabled until Whop plans, `ws_...` secret, seller identity, KYC, and `COMMERCIAL_LIVE_CHECKOUT_ENABLED=true` pass |
| Webhook signature verification | `READY` | Native Whop Standard Webhooks (`webhook-id` / `webhook-timestamp` / `webhook-signature` `v1,<base64>` + `ws_...`) + HMAC fallback (`POST /api/billing/webhook/whop`) |
| Durable entitlements | `READY` | `node:sqlite` DB (`server/billing-store.ts`) persists across server restarts & optional verified Firebase UID link |
| Idempotency | `READY` | `processed_webhook_events` PRIMARY KEY (`event_id`) + `provider_event_id` UNIQUE constraint |
| Subscription lifecycle | `READY` | Handles `payment.succeeded`, `membership.activated`, `membership.deactivated`, `subscription.*` active/canceled/past_due/paused |
| Refund handling | `READY` | `payment.refunded`/`refund.created`/`chargeback.created` revokes tier access + transaction-granted AI credits |
| Cancellation | `READY` | Preserves access until period end where scheduled, stops future billing, reverts to Free Explorer |
| Customer portal | `READY` | `POST /api/billing/portal` routes to `BILLING_PORTAL_URL` (`https://whop.com/orders` default) |

---

## 5. Affiliate Programme

| Check Item | Status | Notes / Evidence |
|---|---|---|
| Provider written permission | `BLOCKED_PROVIDER_CONFIRMATION` | Clarification template drafted (`AFFILIATE_APPROVAL_REQUEST.md`); public recruitment stays disabled |
| Partner agreement | `READY` | Internal draft written in `EDUCATOR_PARTNER_AGREEMENT_DRAFT.md` (owner rate placeholders) |
| Attribution | `NOT_IMPLEMENTED` | Public checkout referral attribution intentionally kept disabled pending provider choice & approval |
| Commission ledger | `READY` | Internal `affiliate_commission_ledger` table + automatic refund/chargeback reversal in `server/billing-store.ts` |
| Manual settlement | `READY` | Documented internal settlement & proceeds-cleared gate (`EDUCATOR_COMMISSION_POLICY_DRAFT.md`) |
| Creator disclosures | `READY` | Required Partner disclosure statement documented in draft policy & agreement |
| Fraud safeguards | `READY` | Self-referral prohibition, clawback automation, no student data exposure documented & schema-isolated |
