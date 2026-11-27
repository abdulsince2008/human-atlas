# Anatomy 360 — Educator Commission Policy Draft (Internal Governance Only)

**Recruitment Status:** **DISABLED** (`DISABLED_PENDING_PROVIDER_WRITTEN_APPROVAL`)  
**Scope:** Internal operational guidelines and manual ledger controls. Do **not** publish public recruitment pages, partner sign-up forms, or commission percentages until the chosen payment provider / Merchant of Record confirms eligibility in writing.

---

## 1. Operational Separation from Hosted Checkout

- **Customer Payment Flow:** Customers subscribe strictly through the finalized payment provider / Merchant of Record checkout (e.g., Whop, Creem, Paddle, or another approved processor).
- **Commission Settlement:** Approved educators/teachers are compensated via the approved payout workflow (either provider-native affiliate splits if enabled by the chosen platform, or manual settlement by the Anatomy 360 seller entity outside checkout after qualifying payout proceeds clear).
- **Strict Prohibition:** Zero multi-tier recruiting, zero sub-affiliate trees, zero recruitment bonuses, zero pyramid/MLM compensation.

---

## 2. Internal Ledger Controls (`affiliate_commission_ledger` in `server/billing-store.ts`)

Our durable SQLite billing store maintains an internal accounting table `affiliate_commission_ledger` containing:
- `entry_id`
- `affiliate_id`
- `qualifying_transaction_id`
- `internal_customer_id` *(pseudonymous ID only — **zero** student names, emails, or study history)*
- `commission_basis_cents`
- `commission_rate_bps` *(owner-configurable once approved — never hard-coded)*
- `commission_earned_cents`
- `refund_adjustment_cents`
- `chargeback_adjustment_cents`
- `amount_payable_cents`
- `amount_paid_cents`
- `settlement_status` (`pending_payout` | `settled` | `reversed`)
- `payment_date` & `settlement_reference`

### Automated Safeguards
1. **Refund & Chargeback Clawbacks:** Whenever a verified webhook (`refund.created` / `chargeback.created` / `adjustment.created`) reverses a qualifying transaction, `applyRefundOrChargeback` automatically zeroes `amount_payable_cents` and marks `settlement_status = 'reversed'`.
2. **Proceeds Settlement Rule:** Finance operators must never mark `settlement_status = 'settled'` or send payout funds before verifying that the chosen payment provider has settled the corresponding payout batch and cleared initial refund/dispute windows.
3. **Privacy Wall:** Educators never receive access to any referred learner's progress, flashcards, quiz scores, or personal identity via the commission ledger.

---

## 3. Mandatory Creator Disclosure Sample

When approved for launch, participating teachers/creators must display a clear disclosure alongside every video, lesson handout, or link containing a referral code:

> "Anatomy 360 Partner Disclosure: I may earn a commission if you purchase a subscription through my referral link. This does not change the price you pay."

Fake testimonials, undisclosed promotions, medical claims, or exam-score guarantees remain grounds for immediate termination and commission forfeiture.
