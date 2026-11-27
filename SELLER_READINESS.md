# Anatomy 360 — Seller Account & Legal Eligibility Readiness

**Overall Seller Status:** `BLOCKED_HUMAN_INPUT` (Human / External Legal & Identity Blocker)

---

## 1. Minor / Legal Age & Account-Holder Eligibility Disclosure

The project initiator previously indicated they may be **under 18 years of age**.

- **Zero Assumptions:** We do **not** assume a minor is legally eligible to enter into a binding Merchant of Record / payment processor agreement (such as Whop, Creem, Paddle, etc.) or KYC verification.
- **No Unverified Policy Claims:** We do **not** invent a specific minimum-age rule where not quoted verbatim from the selected provider's signed merchant terms for the seller's jurisdiction.
- **Strict Identity Integrity Rule:** Never submit another person's identity or documents merely to bypass KYC verification. Any adult account holder (such as a parent/guardian or adult co-founder/entity) must **genuinely own or hold documented legal authority** to operate the Anatomy 360 business, assume tax/financial liability, and sign the merchant agreement.
- **Mandatory Written Confirmation:** If the seller will operate under an adult legal representative or registered business owned by an eligible adult, verify the chosen provider's exact account-holder & payout rules in writing prior to live sales.

---

## 2. Seller KYC, Ownership & Payout Verification Checklist

All items below are currently **unfilled / unverified** (`BLOCKED_HUMAN_INPUT`) and must not be fabricated:

- [ ] **Chosen Payment Provider (`BILLING_PROVIDER`):** Finalize provider choice (e.g., Whop, Creem, Paddle, or another processor).
- [ ] **Legal Seller Name:** Full legal name of individual sole proprietor or registered company (`COMMERCIAL_SELLER_NAME`).
- [ ] **Legal Ownership & Authority:** Verified ownership of the Anatomy 360 codebase, domain, brand, and commercial revenues, plus adult legal capacity to contract.
- [ ] **Business / Sole-Proprietor Details:** Business registration certificate (if incorporated/registered LLC/Ltd) or sole-proprietor status matching bank/tax documentation.
- [ ] **Identity Verification (KYC):** Government-issued photo ID and proof of residential/business address requested during provider onboarding.
- [ ] **Seller Country & Jurisdiction:** Confirmed legal country (`COMMERCIAL_SELLER_COUNTRY`) supported by the chosen provider's payouts and local business laws.
- [ ] **Tax Information:** Relevant local/international tax identifiers (e.g., NTN / W-8BEN / VAT/GST registration as requested by the chosen provider).
- [ ] **Payout Method & Banking Details:** Exact matching beneficiary name (bank / Payoneer / Stripe Express / Wise account must belong to the verified merchant account holder — never an unrelated third party).
- [ ] **Public Contact Information:** Active support email (`COMMERCIAL_SUPPORT_EMAIL`) and valid support phone (`COMMERCIAL_SUPPORT_PHONE`) monitored by the seller.
- [ ] **Approved Domain Ownership:** Production domain (`BILLING_APPROVED_DOMAIN`) served over HTTPS with verified DNS/domain control and complete public commercial/policy pages.

---

## 3. Blocker Resolution Gate

Until every item above is verified by the eligible human owner and approved by the chosen payment provider:
- Keep `COMMERCIAL_LIVE_CHECKOUT_ENABLED=false`
- Keep `BILLING_PROVIDER=unselected` (or `sandbox` testing only)
- Keep `BILLING_ENVIRONMENT=sandbox`
- Do not accept live customer payments.
