# Anatomy 360 — Required Owner Decisions & Missing Inputs Before Live Launch

Live production checkout (`liveCheckoutAllowed`) remains **automatically disabled** by `server/billing-service.ts` until every required owner input and external approval below is supplied.

---

## 1. Payment Provider Selection (Evaluating Whop, Creem, Paddle, or Another MoR)

- [ ] **Finalize `BILLING_PROVIDER`:** Choose `whop` | `creem` | `paddle` | `custom` once you finish comparing payout countries, fees, minor/age eligibility, and native professor affiliate tools.
- [ ] **Update Policy Disclosures If Specific MoR Selected:** Once a single provider is finalized, update `BILLING_PROVIDER_DISCLOSURE` in `app/commercial/commercial-config.ts` and refund/order-lookup links in `app/pages/RefundPolicyPage.tsx` and `app/pages/ContactPage.tsx` with the chosen provider's exact legal disclosure and buyer portal URL.

---

## 2. Legal Seller Identity & Contact Information (Required on Terms, Privacy & Contact Pages)

- [ ] **Legal Seller Name (`COMMERCIAL_SELLER_NAME`):** Exact full legal name of sole proprietor or registered corporate entity.
- [ ] **Seller Type (`COMMERCIAL_SELLER_TYPE`):** e.g., `Sole Proprietor` or `Private Limited Company / LLC`.
- [ ] **Seller Country & Jurisdiction (`COMMERCIAL_SELLER_COUNTRY`):** Legal operating country for seller agreement and governing law clause in Terms and Conditions.
- [ ] **Public Support Email (`COMMERCIAL_SUPPORT_EMAIL`):** Real monitored email address displayed dynamically on Terms, Privacy, and Contact & Support pages.
- [ ] **Public Support Phone (`COMMERCIAL_SUPPORT_PHONE`):** Real monitored business/support phone number displayed on Contact & Support page.
- [ ] **Approved Domain (`BILLING_APPROVED_DOMAIN`):** Final production HTTPS domain (e.g., `https://...`).

---

## 3. Seller Legal Age & Account-Holder Eligibility (`SELLER_READINESS.md`)

- [ ] **Confirm Legal Account-Holder Eligibility:** Because the initiator previously indicated they may be under 18, confirm whether an eligible adult owner/representative will lawfully own/operate the business OR obtain explicit written clarification from the chosen provider regarding permitted account setup.
- [ ] **Complete KYC & Tax Details:** Supply valid government ID, address verification, and tax registration requested by the chosen provider.
- [ ] **Configure Matching Payout Account:** Supply verified payout details strictly matching the legal account holder.

---

## 4. Commercial Pricing & Feature Boundaries (`app/commercial/commercial-config.ts`)

- [ ] **Confirm `Student Plus` Pricing (`$4.99/mo` monthly, `$39.99/yr` annual draft):** Approve recommended launch rates or adjust amounts in `COMMERCIAL_PLANS`.
- [ ] **Confirm `Educator Plus` Pricing (`$9.99/mo` monthly, `$79.99/yr` annual draft):** Approve recommended launch rates or adjust amounts in `COMMERCIAL_PLANS`.
- [ ] **Confirm Annual Billing Toggle & Discount:** Confirm whether both monthly and annual SKUs will be listed at launch.
- [ ] **Confirm Free Explorer Limits vs. Paid Feature Gates:** Currently all 3D models and study tools work freely without paywalls; confirm exact server-side feature gating boundaries (if any beyond cross-device entitlements, educator cloud exports, and AI credit allowances).
- [ ] **Confirm Included vs. Separate AI Credit Strategy:** Confirm whether `Student Plus` includes 250k credits/cycle and `Educator Plus` includes 500k credits/cycle or if all AI credits remain strict separate add-ons (`student_monthly` $4.99, `exam_prep_pack` $9.99).
- [ ] **Set `COMMERCIAL_PRICING_CONFIRMED=true`:** Flip only after signing off on final catalog rates.

---

## 5. Provider Catalog, Credentials & Written Approvals

- [ ] **Submit Pre-Approval Product Review (`BILLING_PRODUCT_REVIEW.md`):** Obtain written confirmation from your chosen provider covering anatomy/biomedical software, exam-prep (`MDCAT`), and AI educational tooling.
- [ ] **Submit Affiliate Programme Clarification (`AFFILIATE_APPROVAL_REQUEST.md`):** Obtain written confirmation (or verify native platform affiliate eligibility) before enabling educator referrals.
- [ ] **Create Real Products, Prices & Checkout URLs in Sandbox then Production:** Configure env vars in `.env`:
  - `BILLING_PRODUCT_STUDENT_PLUS`, `BILLING_PRICE_STUDENT_PLUS_MONTHLY`, `BILLING_PRICE_STUDENT_PLUS_ANNUAL`, `BILLING_CHECKOUT_URL_STUDENT_PLUS_*`
  - `BILLING_PRODUCT_EDUCATOR_PLUS`, `BILLING_PRICE_EDUCATOR_PLUS_MONTHLY`, `BILLING_PRICE_EDUCATOR_PLUS_ANNUAL`, `BILLING_CHECKOUT_URL_EDUCATOR_PLUS_*`
  - `BILLING_PRODUCT_AI_MONTHLY`, `BILLING_PRICE_AI_MONTHLY`, `BILLING_CHECKOUT_URL_AI_MONTHLY`
  - `BILLING_PRODUCT_AI_BURST`, `BILLING_PRICE_AI_BURST`, `BILLING_CHECKOUT_URL_AI_BURST`
- [ ] **Configure Secret & Runtime Env Vars:** `BILLING_PROVIDER`, `BILLING_CLIENT_TOKEN`, `BILLING_API_KEY`, `BILLING_WEBHOOK_SECRET`, `BILLING_PORTAL_URL`, `AI_QUOTA_SIGNING_SECRET`, `BILLING_ENVIRONMENT=production`.
- [ ] **Flip Production Gates Only After All Checks Pass:** `COMMERCIAL_SELLER_APPROVED=true`, `COMMERCIAL_DOMAIN_APPROVED=true`, `COMMERCIAL_PRODUCT_CATEGORY_APPROVED=true`, `COMMERCIAL_LIVE_CHECKOUT_ENABLED=true`.

---

## 6. Legal & Children's Privacy Sign-Off

- [ ] **Legal Review of Buyer Terms, Refund Policy & Jurisdiction Clause:** Reviewed by qualified counsel / legal advisor for seller country.
- [ ] **Children's Privacy / Under-13 (COPPA) Safeguards:** Implement verifiable parental consent / age-gating or formally exclude under-13 account/cloud/AI signups prior to opening paid/cloud accounts to minors.
- [ ] **Educator Partner Commission Rate (If Approved):** Choose `[COMMISSION_RATE_PCT]%`, `[ATTRIBUTION_WINDOW_DAYS]`, and `[MIN_PAYOUT_USD]` in `EDUCATOR_PARTNER_AGREEMENT_DRAFT.md`.
