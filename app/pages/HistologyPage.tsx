import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Microscope } from 'lucide-react';
import type { CanonicalSystemId } from '../anatomy-systems';
import {
  HISTOLOGY_CATEGORIES,
  HISTOLOGY_ENTRIES,
  type HistologyCategory,
} from '../data/histology-data';
import StudyResourceList from '../components/StudyResourceList';

interface Props {
  onInspectConcept: (conceptId: string) => void;
  onOpenLearnSystem: (systemId: CanonicalSystemId) => void;
}

export default function HistologyPage({ onInspectConcept, onOpenLearnSystem }: Props) {
  const [catFilter, setCatFilter] = useState<HistologyCategory | 'all'>('all');

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
        <p className="a360-kicker">Microanatomy & Cellular Architecture</p>
        <h1>Histology & Microanatomy Library</h1>
        <p className="a360-lead">
          Structured cellular and organ microanatomy notes covering epithelial, connective, muscle,
          and nervous tissues—connected to gross 3D organs with import-ready specimen micrograph slots.
        </p>
      </header>

      <div className="a360-coverage-box" role="note">
        <strong>Microscopy Media Disclosure:</strong> No third-party virtual microscopy micrographs
        are bundled in this static repository. Every entry provides verified microanatomy text,
        expected staining protocols, magnification specifications, and strict CC BY 4.0 / CC0 specimen
        attribution slots without displaying synthetic placeholder microscope pictures.
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
          All Tissues & Organs ({HISTOLOGY_ENTRIES.length})
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
        {filtered.map((entry) => (
          <article key={entry.id} className="a360-knowledge-card">
            <p className="a360-kicker">
              {HISTOLOGY_CATEGORIES.find((c) => c.id === entry.category)?.label} ·{' '}
              {entry.kind === 'tissue-class' ? 'Tissue Class' : 'Organ Microanatomy'} ·{' '}
              Text Curriculum
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

            <div className="a360-specimen-slot">
              <div className="a360-specimen-head">
                <Microscope size={15} />
                <strong>{entry.specimenSlot.title}</strong>
              </div>
              <p className="a360-muted">
                Stain: {entry.specimenSlot.stainProtocol} · Expected Magnification:{' '}
                {entry.specimenSlot.expectedMagnification} · Status: Import-Ready Text Slot
              </p>
              <p className="a360-muted">{entry.specimenSlot.attributionRequirement}</p>
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
        ))}
      </div>
    </div>
  );
}
