export type CommercialPlanId =
  | 'free_explorer'
  | 'student_plus'
  | 'educator_plus'
  | 'institution_custom';

export type BillingInterval = 'none' | 'monthly' | 'annual' | 'custom';

export type BillingProviderChoice = 'unselected' | 'whop' | 'creem' | 'paddle' | 'custom';

export type PricingConfirmationStatus =
  | 'free_confirmed'
  | 'draft_recommendation'
  | 'owner_confirmed'
  | 'custom_inquiry';

export interface ProviderCatalogMapping {
  productId: string | null;
  monthlyPriceId: string | null;
  annualPriceId: string | null;
  monthlyCheckoutUrl: string | null;
  annualCheckoutUrl: string | null;
}

export interface CommercialPlanDefinition {
  id: CommercialPlanId;
  name: string;
  tagline: string;
  intendedUsers: string[];
  currency: 'USD';
  monthlyPriceUsdCents: number | null;
  annualPriceUsdCents: number | null;
  pricingStatus: PricingConfirmationStatus;
  billingKind: 'free' | 'recurring' | 'custom';
  renewalBehavior: string;
  accountRequirements: string;
  cancellationBehavior: string;
  accessAfterCancellation: string;
  usageLimits: string[];
  aiCreditAllowance: {
    includedMonthlyCredits: number | null;
    summary: string;
  };
  includedFeatures: string[];
  billingCatalogEnvKeys: {
    productIdEnv: string | null;
    monthlyPriceIdEnv: string | null;
    annualPriceIdEnv: string | null;
  };
}

export interface SellerIdentityConfig {
  tradingName: string;
  legalSellerName: string | null;
  sellerType: string | null;
  sellerCountry: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  approvedDomain: string | null;
  pricingConfirmed: boolean;
  sellerApprovedByProvider: boolean;
  domainApprovedByProvider: boolean;
  policiesPublished: boolean;
  billingProvider: BillingProviderChoice;
  billingEnvironment: 'sandbox' | 'production';
  billingClientConfigured: boolean;
  portalUrl: string | null;
  liveCheckoutEnabled: boolean;
}

export interface CommercialRuntimeSnapshot {
  seller: SellerIdentityConfig;
  billingCatalog: Record<CommercialPlanId, ProviderCatalogMapping>;
  aiAddonsCatalog: {
    student_monthly: { productId: string | null; priceId: string | null; checkoutUrl: string | null };
    exam_prep_pack: { productId: string | null; priceId: string | null; checkoutUrl: string | null };
  };
  missingRequirements: string[];
  sandboxReady: boolean;
  liveCheckoutAllowed: boolean;
  providerReadinessState: {
    providerSelection: 'READY' | 'BLOCKED_OWNER_PROVIDER_CHOICE';
    sellerAccount: 'BLOCKED_HUMAN_INPUT' | 'READY';
    productCategory: 'BLOCKED_PROVIDER_CONFIRMATION' | 'READY';
    educatorAffiliateProgramme: 'DISABLED_PENDING_PROVIDER_WRITTEN_APPROVAL';
  };
}

export const BILLING_PROVIDER_DISCLOSURE =
  'Online checkout, global taxes/VAT, billing receipts, and buyer refunds are handled securely inside your browser via Whop (Alphatomy’s selected Merchant of Record) once live sales are enabled.';

export const DEFAULT_SELLER_IDENTITY: SellerIdentityConfig = {
  tradingName: 'Alphatomy',
  legalSellerName: null,
  sellerType: null,
  sellerCountry: null,
  supportEmail: null,
  supportPhone: null,
  approvedDomain: null,
  pricingConfirmed: false,
  sellerApprovedByProvider: false,
  domainApprovedByProvider: false,
  policiesPublished: true,
  billingProvider: 'whop',
  billingEnvironment: 'sandbox',
  billingClientConfigured: false,
  portalUrl: null,
  liveCheckoutEnabled: false,
};

/**
 * Central Commercial Pricing Configuration.
 * Draft USD amounts for Student Plus and Educator Plus are launch recommendations
 * intended for realistic global + South Asian student affordability until confirmed by the owner.
 */
export const COMMERCIAL_PLANS: readonly CommercialPlanDefinition[] = [
  {
    id: 'free_explorer',
    name: 'Free Explorer',
    tagline: 'Meaningful access to interactive 3D anatomy and self-study fundamentals with zero login required.',
    intendedUsers: [
      'Grades 6–12 school beginners & general curiosity learners',
      'Students evaluating the 3D viewer before subscribing',
      'Offline/local-first learners using browser IndexedDB storage',
    ],
    currency: 'USD',
    monthlyPriceUsdCents: 0,
    annualPriceUsdCents: 0,
    pricingStatus: 'free_confirmed',
    billingKind: 'free',
    renewalBehavior: 'Does not renew and requires no payment card.',
    accountRequirements: 'No account required for local IndexedDB study storage; optional Google Sign-In for classroom joins.',
    cancellationBehavior: 'No subscription to cancel.',
    accessAfterCancellation: 'Always available free of charge for core exploration.',
    usageLimits: [
      'Full interactive 3D Male & Female viewer (2,301 Male / 2,328 Female parts + optional overlays)',
      '12 canonical body systems, 16 subject summaries, practice quizzes, flashcards & spotter lab',
      'Local browser storage (IndexedDB) + JSON export/import backup',
      'Optional bounded AI Navigator preview allowance when AI_REQUIRE_SUBSCRIPTION=false',
    ],
    aiCreditAllowance: {
      includedMonthlyCredits: null,
      summary: 'Bounded optional preview cap (~8 queries total) when enabled; separate AI top-ups available anytime.',
    },
    includedFeatures: [
      'Interactive 3D Body Explorer (Male & Female overlays)',
      'All 12 Canonical Body Systems & FMA Structure Reference',
      'Guided Study Workspace (Foundational to Advanced views)',
      'Practice Quizzes, SM-2 Flashcards & 3D Spotter Practical Lab',
      'Physiology Sliders, Histology Micrographs & Radiology Plates',
      'Worldwide Syllabus Navigator & Local JSON Backup',
    ],
    billingCatalogEnvKeys: {
      productIdEnv: null,
      monthlyPriceIdEnv: null,
      annualPriceIdEnv: null,
    },
  },
  {
    id: 'student_plus',
    name: 'Student Plus',
    tagline: 'Complete exam-ready learning membership with cross-device cloud progress and expanded AI study allowance.',
    intendedUsers: [
      'FSc Pre-Medical, Matric, A-Level & High School students',
      'MDCAT / Pre-Med entrance candidates',
      'MBBS, Nursing & Allied Health university students',
    ],
    currency: 'USD',
    monthlyPriceUsdCents: 499,
    annualPriceUsdCents: 3999,
    pricingStatus: 'draft_recommendation',
    billingKind: 'recurring',
    renewalBehavior:
      'Automatically renews monthly or annually through the configured payment provider unless canceled before the next billing date.',
    accountRequirements: 'Verified browser session or Google Sign-In recommended to restore entitlements across devices.',
    cancellationBehavior:
      'Cancel anytime via the Customer Portal or billing support link; future renewals stop immediately.',
    accessAfterCancellation:
      'Paid Student Plus access remains active through the end of the already-paid billing period, then reverts to Free Explorer without deleting local study history.',
    usageLimits: [
      'Everything in Free Explorer',
      'Cross-device entitlement restoration & cloud progress priority sync',
      'Printable study summaries, syllabus alignment checklists & topic bookmarks sync',
      'Includes bounded Student AI monthly allowance when AI billing is enabled (250,000 credits/month; unused monthly credits do not roll over infinitely; never misleadingly billed as unlimited)',
    ],
    aiCreditAllowance: {
      includedMonthlyCredits: 250_000,
      summary: '250,000 metered Gemini AI credits per billing period (~180 average queries), clearly capped.',
    },
    includedFeatures: [
      'All Free Explorer 3D, Reference & Assessment Tools',
      'Verified Server-Side Entitlement & Cross-Device Restore',
      'Priority Cloud Sync & Classroom Submission History',
      'Student Plus 250,000 Metered AI Study Credits / Billing Cycle',
      'Downloadable Revision Decks, Syllabus Coverage Matrices & Study Exports',
    ],
    billingCatalogEnvKeys: {
      productIdEnv: 'BILLING_PRODUCT_STUDENT_PLUS',
      monthlyPriceIdEnv: 'BILLING_PRICE_STUDENT_PLUS_MONTHLY',
      annualPriceIdEnv: 'BILLING_PRICE_STUDENT_PLUS_ANNUAL',
    },
  },
  {
    id: 'educator_plus',
    name: 'Educator Plus',
    tagline: 'Built for teachers, lecturers & anatomy professors preparing classes, 3D demonstrations, and worksheets.',
    intendedUsers: [
      'High school biology & health science teachers',
      'University anatomy & physiology lecturers',
      'Medical, nursing & allied-health faculty instructors',
    ],
    currency: 'USD',
    monthlyPriceUsdCents: 999,
    annualPriceUsdCents: 7999,
    pricingStatus: 'draft_recommendation',
    billingKind: 'recurring',
    renewalBehavior:
      'Automatically renews monthly or annually through the configured payment provider unless canceled before the next billing date.',
    accountRequirements: 'Google Sign-In required for cloud Classroom creation and cross-device entitlement sync.',
    cancellationBehavior:
      'Cancel anytime via the Customer Portal; existing local exports remain on your computer.',
    accessAfterCancellation:
      'Educator Plus remains active until the end of your current paid period, then transitions to Free Explorer.',
    usageLimits: [
      'Everything in Student Plus',
      'Teacher & Professor Planning Workspace across all 16 domains & 13 curricula',
      'PowerPoint (.pptx), PDF worksheet, and Markdown lecture outline generation',
      '3D Lecture & Presentation Studio with saved sequence timelines',
      'Educator classroom join codes, assignment publishing & anonymized roster mastery summaries',
    ],
    aiCreditAllowance: {
      includedMonthlyCredits: 500_000,
      summary: '500,000 metered Gemini AI credits per billing period (~360 average lecture/navigation turns).',
    },
    includedFeatures: [
      'Everything in Student Plus membership',
      'Full Educator Workspace & Custom Teaching Sequences',
      'Client-Side .pptx Slide Decks & .pdf Student Worksheet Exports',
      'Classroom Creation, Assignment Publishing & Progress Reviews',
      'Educator Plus 500,000 Metered AI Credits / Billing Cycle',
    ],
    billingCatalogEnvKeys: {
      productIdEnv: 'BILLING_PRODUCT_EDUCATOR_PLUS',
      monthlyPriceIdEnv: 'BILLING_PRICE_EDUCATOR_PLUS_MONTHLY',
      annualPriceIdEnv: 'BILLING_PRICE_EDUCATOR_PLUS_ANNUAL',
    },
  },
  {
    id: 'institution_custom',
    name: 'Institution & Department',
    tagline: 'Custom departmental inquiry for colleges, medical schools, or multi-classroom cohorts.',
    intendedUsers: [
      'Medical & nursing colleges',
      'Pre-medical academies & science departments',
      'Curriculum coordinators evaluating cohort licensing',
    ],
    currency: 'USD',
    monthlyPriceUsdCents: null,
    annualPriceUsdCents: null,
    pricingStatus: 'custom_inquiry',
    billingKind: 'custom',
    renewalBehavior: 'Configured per written institutional invoice or agreed annual cohort schedule.',
    accountRequirements: 'Requires direct onboarding consultation via Contact & Support; no instant self-serve checkout.',
    cancellationBehavior: 'Governed by the specific written institutional quote.',
    accessAfterCancellation: 'Local backups remain exportable in JSON format.',
    usageLimits: [
      'Inquiry-based seat allocation and curriculum mapping workshop',
      'Does not invent automated SSO/SAML, 99.99% uptime SLA, or HIPAA/clinical accreditation claims',
    ],
    aiCreditAllowance: {
      includedMonthlyCredits: null,
      summary: 'Scoped per approved institutional cohort agreement.',
    },
    includedFeatures: [
      'All Educator Plus & Student Plus capabilities across cohort seats',
      'Curriculum alignment walkthrough with existing 13 frameworks',
      'Manual onboarding guidance & educator pack validation support',
    ],
    billingCatalogEnvKeys: {
      productIdEnv: null,
      monthlyPriceIdEnv: null,
      annualPriceIdEnv: null,
    },
  },
];

export interface ComparisonMatrixRow {
  feature: string;
  category: string;
  free: string;
  student: string;
  educator: string;
  institution: string;
}

export const COMMERCIAL_COMPARISON_ROWS: readonly ComparisonMatrixRow[] = [
  {
    feature: '3D Male & Female Human Anatomy Viewer',
    category: '3D & Reference',
    free: 'Full core models',
    student: 'Full core models',
    educator: 'Full core models',
    institution: 'Full core models',
  },
  {
    feature: '12 Body Systems, 16 Subjects & Syllabus Match',
    category: 'Curriculum',
    free: 'Included',
    student: 'Included',
    educator: 'Included',
    institution: 'Included + Cohort Walk',
  },
  {
    feature: 'Connected Study Workspace & Histology / Radiology',
    category: 'Study',
    free: 'Included',
    student: 'Included',
    educator: 'Included',
    institution: 'Included',
  },
  {
    feature: 'Quizzes, SM-2 Flashcards & 3D Spotter Lab',
    category: 'Practice',
    free: 'Included',
    student: 'Included + Sync',
    educator: 'Included + Sync',
    institution: 'Included + Sync',
  },
  {
    feature: 'Local IndexedDB + JSON Export/Import',
    category: 'Data & Sync',
    free: 'Included',
    student: 'Included',
    educator: 'Included',
    institution: 'Included',
  },
  {
    feature: 'Server-Verified Subscription Entitlement',
    category: 'Account',
    free: 'Free tier',
    student: 'Active Paid Entitlement',
    educator: 'Active Paid Entitlement',
    institution: 'Custom Agreement',
  },
  {
    feature: 'AI Study Navigator Credit Allowance (Optional)',
    category: 'AI Credits',
    free: 'Bounded preview (~8 turns)',
    student: '250,000 credits / mo',
    educator: '500,000 credits / mo',
    institution: 'Custom scoped allowance',
  },
  {
    feature: 'Separate AI Top-Up Burst Packs',
    category: 'AI Credits',
    free: 'Optional add-on ($9.99)',
    student: 'Optional add-on ($9.99)',
    educator: 'Optional add-on ($9.99)',
    institution: 'Optional add-on',
  },
  {
    feature: 'Educator Sequence Builder & Classrooms',
    category: 'Teaching',
    free: 'View / Local preview',
    student: 'Join Classrooms',
    educator: 'Full Classroom & Sequencing',
    institution: 'Multi-Instructor Support',
  },
  {
    feature: 'Export .pptx Decks, .pdf Worksheets & .md Guides',
    category: 'Exports',
    free: 'Basic outlines',
    student: 'Study exports',
    educator: 'Full Educator Exports',
    institution: 'Full Educator Exports',
  },
];

export function getCommercialPlanById(planId: string): CommercialPlanDefinition | undefined {
  return COMMERCIAL_PLANS.find((p) => p.id === planId);
}

export function formatUsdCents(cents: number | null): string {
  if (cents === null) return 'Custom';
  if (cents === 0) return '$0';
  return `$${(cents / 100).toFixed(2)}`;
}

export function getDefaultCommercialRuntimeSnapshot(): CommercialRuntimeSnapshot {
  return {
    seller: { ...DEFAULT_SELLER_IDENTITY },
    billingCatalog: {
      free_explorer: {
        productId: null,
        monthlyPriceId: null,
        annualPriceId: null,
        monthlyCheckoutUrl: null,
        annualCheckoutUrl: null,
      },
      student_plus: {
        productId: null,
        monthlyPriceId: null,
        annualPriceId: null,
        monthlyCheckoutUrl: null,
        annualCheckoutUrl: null,
      },
      educator_plus: {
        productId: null,
        monthlyPriceId: null,
        annualPriceId: null,
        monthlyCheckoutUrl: null,
        annualCheckoutUrl: null,
      },
      institution_custom: {
        productId: null,
        monthlyPriceId: null,
        annualPriceId: null,
        monthlyCheckoutUrl: null,
        annualCheckoutUrl: null,
      },
    },
    aiAddonsCatalog: {
      student_monthly: { productId: null, priceId: null, checkoutUrl: null },
      exam_prep_pack: { productId: null, priceId: null, checkoutUrl: null },
    },
    missingRequirements: [
      'Seller legal name, seller type, and country are not yet confirmed by the owner.',
      'Public support email and support phone number have not yet been supplied.',
      'Recommended draft prices ($4.99/$39.99 Student Plus, $9.99/$79.99 Educator Plus) require explicit owner confirmation.',
      'Whop seller onboarding & KYC verification are not yet marked approved.',
      'Live domain approval and BILLING_APPROVED_DOMAIN (e.g., alphatomy.elysiumforge.solutions) are not yet configured.',
      'Whop Plan IDs (plan_...) and Webhook Secret (ws_...) are not yet configured in environment variables.',
    ],
    sandboxReady: false,
    liveCheckoutAllowed: false,
    providerReadinessState: {
      providerSelection: 'READY',
      sellerAccount: 'BLOCKED_HUMAN_INPUT',
      productCategory: 'BLOCKED_PROVIDER_CONFIRMATION',
      educatorAffiliateProgramme: 'DISABLED_PENDING_PROVIDER_WRITTEN_APPROVAL',
    },
  };
}
