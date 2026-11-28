import PageOrientationBar from '../components/PageOrientationBar';
import SiteFooter from '../components/SiteFooter';
import { useBilling } from '../components/BillingContext';
import type { AppRoute } from '../navigation-registry';

interface Props {
  onNavigate: (route: AppRoute) => void;
}

export default function PrivacyPage({ onNavigate }: Props) {
  const { config } = useBilling();
  const seller = config.seller;

  return (
    <div className="a360-page a360-narrow" data-testid="privacy-page">
      <header className="a360-page-header">
        <p className="a360-kicker">Code-Audited Data &amp; Privacy Disclosure</p>
        <h1>Privacy Policy</h1>
        <p className="a360-lead">
          Accurate explanation of what Alphatomy stores locally in your browser, what is
          transmitted when optional cloud, AI, YouTube, or billing features are used, and our
          children&apos;s privacy limitations.
        </p>
      </header>

      <PageOrientationBar
        whatThisIs="An honest audit of every storage mechanism, cloud sync route, AI API request, and third-party integration used in Alphatomy."
        primaryHint="You can explore 3D anatomy, quizzes, and local backups without signing in."
        spokenSummary="Alphatomy Privacy Policy. Core 3D exploration and study progress live locally in browser storage, while optional Google Sign-In, classrooms, AI Tutor, YouTube videos, and payment processors transmit specific data to external services."
      />

      <section
        className="rounded-xl border border-rose-300 bg-rose-50/70 p-4 text-xs leading-relaxed text-rose-950"
        role="status"
        data-testid="childrens-privacy-notice"
      >
        <strong className="block font-semibold">
          Important Children&apos;s Privacy &amp; Under-13 (COPPA) Notice:
        </strong>
        <p className="mt-1">
          Alphatomy includes school-level curriculum tracks (starting at Grade 6), meaning some
          prospective learners may be under 13 years of age. While local-only 3D browsing does not
          require registration or transmit personal details, optional account features (Google
          Sign-In, Cloud Classroom rosters, email storage in Firebase, and AI Navigator prompts) do{' '}
          <strong>not</strong> currently enforce verifiable parental consent or age-gating workflows.
          Accordingly, we do <strong>not</strong> claim full COPPA or child-privacy legal
          compliance yet, and minor-targeted account/cloud data collection must remain restricted
          until appropriate parental-consent safeguards and formal legal review are completed.
        </p>
      </section>

      <section className="a360-prose-block space-y-3">
        <h2>1. Information Stored Locally on Your Device</h2>
        <p>
          When you use Alphatomy without signing in, your study data stays inside your browser:
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>
            <strong>IndexedDB (<code>Anatomy360StudyDB</code>) &amp; <code>localStorage</code> fallback:</strong>{' '}
            stores your chosen display name (default: <code>Explorer</code>), selected study track,
            completed topic IDs, quiz responses, SM-2 flashcard intervals, 3D spotter attempts,
            saved bookmarks, custom pasted syllabi, custom educator teaching sequences, and recent
            activity timestamps.
          </li>
          <li>
            <strong>No Silent Tracking Analytics:</strong> Alphatomy does not embed third-party
            behavioral ad trackers or third-party session-replay scripts.
          </li>
        </ul>
      </section>

      <section className="a360-prose-block space-y-3">
        <h2>2. Cookies, Session Tokens &amp; Billing Storage</h2>
        <p>
          For optional server-verified billing and AI Navigator metering, the Alphatomy backend
          uses an HTTP-only signed session cookie (<code>a360_ai_sid</code>, <code>SameSite=None</code>,{' '}
          <code>Secure</code>, <code>Partitioned</code>) plus an in-memory bearer token linking to
          a pseudonymous account ID (<code>acct_...</code>).
        </p>
        <p>
          Server-side billing records stored in Cloud SQL PostgreSQL (with local SQLite fallback in
          offline development) retain account IDs, optional verified Firebase UID/email (if linked),
          provider customer/subscription/transaction IDs, active tier status, billing periods,
          refund/reversal status, and metered AI credit balances.
        </p>
      </section>

      <section className="a360-prose-block space-y-3">
        <h2>3. Third-Party Processors &amp; External Network Requests</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">
          <li>
            <strong>Google Firebase Authentication &amp; Cloud Firestore (Optional Sign-In):</strong>{' '}
            If you choose Google Sign-In in Classroom/Cloud Sync panels, Firebase authenticates your
            Google account, stores your email/profile inside your private Firestore document (
            <code>/users/{'{uid}'}/private/account</code>), syncs study state under{' '}
            <code>/users/{'{uid}'}/progress/state</code>, and shares non-email student display labels
            and mastery summaries within classrooms you explicitly join or create.
          </li>
          <li>
            <strong>Google Gemini API via Backend Proxy (Optional AI Navigator):</strong> Prompts
            you submit to the AI Anatomy Navigator (along with current selected concept/system
            context and up to 4 recent turns) are sent to our server route{' '}
            <code>/api/ai/navigate</code>, which calls Google&apos;s Gemini API (
            <code>gemini-4-hydrogen</code>) using the server-side API key.
          </li>
          <li>
            <strong>YouTube Educational Videos (Optional Lecture Embeds &amp; Search):</strong>{' '}
            Opening embedded lectures loads players from privacy-enhanced{' '}
            <code>youtube-nocookie.com</code>; triggering optional lecture search calls{' '}
            <code>/api/youtube/search</code> against the YouTube Data API v3 when configured.
          </li>
          <li>
            <strong>Authorized Payment Provider — Whop (When Live Checkout Is Enabled):</strong> When
            live sales are launched through Whop (Alphatomy&apos;s selected Merchant of Record),
            checkout payment details, billing address, tax data, and receipts are collected inside
            Whop&apos;s isolated checkout frames under Whop&apos;s privacy policy. Alphatomy never
            receives or stores your raw card number.
          </li>
          <li>
            <strong>3D Model Asset Delivery:</strong> Static anatomical mesh chunks (
            <code>/models/*.bin.gz</code>) are fetched over HTTP/HTTPS as needed.
          </li>
        </ul>
      </section>

      <section className="a360-prose-block space-y-3">
        <h2>4. Purpose of Processing, Retention &amp; Security</h2>
        <p>
          We process study state to save your progress and deliver quizzes/flashcards; we process
          server account &amp; webhook records to verify payments, enforce AI token quotas, handle
          refunds/cancellations, and prevent replay or abuse. Local browser data persists until you
          clear it or reset it; server billing transaction records are retained as needed for
          tax/audit reconciliation, dispute handling, and entitlement restoration.
        </p>
        <p>
          All billing webhooks require HMAC-SHA256 signature verification and timestamp replay
          protection before granting or revoking access.
        </p>
      </section>

      <section className="a360-prose-block space-y-3">
        <h2>5. Data Export, Deletion &amp; User Rights</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">
          <li>
            <strong>Export Anytime:</strong> Open the{' '}
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="font-semibold text-teal-800 underline"
            >
              Study Dashboard
            </button>{' '}
            and click <strong>Export Study Data (JSON)</strong> to download a full portable copy of
            your local progress, bookmarks, flashcards, and syllabi.
          </li>
          <li>
            <strong>Local Reset:</strong> Use <strong>Reset All Local Study Progress</strong> on the
            Dashboard or clear browser storage to erase IndexedDB and <code>localStorage</code> data.
          </li>
          <li>
            <strong>Cloud &amp; Billing Deletion Requests:</strong> Sign out of Google Sign-In
            anytime, or contact support at{' '}
            {seller.supportEmail ? (
              <a
                href={`mailto:${seller.supportEmail}`}
                className="font-semibold text-teal-800 underline"
              >
                {seller.supportEmail}
              </a>
            ) : (
              '[Pending Owner Support Email — see Contact & Support]'
            )}{' '}
            to request deletion of server/cloud records (subject to statutory transaction recordkeeping
            obligations).
          </li>
        </ul>
      </section>

      <SiteFooter onNavigate={onNavigate} />
    </div>
  );
}
