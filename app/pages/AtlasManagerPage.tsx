import { useRef, useState } from 'react';
import { CheckCircle2, FileCheck2, Layers3, Upload, XCircle } from 'lucide-react';
import {
  getRegisteredContentSummary,
  REGISTERED_ATLASES,
  validateAtlasManifest,
  validateContentPackJson,
  type ContentPackValidationResult,
  type ManifestValidationResult,
} from '../content-registry';

const RELEASE_CHECKLIST_ITEMS = [
  {
    id: 'rel-1',
    item: 'Third-Party License Legal Sign-off',
    detail: 'Confirm BodyParts3D CC BY 4.0 attribution notice remains visible in UI, About page, and packaged docs.',
    doneInCode: true,
  },
  {
    id: 'rel-2',
    item: 'Adult Female Reference Geometry Bundle',
    detail: 'Pending external verified CC BY 4.0 / CC0 mesh pack conversion into chunked binary format.',
    doneInCode: false,
  },
  {
    id: 'rel-3',
    item: 'Verified Microscopy Histology Slides',
    detail: 'Import slots prepared; requires licensed microscopy micrographs with magnification scale bars.',
    doneInCode: false,
  },
  {
    id: 'rel-4',
    item: 'Static Hosting & Binary Compression Headers',
    detail: 'Ensure .bin.gz or CDN static assets serve cleanly with CORS/cache headers on Cloudflare Pages or Vercel.',
    doneInCode: true,
  },
  {
    id: 'rel-5',
    item: 'Faculty Curriculum Spot-Check',
    detail: 'Medical educator review of domain-specific Urdu translations before enabling bilingual toggle.',
    doneInCode: false,
  },
];

export default function AtlasManagerPage() {
  const atlasInputRef = useRef<HTMLInputElement>(null);
  const packInputRef = useRef<HTMLInputElement>(null);

  const [manifestReport, setManifestReport] = useState<ManifestValidationResult | null>(null);
  const [packReport, setPackReport] = useState<ContentPackValidationResult | null>(null);
  const [parseErr, setParseErr] = useState('');

  const summary = getRegisteredContentSummary();

  const onValidateAtlasFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseErr('');
    try {
      const parsed = JSON.parse(await file.text());
      setManifestReport(validateAtlasManifest(parsed));
    } catch {
      setParseErr('Could not parse atlas manifest JSON.');
      setManifestReport(null);
    }
    e.target.value = '';
  };

  const onValidatePackFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseErr('');
    try {
      const parsed = JSON.parse(await file.text());
      setPackReport(validateContentPackJson(parsed));
    } catch {
      setParseErr('Could not parse content pack JSON.');
      setPackReport(null);
    }
    e.target.value = '';
  };

  return (
    <div className="a360-page">
      <header className="a360-page-header">
        <p className="a360-kicker">Multi-Atlas Scalability & Schema Governance</p>
        <h1>Atlas Registry & Content Pack Manager</h1>
        <p className="a360-lead">
          Inspect registered 3D anatomical atlases, view exact asset requirements for unavailable models
          such as Adult Female or Pediatric datasets, and validate external JSON manifests client-side.
        </p>
      </header>

      <section className="a360-metrics-strip" aria-label="Registered content inventory">
        <div className="a360-metric">
          <strong>{summary.activeAtlases} / {summary.atlases}</strong>
          <span>Active 3D Atlas Models</span>
        </div>
        <div className="a360-metric">
          <strong>{summary.curatedStructures}</strong>
          <span>Curated V2 Structures</span>
        </div>
        <div className="a360-metric">
          <strong>{summary.lessonTopics}</strong>
          <span>Lesson Topics ({summary.systems} Systems)</span>
        </div>
        <div className="a360-metric">
          <strong>v{summary.schemaVersions.knowledgeGraph}</strong>
          <span>Knowledge Schema Version</span>
        </div>
      </section>

      <section className="a360-subblock">
        <h2>Registered Anatomical Atlases</h2>
        <div className="a360-atlas-grid">
          {REGISTERED_ATLASES.map((atlasDef) => (
            <article key={atlasDef.id} className="a360-knowledge-card">
              <p className="a360-kicker">
                {atlasDef.referenceProfile} · {atlasDef.statusLabel}
              </p>
              <h3>{atlasDef.displayName}</h3>
              <p className="a360-card-detail">{atlasDef.coverageSummary}</p>
              <ul className="a360-fact-list">
                <li>Source: {atlasDef.modelSource}</li>
                <li>Format: {atlasDef.geometryFormat}</li>
                <li>Assets: {atlasDef.assetsSummary}</li>
                <li>License: {atlasDef.license}</li>
              </ul>

              {atlasDef.missingAssetRequirements && (
                <div className="a360-coverage-box">
                  <strong>Exact Asset Requirements for Integration:</strong>
                  <ul className="a360-fact-list">
                    {atlasDef.missingAssetRequirements.map((req) => (
                      <li key={req}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="a360-dashboard-grid">
        <div className="a360-chart-panel">
          <h2>Validate External Atlas Manifest JSON</h2>
          <p className="a360-muted">
            Verify whether a candidate <code>atlas.json</code> manifest conforms to Anatomy 360 mesh,
            chunk-index, and FMA concept mapping constraints before bundling.
          </p>
          <div className="a360-backup-actions">
            <button
              type="button"
              className="a360-btn-primary"
              onClick={() => atlasInputRef.current?.click()}
            >
              <Upload size={15} /> Select Atlas Manifest JSON
            </button>
            <input
              ref={atlasInputRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={onValidateAtlasFile}
            />
          </div>

          {parseErr && <p className="a360-status-note is-err">{parseErr}</p>}

          {manifestReport && (
            <div className="a360-validation-box" role="status">
              <p>
                {manifestReport.valid ? (
                  <>
                    <CheckCircle2 size={15} /> <strong>Valid Atlas Manifest</strong>
                  </>
                ) : (
                  <>
                    <XCircle size={15} /> <strong>Manifest Errors Detected</strong>
                  </>
                )}
              </p>
              {manifestReport.summary && (
                <p className="a360-muted">
                  Version {manifestReport.summary.version} · {manifestReport.summary.partsCount} parts ·{' '}
                  {manifestReport.summary.conceptsCount} concepts · {manifestReport.summary.chunksCount} chunks
                </p>
              )}
              {manifestReport.errors.length > 0 && (
                <ul className="a360-fact-list">
                  {manifestReport.errors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="a360-chart-panel">
          <h2>Validate Educational Content Pack JSON</h2>
          <p className="a360-muted">
            Validate modular curriculum packs containing new structures, lessons, questions,
            histology, or clinical cases without altering viewer or quiz code.
          </p>
          <div className="a360-backup-actions">
            <button
              type="button"
              className="a360-btn-secondary"
              onClick={() => packInputRef.current?.click()}
            >
              <FileCheck2 size={15} /> Select Content Pack JSON
            </button>
            <input
              ref={packInputRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={onValidatePackFile}
            />
          </div>

          {packReport && (
            <div className="a360-validation-box" role="status">
              <p>
                {packReport.valid ? (
                  <>
                    <CheckCircle2 size={15} /> <strong>Valid Content Pack</strong>
                  </>
                ) : (
                  <>
                    <XCircle size={15} /> <strong>Content Pack Errors</strong>
                  </>
                )}
              </p>
              <p className="a360-muted">
                Structures: {packReport.counts.structures} · Lessons: {packReport.counts.lessons} ·
                Questions: {packReport.counts.questions}
              </p>
              {packReport.errors.length > 0 && (
                <ul className="a360-fact-list">
                  {packReport.errors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="a360-subblock">
        <h2>V1 Commercial & Production Readiness Checklist</h2>
        <div className="a360-search-results-list">
          {RELEASE_CHECKLIST_ITEMS.map((row) => (
            <div key={row.id} className="a360-search-row">
              <div className="a360-search-row-info">
                <strong>{row.item}</strong>
                <span>{row.detail}</span>
              </div>
              <span className="a360-kicker">
                <Layers3 size={13} /> {row.doneInCode ? 'Verified in Build' : 'Human / External Sign-off'}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
