import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, ExternalLink, Microscope, X, ZoomIn, ZoomOut } from 'lucide-react';
import type { CanonicalSystemId } from '../anatomy-systems';
import {
  HISTOLOGY_CATEGORIES,
  HISTOLOGY_ENTRIES,
  type HistologyCategory,
  type HistologyEntry,
} from '../data/histology-data';
import StudyResourceList from '../components/StudyResourceList';

interface Props {
  initialEntryId?: string;
  initialSystemId?: CanonicalSystemId;
  onInspectConcept: (conceptId: string) => void;
  onOpenLearnSystem: (systemId: CanonicalSystemId) => void;
}

export default function HistologyPage({
  initialEntryId,
  initialSystemId,
  onInspectConcept,
  onOpenLearnSystem,
}: Props) {
  const [catFilter, setCatFilter] = useState<HistologyCategory | 'all'>('all');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [activeSpecimen, setActiveSpecimen] = useState<HistologyEntry | null>(null);
  const [zoom, setZoom] = useState<number>(1);

  useEffect(() => {
    const matched = initialEntryId
      ? HISTOLOGY_ENTRIES.find((h) => h.id === initialEntryId)
      : initialSystemId
        ? HISTOLOGY_ENTRIES.find((h) => h.canonicalSystem === initialSystemId)
        : undefined;
    if (matched) {
      setCatFilter(matched.category);
    }
  }, [initialEntryId, initialSystemId]);

  const filtered = useMemo(
    () =>
      catFilter === 'all'
        ? HISTOLOGY_ENTRIES
        : HISTOLOGY_ENTRIES.filter((h) => h.category === catFilter),
    [catFilter],
  );

  return (
    <div className="a360-page">
      <header className="a360-page-header">
        <p className="a360-kicker">Microanatomy &amp; Cellular Architecture</p>
        <h1>Histology &amp; Microanatomy Library</h1>
        <p className="a360-lead">
          Structured cellular and organ microanatomy notes covering epithelial, connective, muscle,
          and nervous tissues—connected to gross 3D organs with interactive self-checks and
          import-ready specimen micrograph slots.
        </p>
      </header>

      <div className="a360-coverage-box" role="note">
        <strong>Microscopy Media Disclosure:</strong> All 10 core Histology Library specimen panels
        now include locally bundled, openly licensed light-microscopy micrographs (CC0 / CC BY /
        CC BY-SA from Wikimedia Commons, University of Michigan Virtual Microscopy, and Berkshire
        Community College Bioscience Image Library) with stain, magnification/scale, and source URL
        attribution. Broader 18-chapter Domain C curriculum packs and Haematology / Microbiology /
        Pathology slide series remain text-first (<code>asset_required</code>) until full per-chapter
        slide banks are curated.
      </div>

      <StudyResourceList
        module="histology"
        limit={3}
        heading="Open Virtual Microscopy & Tissue References"
      />

      <section className="a360-filter-row" aria-label="Filter histology categories">
        <button
          type="button"
          className={`a360-filter-btn ${catFilter === 'all' ? 'active' : ''}`}
          onClick={() => setCatFilter('all')}
        >
          All Tissues &amp; Organs ({HISTOLOGY_ENTRIES.length})
        </button>
        {HISTOLOGY_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`a360-filter-btn ${catFilter === c.id ? 'active' : ''}`}
            onClick={() => setCatFilter(c.id)}
          >
            {c.label}
          </button>
        ))}
      </section>

      <div className="a360-histology-grid">
        {filtered.map((entry) => {
          const picked = selectedAnswers[entry.id];
          const answered = typeof picked === 'number';
          const isCorrect = answered && entry.selfCheck && picked === entry.selfCheck.correctIndex;

          return (
            <article key={entry.id} className="a360-knowledge-card" data-testid={`histology-card-${entry.id}`}>
              <p className="a360-kicker">
                {HISTOLOGY_CATEGORIES.find((c) => c.id === entry.category)?.label} ·{' '}
                {entry.kind === 'tissue-class' ? 'Tissue Class' : 'Organ Microanatomy'} ·{' '}
                {entry.specimenSlot.mediaStatus === 'verified_bundled_micrograph'
                  ? 'Bundled CC Micrograph'
                  : 'Text Curriculum'}
              </p>
              <h2>{entry.title}</h2>
              <p className="a360-card-detail">{entry.summary}</p>

              <div className="a360-subblock">
                <h3>Microscopic Landmarks</h3>
                <ul className="a360-fact-list">
                  {entry.microscopicStructures.map((ms) => (
                    <li key={ms}>{ms}</li>
                  ))}
                </ul>
              </div>

              <div className="a360-subblock">
                <h3>Diagnostic Microanatomy Points</h3>
                <ul className="a360-fact-list">
                  {entry.diagnosticFeatures.map((df) => (
                    <li key={df}>{df}</li>
                  ))}
                </ul>
              </div>

              {entry.selfCheck && (
                <div className="a360-subblock" data-testid={`histology-check-${entry.id}`}>
                  <h3>Microanatomy Self-Check</h3>
                  <p className="a360-card-detail">{entry.selfCheck.prompt}</p>
                  <div className="flex flex-col gap-1.5 mt-2">
                    {entry.selfCheck.options.map((opt, idx) => {
                      const isSelected = picked === idx;
                      const isRightOption = answered && idx === entry.selfCheck!.correctIndex;
                      const isWrongPick = answered && isSelected && !isRightOption;
                      return (
                        <button
                          key={opt}
                          type="button"
                          className={`a360-filter-btn text-left ${
                            isRightOption
                              ? 'active'
                              : isWrongPick
                                ? 'opacity-70 line-through'
                                : ''
                          }`}
                          onClick={() =>
                            setSelectedAnswers((prev) => ({ ...prev, [entry.id]: idx }))
                          }
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {answered && (
                    <p className="a360-muted mt-2" role="status">
                      <strong>{isCorrect ? 'Correct:' : 'Review:'}</strong>{' '}
                      {entry.selfCheck.rationale}
                    </p>
                  )}
                </div>
              )}

              <div className="a360-specimen-slot">
                <div className="a360-specimen-head">
                  <Microscope size={15} />
                  <strong>{entry.specimenSlot.title}</strong>
                </div>
                {entry.specimenSlot.imageUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSpecimen(entry);
                      setZoom(1);
                    }}
                    className="mt-2 block w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-950/95 text-left hover:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    aria-label={`Inspect micrograph for ${entry.title}`}
                  >
                    <img
                      src={entry.specimenSlot.imageUrl}
                      alt={`${entry.specimenSlot.title} (${entry.specimenSlot.stainProtocol})`}
                      loading="lazy"
                      className="h-44 w-full object-cover transition-transform duration-200 hover:scale-[1.02]"
                    />
                  </button>
                )}
                <p className="a360-muted mt-2">
                  Stain: {entry.specimenSlot.stainProtocol} · Magnification/Scale:{' '}
                  {entry.specimenSlot.expectedMagnification} · Status:{' '}
                  {entry.specimenSlot.imageUrl ? 'Verified Bundled Micrograph' : 'Import-Ready Text Slot'}
                </p>
                {entry.specimenSlot.scaleNote && (
                  <p className="a360-muted">{entry.specimenSlot.scaleNote}</p>
                )}
                <p className="a360-muted">{entry.specimenSlot.attributionRequirement}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="a360-btn-secondary"
                    data-testid={`open-specimen-${entry.id}`}
                    onClick={() => {
                      setActiveSpecimen(entry);
                      setZoom(1);
                    }}
                  >
                    <ZoomIn size={14} /> Open Specimen Viewer
                  </button>
                  {entry.specimenSlot.sourceUrl && (
                    <a
                      href={entry.specimenSlot.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:underline"
                    >
                      <span>Commons Source ({entry.specimenSlot.license})</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>

              <div className="a360-card-footer">
                <div className="a360-card-actions">
                  {entry.linkedConceptIds[0] && (
                    <button
                      type="button"
                      className="a360-card-btn"
                      onClick={() => onInspectConcept(entry.linkedConceptIds[0])}
                    >
                      Inspect Gross Organ in 3D <ArrowRight size={14} />
                    </button>
                  )}
                  {entry.canonicalSystem && (
                    <button
                      type="button"
                      className="a360-btn-secondary"
                      onClick={() => onOpenLearnSystem(entry.canonicalSystem!)}
                    >
                      <BookOpen size={14} /> Open System Lesson
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {activeSpecimen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Microscopy specimen viewer: ${activeSpecimen.specimenSlot.title}`}
          data-testid="histology-specimen-modal"
        >
          <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
              <div>
                <p className="a360-kicker">
                  {activeSpecimen.specimenSlot.stainProtocol} · {activeSpecimen.specimenSlot.expectedMagnification}
                </p>
                <h2 className="text-lg font-semibold text-slate-900">
                  {activeSpecimen.specimenSlot.title}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close specimen viewer"
                className="a360-btn-secondary"
                onClick={() => setActiveSpecimen(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="my-4 overflow-auto rounded-lg border border-slate-200 bg-slate-950 min-h-[260px] max-h-[420px] flex items-center justify-center p-4">
              {activeSpecimen.specimenSlot.imageUrl ? (
                <img
                  src={activeSpecimen.specimenSlot.imageUrl}
                  alt={activeSpecimen.specimenSlot.title}
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                  className="max-h-[380px] transition-transform duration-150"
                />
              ) : (
                <div className="text-center max-w-md space-y-2 text-slate-200">
                  <Microscope size={32} className="mx-auto text-slate-400" />
                  <p className="font-medium text-white">
                    No Bundled Microscopy Image (Import-Ready Slot: {activeSpecimen.specimenSlot.slotId})
                  </p>
                  <p className="text-xs text-slate-300">
                    {activeSpecimen.specimenSlot.attributionRequirement}
                  </p>
                </div>
              )}
            </div>

            <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 space-y-1">
              <p>
                <strong>Attribution &amp; Scale:</strong> {activeSpecimen.specimenSlot.attributionRequirement}
                {activeSpecimen.specimenSlot.scaleNote ? ` — ${activeSpecimen.specimenSlot.scaleNote}` : ''}
              </p>
              {activeSpecimen.specimenSlot.sourceUrl && (
                <p>
                  <a
                    href={activeSpecimen.specimenSlot.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-teal-800 hover:underline"
                  >
                    <span>Verify Original Micrograph on Wikimedia Commons ({activeSpecimen.specimenSlot.license})</span>
                    <ExternalLink size={12} />
                  </a>
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-slate-200 pt-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="a360-btn-secondary"
                  disabled={zoom <= 1}
                  onClick={() => setZoom((z) => Math.max(1, Number((z - 0.5).toFixed(1))))}
                >
                  <ZoomOut size={14} /> Zoom Out
                </button>
                <span className="text-xs font-medium text-slate-700">{zoom.toFixed(1)}×</span>
                <button
                  type="button"
                  className="a360-btn-secondary"
                  disabled={zoom >= 4}
                  onClick={() => setZoom((z) => Math.min(4, Number((z + 0.5).toFixed(1))))}
                >
                  <ZoomIn size={14} /> Zoom In
                </button>
              </div>
              <button
                type="button"
                className="a360-card-btn"
                onClick={() => setActiveSpecimen(null)}
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
