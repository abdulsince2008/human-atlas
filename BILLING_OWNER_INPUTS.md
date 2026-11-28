# Alphatomy — Required Owner Decisions & Missing Inputs Before Live Launch

Live production checkout (`liveCheckoutAllowed`) remains **automatically disabled** by `server/billing-service.ts` until every required owner input and external approval below is supplied.

---

## 1. Payment Provider Selection (**Completed: Whop Selected**)

- [x] **Finalize `BILLING_PROVIDER`:** Selected **`whop`** (`BILLING_CHECKOUT_MODE=whop_embedded`, store slug `https://whop.com/elysiumforge/alphatomy/`).
- [x] **Update Policy Disclosures & Embedded Checkout:** Updated `BILLING_PROVIDER_DISCLOSURE` in `app/commercial/commercial-config.ts`, on-site `<WhopCheckoutModal />` (`@whop/checkout/react`), Whop Standard Webhook verification (`server/billing-service.ts`), and buyer portal/refund links in `app/pages/RefundPolicyPage.tsx` and `app/pages/ContactPage.tsx`.

---

## 2. Legal Seller Identity & Contact Information (Required on Terms, Privacy & Contact Pages)

- [ ] **Legal Seller Name (`COMMERCIAL_SELLER_NAME`):** Exact full legal name of sole proprietor or registered corporate entity.
- [ ] **Seller Type (`COMMERCIAL_SELLER_TYPE`):** e.g., `Sole Proprietor` or `Private Limited Company / LLC`.
- [ ] **Seller Country & Jurisdiction (`COMMERCIAL_SELLER_COUNTRY`):** Legal operating country for seller agreement and governing law clause in Terms and Conditions.
- [ ] **Public Support Email (`COMMERCIAL_SUPPORT_EMAIL`):** Real monitored email address displayed dynamically on Terms, Privacy, and Contact & Support pages.
- [ ] **Public Support Phone (`COMMERCIAL_SUPPORT_PHONE`):** Real monitored business/support phone number displayed on Contact & Support page.
- [ ] **Approved Domain (`BILLING_APPROVED_DOMAIN`):** Final production HTTPS domain (e.g., `https://elysiumforge.solutions` or `https://alphatomy.elysiumforge.solutions`).

---

## 3. Seller Legal Age & Account-Holder Eligibility (`SELLER_READINESS.md`)

- [ ] **Confirm Legal Account-Holder Eligibility:** Because the initiator previously indicated they may be under 18, confirm whether an eligible adult owner/representative will lawfully own/operate the Whop business OR obtain explicit written clarification from Whop regarding permitted account setup.
- [ ] **Complete Whop KYC & Tax Details:** Supply valid government ID, address verification, and tax registration requested in Whop Dashboard.
- [ ] **Configure Matching Payout Account:** Supply verified payout details strictly matching the legal account holder.

---

## 4. Commercial Pricing & Feature Boundaries (`app/commercial/commercial-config.ts`)

- [ ] **Confirm `Student Plus` Pricing (`$4.99/mo` monthly, `$39.99/yr` annual draft):** Approve recommended launch rates or adjust amounts in `COMMERCIAL_PLANS` and in Whop Plans.
- [ ] **Confirm `Educator Plus` Pricing (`$9.99/mo` monthly, `$79.99/yr` annual draft):** Approve recommended launch rates or adjust amounts in `COMMERCIAL_PLANS` and in Whop Plans.
- [ ] **Confirm Annual Billing Toggle & Discount:** Confirm whether both monthly and annual SKUs will be listed at launch.
- [ ] **Confirm Free Explorer Limits vs. Paid Feature Gates:** Currently all 3D models and study tools work freely without paywalls; confirm exact server-side feature gating boundaries (if any beyond cross-device entitlements, educator cloud exports, and AI credit allowances).
- [ ] **Confirm Included vs. Separate AI Credit Strategy:** Confirm whether `Student Plus` includes 250k credits/cycle and `Educator Plus` includes 500k credits/cycle or if all AI credits remain strict separate add-ons (`student_monthly` $4.99, `exam_prep_pack` $9.99).
- [ ] **Set `COMMERCIAL_PRICING_CONFIRMED=true`:** Flip only after signing off on final catalog rates.

---

## 5. Whop Catalog, Credentials & Written Approvals

- [ ] **Submit Whop Product Review (`BILLING_PRODUCT_REVIEW.md`):** Ensure Whop approves anatomy/biomedical software, exam-prep (`MDCAT`), and AI educational tooling on your product (`https://whop.com/elysiumforge/alphatomy/`).
- [ ] **Confirm Whop Affiliates / Referral Settings (`AFFILIATE_APPROVAL_REQUEST.md`):** Verify Whop Affiliate eligibility before enabling educator referrals.
- [ ] **Create Real Whop Plans (`plan_...`) & Paste Plan IDs into Host Env Vars:**
  - `BILLING_PRODUCT_STUDENT_PLUS`, `BILLING_PRICE_STUDENT_PLUS_MONTHLY`, `BILLING_PRICE_STUDENT_PLUS_ANNUAL`
  - `BILLING_PRODUCT_EDUCATOR_PLUS`, `BILLING_PRICE_EDUCATOR_PLUS_MONTHLY`, `BILLING_PRICE_EDUCATOR_PLUS_ANNUAL`
  - `BILLING_PRODUCT_AI_MONTHLY`, `BILLING_PRICE_AI_MONTHLY`
  - `BILLING_PRODUCT_AI_BURST`, `BILLING_PRICE_AI_BURST`
- [ ] **Configure Whop Webhook & API Secrets in `.env`:** `BILLING_PROVIDER=whop`, `BILLING_CHECKOUT_MODE=whop_embedded`, `BILLING_API_KEY` (Whop server key for checkout configurations), `BILLING_WEBHOOK_SECRET` (`ws_...`), `BILLING_PORTAL_URL=https://whop.com/orders`, `AI_QUOTA_SIGNING_SECRET`, `BILLING_ENVIRONMENT=production`.
- [ ] **Register Webhook URL in Whop Dashboard:** Point Whop webhook events (`payment.succeeded`, `payment.failed`, `payment.refunded`, `membership.activated`, `membership.deactivated`) to `https://<your-domain>/api/billing/webhook/whop`.
- [ ] **Flip Production Gates Only After All Checks Pass:** `COMMERCIAL_SELLER_APPROVED=true`, `COMMERCIAL_DOMAIN_APPROVED=true`, `COMMERCIAL_PRODUCT_CATEGORY_APPROVED=true`, `COMMERCIAL_LIVE_CHECKOUT_ENABLED=true`.

---

## 6. Legal & Children's Privacy Sign-Off

- [ ] **Legal Review of Buyer Terms, Refund Policy & Jurisdiction Clause:** Reviewed by qualified counsel / legal advisor for seller country.
- [ ] **Children's Privacy / Under-13 (COPPA) Safeguards:** Implement verifiable parental consent / age-gating or formally exclude under-13 account/cloud/AI signups prior to opening paid/cloud accounts to minors.
- [ ] **Educator Partner Commission Rate (If Approved):** Choose `[COMMISSION_RATE_PCT]%`, `[ATTRIBUTION_WINDOW_DAYS]`, and `[MIN_PAYOUT_USD]` in `EDUCATOR_PARTNER_AGREEMENT_DRAFT.md`.

