import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Compass, Layers, Type } from 'lucide-react';
import type { Atlas } from '../anatomy';
import { CURATED_KNOWLEDGE } from '../anatomy-knowledge';
import { CANONICAL_SYSTEMS, type CanonicalSystemId } from '../anatomy-systems';
import SystemLearnWorkspace from '../components/SystemLearnWorkspace';
import {
  GUIDED_PATHWAYS,
  LEARNING_CATEGORIES,
  TERMINOLOGY_ENTRIES,
  type LearningCategoryId,
} from '../learning-data';

interface Props {
  atlas: Atlas | null;
  atlasError?: string;
  initialSystemId?: CanonicalSystemId | null;
  initialTopicId?: string | null;
  onInspectConcept: (conceptId: string) => void;
}

export default function LearnPage({
  atlas,
  atlasError,
  initialSystemId,
  initialTopicId,
  onInspectConcept,
}: Props) {
  const [category, setCategory] = useState<LearningCategoryId>('by-system');
  useEffect(() => {
    if (initialSystemId || initialTopicId) setCategory('by-system');
  }, [initialSystemId, initialTopicId]);
  const [systemFilter, setSystemFilter] = useState<string>('all');
  const [termFilter, setTermFilter] = useState<string>('all');
  const [activePathwayId, setActivePathwayId] = useState<string>(GUIDED_PATHWAYS[0].id);
  const [pathwayStep, setPathwayStep] = useState<number>(0);

  const filteredStructures = useMemo(
    () =>
      systemFilter === 'all'
        ? CURATED_KNOWLEDGE
        : CURATED_KNOWLEDGE.filter((k) => k.canonicalSystem === systemFilter),
    [systemFilter],
  );

  const filteredTerms = useMemo(
    () =>
      termFilter === 'all'
        ? TERMINOLOGY_ENTRIES
        : TERMINOLOGY_ENTRIES.filter((t) => t.category === termFilter),
    [termFilter],
  );

  const activePathway = useMemo(
    () => GUIDED_PATHWAYS.find((p) => p.id === activePathwayId) ?? GUIDED_PATHWAYS[0],
    [activePathwayId],
  );

  const categoryIcon = (id: LearningCategoryId) => {
    if (id === 'by-system') return <Layers size={16} />;
    if (id === 'by-structure') return <BookOpen size={16} />;
    if (id === 'explore-body') return <Compass size={16} />;
    return <Type size={16} />;
  };

  return (
    <div className="a360-page a360-learn-page">
      <header className="a360-page-header">
        <p className="a360-kicker">Structured Curriculum</p>
        <h1>Learn Human Anatomy</h1>
        <p className="a360-lead">
          Study verified concepts organized for Foundational, FSc / MDCAT, and MBBS / Nursing
          courses—synchronized directly with real 3D structures in Anatomy 360.
        </p>
      </header>

      <div className="a360-category-tabs" role="tablist" aria-label="Learning categories">
        {LEARNING_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={category === cat.id}
            className={`a360-category-tab ${category === cat.id ? 'active' : ''}`}
            onClick={() => setCategory(cat.id)}
          >
            {categoryIcon(cat.id)}
            <span>{cat.title}</span>
          </button>
        ))}
      </div>

      {category === 'by-system' && (
        <SystemLearnWorkspace
          atlas={atlas}
          atlasError={atlasError}
          initialSystemId={initialSystemId}
          initialTopicId={initialTopicId}
          onInspectConcept={onInspectConcept}
        />
      )}

      {category === 'by-structure' && (
        <div className="a360-filter-row" aria-label="Filter by system">
          <button
            type="button"
            className={`a360-filter-btn ${systemFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSystemFilter('all')}
          >
            All Systems
          </button>
          {CANONICAL_SYSTEMS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`a360-filter-btn ${systemFilter === s.id ? 'active' : ''}`}
              onClick={() => setSystemFilter(s.id)}
            >
              {s.name.en.replace(' System', '')}
            </button>
          ))}
        </div>
      )}

      {category === 'by-structure' && (
        <div className="a360-knowledge-grid">
          {filteredStructures.map((item) => {
            const sys = CANONICAL_SYSTEMS.find((s) => s.id === item.canonicalSystem);
            return (
              <article key={item.conceptId} className="a360-knowledge-card">
                <p className="a360-kicker">
                  {sys?.name.en} · {item.inModel ? 'Available in 3D' : 'Planned (Not in 3D Model)'}
                </p>
                <h3>{item.anatomicalName}</h3>
                {item.commonName !== item.anatomicalName && (
                  <p className="a360-muted">Common name: {item.commonName}</p>
                )}
                <p className="a360-card-detail">
                  <strong>Location:</strong> {item.location.en}
                </p>
                <p className="a360-card-detail">
                  <strong>Function:</strong> {item.mainFunction.en}
                </p>
                {item.examRelevance && (
                  <p className="a360-exam-note">{item.examRelevance}</p>
                )}
                <div className="a360-card-footer">
                  {item.inModel ? (
                    <button
                      type="button"
                      className="a360-card-btn"
                      onClick={() => onInspectConcept(item.conceptId)}
                    >
                      Inspect in 3D <ArrowRight size={14} />
                    </button>
                  ) : (
                    <span className="a360-muted">3D mesh planned for future release</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {category === 'explore-body' && (
        <div className="a360-pathway-layout">
          <div className="a360-pathway-list">
            {GUIDED_PATHWAYS.map((pw) => (
              <button
                key={pw.id}
                type="button"
                className={`a360-pathway-tab ${activePathway.id === pw.id ? 'active' : ''}`}
                onClick={() => {
                  setActivePathwayId(pw.id);
                  setPathwayStep(0);
                }}
              >
                <strong>{pw.title}</strong>
                <span>{pw.steps.length} guided 3D steps</span>
              </button>
            ))}
          </div>

          <div className="a360-pathway-stage">
            <p className="a360-kicker">Guided 3D Tour</p>
            <h2>{activePathway.title}</h2>
            <p className="a360-muted">{activePathway.summary}</p>

            <ol className="a360-steps-list">
              {activePathway.steps.map((st, idx) => (
                <li
                  key={st.conceptId}
                  className={`a360-step-item ${pathwayStep === idx ? 'current' : ''}`}
                >
                  <div className="a360-step-num">{st.stepNumber}</div>
                  <div className="a360-step-body">
                    <h4>{st.title}</h4>
                    <p>{st.note}</p>
                  </div>
                  <button
                    type="button"
                    className="a360-inspect-link"
                    onClick={() => {
                      setPathwayStep(idx);
                      onInspectConcept(st.conceptId);
                    }}
                  >
                    Open in 3D <ArrowRight size={14} />
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {category === 'terminology' && (
        <div className="a360-terms-section">
          <div className="a360-filter-row">
            {['all', 'Plane', 'Directional', 'Root'].map((cat) => (
              <button
                key={cat}
                type="button"
                className={`a360-filter-btn ${termFilter === cat ? 'active' : ''}`}
                onClick={() => setTermFilter(cat)}
              >
                {cat === 'all' ? 'All Terms' : `${cat} Terms`}
              </button>
            ))}
          </div>

          <div className="a360-terms-grid">
            {filteredTerms.map((entry) => (
              <article key={entry.term} className="a360-term-card">
                <p className="a360-kicker">{entry.category}</p>
                <h3>{entry.term}</h3>
                <p>{entry.definition}</p>
                <p className="a360-term-example">
                  <strong>Example:</strong> {entry.example}
                </p>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
