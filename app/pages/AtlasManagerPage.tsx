import { useRef, useState } from 'react';
import { CheckCircle2, FileCheck2, Layers3, Upload, XCircle } from 'lucide-react';
import { LAYER_BUNDLE_PROVENANCE } from '../atlas-layers';
import PageOrientationBar from '../components/PageOrientationBar';
import {
  getRegisteredContentSummary,
  REGISTERED_ATLASES,
  validateAtlasManifest,
  validateContentPackJson,
  type ContentPackValidationResult,
  type ManifestValidationResult,
} from '../content-registry';
import {
  CANONICAL_GROSS_ANATOMY_INVENTORY,
  COVERAGE_STATUS_LABELS,
  OPTIONAL_ADVANCED_LAYERS,
} from '../data/coverage-matrix';

const RELEASE_CHECKLIST_ITEMS = [
  {
    id: 'rel-1',
    item: 'Third-Party License Legal Sign-off',
    detail: 'BodyParts3D CC BY 4.0 & HuBMAP HRA CC BY 4.0 attributions verified; Z-Anatomy CC BY-SA 4.0 excluded from core bundle.',
    doneInCode: true,
  },
  {
    id: 'rel-2',
    item: 'Multi-Layer Male & Female 3D Bundle (2,401 Distinct Meshes)',
    detail: '2,301 Male Active (2,234 BP3D + 47 Shared + 20 Male HuBMAP) / 2,328 Female Active (2,189 inherited + 47 Shared + 92 Female v3.0: 84 HuBMAP + 8 procedural reconstructions; +8 Optional Pregnancy OFF by default). Verified missing gaps remain transparently documented below.',
    doneInCode: true,
  },
  {
    id: 'rel-3',
    item: 'Verified Microscopy & Radiology Reference Media',
    detail: '10 CC-licensed tissue micrographs bundled in Histology Library and 5 normal Imaging plates in Radiology Visualise tab; full per-chapter C1–C18/N1–N14 clinical slide series remain Asset Required.',
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
    detail: 'Medical educator review of domain-specific Urdu translations and regional clinical guides before enabling bilingual toggle.',
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
  const maleGapTotal = CANONICAL_GROSS_ANATOMY_INVENTORY.reduce(
    (s, r) => s + r.targetGapAdditionMale,
    0,
  );
  const femaleGapTotal = CANONICAL_GROSS_ANATOMY_INVENTORY.reduce(
    (s, r) => s + r.targetGapAdditionFemale,
    0,
  );
  const maleTarget = LAYER_BUNDLE_PROVENANCE.activeMalePartsTotal + maleGapTotal;
  const femaleTarget = LAYER_BUNDLE_PROVENANCE.activeFemalePartsTotal + femaleGapTotal;
  const maleCoveragePct = ((LAYER_BUNDLE_PROVENANCE.activeMalePartsTotal / maleTarget) * 100).toFixed(1);
  const femaleCoveragePct = (
    (LAYER_BUNDLE_PROVENANCE.activeFemalePartsTotal / femaleTarget) *
    100
  ).toFixed(1);

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
        <p className="a360-kicker">Multi-Atlas Scalability &amp; Anatomical Coverage Governance</p>
        <h1>Atlas Registry, Coverage Audit &amp; Content Pack Manager</h1>
        <p className="a360-lead">
          Inspect all registered Male, Female, Shared, and Optional 3D geometry layers (
          {LAYER_BUNDLE_PROVENANCE.totalDistinctBundledAssets.toLocaleString()} distinct bundled
          meshes), review canonical anatomical gaps vs project targets, and validate external JSON
          manifests client-side.
        </p>
      </header>

      <PageOrientationBar
        whatThisIs="Check which Male, Female, and optional 3D body models are included—and what is still unmodeled."
        primaryHint="This transparency page is great for teachers and researchers verifying 3D coverage or checking custom pack JSON files."
        howToSteps={[
          'Review the top summary cards showing active Male and Female part counts.',
          'Scroll to the table below to see which body systems have full, partial, or planned 3D models.',
          'Upload any manifest or content pack JSON file at the bottom to validate it safely in your browser.',
        ]}
      />

      <section className="a360-metrics-strip" aria-label="Registered content inventory">
        <div className="a360-metric">
          <strong>{LAYER_BUNDLE_PROVENANCE.activeMalePartsTotal.toLocaleString()} / {maleTarget.toLocaleString()}</strong>
          <span>Male Active / Target ({maleCoveragePct}%)</span>
        </div>
        <div className="a360-metric">
          <strong>{LAYER_BUNDLE_PROVENANCE.activeFemalePartsTotal.toLocaleString()} / {femaleTarget.toLocaleString()}</strong>
          <span>Female Active / Target ({femaleCoveragePct}%)</span>
        </div>
        <div className="a360-metric">
          <strong>{summary.activeAtlases} / {summary.atlases}</strong>
          <span>Active 3D Layers ({LAYER_BUNDLE_PROVENANCE.totalDistinctBundledAssets.toLocaleString()} meshes)</span>
        </div>
        <div className="a360-metric">
          <strong>{summary.curatedStructures}</strong>
          <span>Curated Structures ({summary.lessonTopics} Lesson Topics)</span>
        </div>
      </section>

      <section className="a360-subblock">
        <h2>Registered Anatomical Layers &amp; Reference Atlases</h2>
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
                  <strong>Exact Asset Requirements for Completion:</strong>
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

      <section className="a360-subblock">
        <h2>Canonical Gross-Anatomy Coverage &amp; Gap Inventory ({CANONICAL_GROSS_ANATOMY_INVENTORY.length} Audited Domains)</h2>
        <p className="a360-muted">
          Honest project-level gap audit across Male (gap: -{maleGapTotal} meshes) and Female (gap: -{femaleGapTotal} meshes; 2,189 reused male-donor base meshes outside pelvis). Full 2,437-row manifest CSV lives in{' '}
          <code>ANATOMY360_MALE_FEMALE_MESH_INVENTORY.csv</code>.
        </p>
        <div className="a360-license-table-wrap">
          <table className="a360-license-table">
            <thead>
              <tr>
                <th>Structure / Domain</th>
                <th>System</th>
                <th>Male Status</th>
                <th>Female Status</th>
                <th>Gap (M / F)</th>
                <th>License / Notes</th>
              </tr>
            </thead>
            <tbody>
              {CANONICAL_GROSS_ANATOMY_INVENTORY.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.canonicalName}</strong>
                    <div className="a360-muted">{item.fmaId} · {item.ta2Term}</div>
                  </td>
                  <td>{item.canonicalSystem}</td>
                  <td>{COVERAGE_STATUS_LABELS[item.maleStatus]}</td>
                  <td>{COVERAGE_STATUS_LABELS[item.femaleStatus]}</td>
                  <td className="font-mono tabular-nums">
                    -{item.targetGapAdditionMale} / -{item.targetGapAdditionFemale}
                  </td>
                  <td>
                    <div>{item.assetLicense}</div>
                    <div className="a360-muted">{item.notes}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="a360-subblock">
        <h2>Optional Advanced Layers (Separated From Default Baseline)</h2>
        <div className="a360-license-table-wrap">
          <table className="a360-license-table">
            <thead>
              <tr>
                <th>Optional Layer</th>
                <th>Bundled</th>
                <th>Meshes</th>
                <th>License</th>
                <th>Status &amp; Policy</th>
              </tr>
            </thead>
            <tbody>
              {OPTIONAL_ADVANCED_LAYERS.map((opt) => (
                <tr key={opt.id}>
                  <td>
                    <strong>{opt.name}</strong>
                    <div className="a360-muted">{opt.fmaId} · {opt.ta2Term}</div>
                  </td>
                  <td>{opt.bundledInRepo ? 'Yes (OFF by default)' : 'Planned'}</td>
                  <td className="font-mono tabular-nums">{opt.partCount}</td>
                  <td>{opt.license}</td>
                  <td>{opt.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="a360-dashboard-grid">
        <div className="a360-chart-panel">
          <h2>Validate External Atlas Manifest JSON</h2>
          <p className="a360-muted">
            Verify whether a candidate <code>atlas.json</code> manifest conforms to Alphatomy mesh,
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
        <h2>V1 Commercial &amp; Production Readiness Checklist</h2>
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

