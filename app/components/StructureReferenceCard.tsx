import { useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  GitBranch,
  Layers3,
  Stethoscope,
} from 'lucide-react';
import type { Atlas } from '../anatomy';
import { CANONICAL_SYSTEMS, type CanonicalSystemId } from '../anatomy-systems';
import {
  getCoverageBadgeLabel,
  getRelationshipsForConcept,
  type StructureKnowledgeV2,
} from '../knowledge-graph';
import { getReviewStatusLabel } from '../data/provenance-registry';
import { useStudy } from './StudyContext';
import StudyResourceList from './StudyResourceList';

interface Props {
  record: StructureKnowledgeV2;
  atlas: Atlas | null;
  onInspectConcept: (conceptId: string) => void;
  onOpenRelationships: (conceptId: string) => void;
  onOpenLearnSystem: (systemId: CanonicalSystemId, topicId?: string) => void;
  onOpenFlashcards: (systemId: CanonicalSystemId) => void;
  onOpenPracticalLab: () => void;
}

type LevelTab = 'beginner' | 'intermediate' | 'advanced';

export default function StructureReferenceCard({
  record,
  atlas,
  onInspectConcept,
  onOpenRelationships,
  onOpenLearnSystem,
  onOpenFlashcards,
  onOpenPracticalLab,
}: Props) {
  const [level, setLevel] = useState<LevelTab>('intermediate');
  const { isBookmarked, toggleBookmark } = useStudy();
  const saved = isBookmarked('structure', record.conceptId);
  const sys = CANONICAL_SYSTEMS.find((s) => s.id === record.canonicalSystem);
  const rels = getRelationshipsForConcept(record.conceptId, atlas);
  const relSummary = record.structuralRelationships;

  const hasStructuralFields = Boolean(
    relSummary.origin ||
      relSummary.insertion ||
      relSummary.articulations ||
      relSummary.innervation ||
      relSummary.arterialSupply ||
      relSummary.venousDrainage ||
      relSummary.lymphaticDrainage ||
      (relSummary.attachments && relSummary.attachments.length > 0),
  );

  return (
    <article className="a360-ref-card" aria-live="polite">
      <div className="a360-ref-head">
        <div>
          <p className="a360-kicker">
            {sys?.name.en ?? 'Anatomy'} · {record.category} · {record.conceptId} ·{' '}
            {getCoverageBadgeLabel(record.visualization.coverageTier)}
          </p>
          <h2>{record.canonicalName}</h2>
          <p className="a360-muted">
            {record.commonName !== record.canonicalName && <>Common: {record.commonName} · </>}
            {record.latinName && <>Latin: <em>{record.latinName}</em> · </>}
            Region: {record.location.region}
            {record.location.subdivision ? ` (${record.location.subdivision})` : ''}
          </p>
        </div>

        <div className="a360-ref-actions">
          <button
            type="button"
            className={`a360-btn-secondary ${saved ? 'is-saved' : ''}`}
            aria-pressed={saved}
            onClick={() =>
              toggleBookmark({
                kind: 'structure',
                targetId: record.conceptId,
                title: record.canonicalName,
                subtitle: sys?.name.en,
                canonicalSystem: record.canonicalSystem,
              })
            }
          >
            <Bookmark size={15} />
            {saved ? 'Saved' : 'Save'}
          </button>

          {record.visualization.inModel && (
            <button
              type="button"
              className="a360-btn-primary"
              onClick={() => onInspectConcept(record.conceptId)}
            >
              Inspect in 3D <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>

      {record.synonyms.length > 0 && (
        <p className="a360-ref-synonyms">
          <strong>Synonyms:</strong> {record.synonyms.join(', ')}
        </p>
      )}

      <div className="a360-level-bar" role="tablist" aria-label="Explanation depth">
        {(
          [
            ['beginner', 'Foundational'],
            ['intermediate', 'Intermediate'],
            ['advanced', 'Advanced / Clinical'],
          ] as [LevelTab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={level === id}
            className={`a360-filter-btn ${level === id ? 'active' : ''}`}
            onClick={() => setLevel(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="a360-ref-level-body">
        <p>{record.education[level]}</p>
      </div>

      <div className="a360-ref-grid">
        <div className="a360-ref-block">
          <h3>Anatomical Position & Boundaries</h3>
          <p>{record.location.position}</p>
          {record.location.orientation && (
            <p className="a360-muted">Orientation: {record.location.orientation}</p>
          )}
          {record.location.boundaries && (
            <p className="a360-muted">Boundaries: {record.location.boundaries}</p>
          )}
          {record.location.nearbyStructures.length > 0 && (
            <p className="a360-muted">
              Nearby structures: {record.location.nearbyStructures.join(', ')}
            </p>
          )}
        </div>

        <div className="a360-ref-block">
          <h3>Physiological Role & Functions</h3>
          <p>{record.function.primary}</p>
          {record.function.secondary.length > 0 && (
            <ul className="a360-fact-list">
              {record.function.secondary.map((fn) => (
                <li key={fn}>{fn}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {hasStructuralFields && (
        <div className="a360-ref-block">
          <h3>Verified Structural Attachments, Supply & Innervation</h3>
          <dl className="a360-dl-grid">
            {relSummary.origin && (
              <>
                <dt>Origin</dt>
                <dd>{relSummary.origin}</dd>
              </>
            )}
            {relSummary.insertion && (
              <>
                <dt>Insertion</dt>
                <dd>{relSummary.insertion}</dd>
              </>
            )}
            {relSummary.articulations && (
              <>
                <dt>Articulations</dt>
                <dd>{relSummary.articulations}</dd>
              </>
            )}
            {relSummary.attachments && relSummary.attachments.length > 0 && (
              <>
                <dt>Key Attachments</dt>
                <dd>{relSummary.attachments.join(' · ')}</dd>
              </>
            )}
            {relSummary.innervation && (
              <>
                <dt>Innervation</dt>
                <dd>{relSummary.innervation}</dd>
              </>
            )}
            {relSummary.arterialSupply && (
              <>
                <dt>Arterial Supply</dt>
                <dd>{relSummary.arterialSupply}</dd>
              </>
            )}
            {relSummary.venousDrainage && (
              <>
                <dt>Venous Drainage</dt>
                <dd>{relSummary.venousDrainage}</dd>
              </>
            )}
            {relSummary.lymphaticDrainage && (
              <>
                <dt>Lymphatic Drainage</dt>
                <dd>{relSummary.lymphaticDrainage}</dd>
              </>
            )}
          </dl>
        </div>
      )}

      {(rels.outgoing.length > 0 || rels.incoming.length > 0 || rels.fallbackRelated.length > 0) && (
        <div className="a360-ref-block">
          <div className="a360-list-header">
            <h3>Connected Anatomical Structures</h3>
            <button
              type="button"
              className="a360-text-link"
              onClick={() => onOpenRelationships(record.conceptId)}
            >
              <GitBranch size={14} /> Open Relationship Explorer
            </button>
          </div>
          <div className="a360-rel-chips">
            {rels.outgoing.map((r) => (
              <button
                key={r.id}
                type="button"
                className="a360-structure-btn"
                onClick={() => onOpenRelationships(r.targetConceptId ?? record.conceptId)}
              >
                <span>{r.targetLabel}</span>
                <span className="a360-tabular-count">{r.directionLabel}</span>
              </button>
            ))}
            {rels.incoming.map((r) => (
              <button
                key={r.id}
                type="button"
                className="a360-structure-btn"
                onClick={() => onOpenRelationships(r.sourceConceptId)}
              >
                <span>{r.sourceConceptId}</span>
                <span className="a360-tabular-count">Incoming · {r.directionLabel}</span>
              </button>
            ))}
            {rels.fallbackRelated.map((fb) => (
              <button
                key={fb.conceptId}
                type="button"
                className="a360-structure-btn"
                onClick={() => onOpenRelationships(fb.conceptId)}
              >
                <span>{fb.name}</span>
                <span className="a360-tabular-count">Related</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {record.education.importantFacts.length > 0 && (
        <div className="a360-ref-block">
          <h3>Key Characteristics & Exam Notes</h3>
          <ul className="a360-fact-list">
            {record.education.importantFacts.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {record.education.terminology.length > 0 && (
        <div className="a360-ref-block">
          <h3>Key Terminology</h3>
          <ul className="a360-fact-list">
            {record.education.terminology.map((t) => (
              <li key={t.term}>
                <strong>{t.term}:</strong> {t.meaning}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="a360-ref-footer-links">
        <button
          type="button"
          className="a360-btn-secondary"
          onClick={() => onOpenLearnSystem(record.canonicalSystem, record.education.associatedTopicIds[0])}
        >
          <BookOpen size={14} /> Open System Lesson
        </button>
        <button
          type="button"
          className="a360-btn-secondary"
          onClick={() => onOpenRelationships(record.conceptId)}
        >
          <GitBranch size={14} /> Relationship Explorer
        </button>
        <button
          type="button"
          className="a360-btn-secondary"
          onClick={() => onOpenFlashcards(record.canonicalSystem)}
        >
          <Layers3 size={14} /> Practice Flashcards
        </button>
        <button type="button" className="a360-btn-secondary" onClick={onOpenPracticalLab}>
          <Stethoscope size={14} /> Practical Spotter
        </button>
      </div>

      <StudyResourceList
        conceptId={record.conceptId}
        canonicalSystem={record.canonicalSystem}
        module="learn"
        limit={3}
        compact
      />

      <p className="a360-provenance-line">
        Provenance: {record.provenance.sourceReference} · Status:{' '}
        {getReviewStatusLabel(record.provenance.verificationStatus)} · License:{' '}
        {record.provenance.license} · Updated {record.provenance.lastUpdated}
      </p>
    </article>
  );
}
