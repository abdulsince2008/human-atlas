import { ArrowRight, BookOpen, Compass, HelpCircle, Layers3, Search } from 'lucide-react';
import type { Atlas } from '../anatomy';
import { CANONICAL_SYSTEMS, type CanonicalSystemId } from '../anatomy-systems';
import type { AppRoute } from '../components/SiteHeader';

interface Props {
  atlas: Atlas | null;
  onExplore: () => void;
  onNavigate: (route: AppRoute) => void;
  onInspectConcept: (conceptId: string) => void;
  onExploreSystem: (systemId: CanonicalSystemId) => void;
}

const FEATURED_STRUCTURES = [
  { conceptId: 'FMA7088', name: 'Heart', subtitle: 'Four-chambered muscular pump' },
  { conceptId: 'FMA50801', name: 'Brain', subtitle: 'Central nervous control center' },
  { conceptId: 'FMA7309', name: 'Right lung', subtitle: 'Three-lobed respiratory organ' },
  { conceptId: 'FMA7197', name: 'Liver', subtitle: 'Bile synthesis & metabolism' },
  { conceptId: 'FMA7148', name: 'Stomach', subtitle: 'Acidic enzymatic digestion' },
  { conceptId: 'FMA7203', name: 'Kidney', subtitle: 'Renal filtration & homeostasis' },
  { conceptId: 'FMA46565', name: 'Skull', subtitle: 'Cranial & facial skeleton' },
  { conceptId: 'FMA9611', name: 'Femur', subtitle: 'Longest weight-bearing bone' },
];

export default function HomePage({
  atlas,
  onExplore,
  onNavigate,
  onInspectConcept,
  onExploreSystem,
}: Props) {
  const partCountsByMesh = new Map<string, number>();
  if (atlas) {
    for (const p of atlas.parts) {
      partCountsByMesh.set(p.system, (partCountsByMesh.get(p.system) ?? 0) + 1);
    }
  }

  return (
    <div className="a360-page">
      <section className="a360-hero">
        <div className="a360-hero-copy">
          <p className="a360-kicker">Interactive 3D Human Anatomy Learning Platform</p>
          <h1>Study real 3D human anatomy with precision and clarity.</h1>
          <p className="a360-lead">
            Built for FSc pre-medical, MDCAT, MBBS, nursing, and biology students. Rotate, zoom,
            dissect, and inspect 2,234 individually selectable anatomical meshes across 12 human
            body systems — paired with verified explanations, guided pathways, and revision quizzes.
          </p>
          <div className="a360-hero-actions">
            <button type="button" className="a360-btn-primary" onClick={onExplore}>
              Launch 3D Explorer
              <ArrowRight size={17} />
            </button>
            <button type="button" className="a360-btn-secondary" onClick={() => onNavigate('systems')}>
              Browse 12 Systems
            </button>
            <button type="button" className="a360-btn-secondary" onClick={() => onNavigate('search')}>
              <Search size={15} />
              Search Catalog
            </button>
          </div>
        </div>

        <div className="a360-hero-panel">
          <div className="a360-panel-head">
            <h2>Quick-Inspect 3D Structures</h2>
            <span>Tap any structure to open directly in the 3D viewer</span>
          </div>
          <div className="a360-quick-grid">
            {FEATURED_STRUCTURES.map((item) => (
              <button
                key={item.conceptId}
                type="button"
                className="a360-quick-item"
                onClick={() => onInspectConcept(item.conceptId)}
              >
                <strong>{item.name}</strong>
                <span>{item.subtitle}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="a360-metrics-strip" aria-label="Verified dataset metrics">
        <div className="a360-metric">
          <strong>{atlas ? atlas.parts.length.toLocaleString() : '2,234'}</strong>
          <span>Selectable 3D Meshes</span>
        </div>
        <div className="a360-metric">
          <strong>{atlas ? atlas.concepts.length.toLocaleString() : '3,432'}</strong>
          <span>Named FMA Concepts</span>
        </div>
        <div className="a360-metric">
          <strong>12</strong>
          <span>Canonical Body Systems</span>
        </div>
        <div className="a360-metric">
          <strong>{atlas ? (atlas.triangles / 1_000_000).toFixed(2) + 'M' : '2.29M'}</strong>
          <span>Rendered Triangles</span>
        </div>
      </section>

      <section className="a360-section">
        <div className="a360-section-head">
          <div>
            <h2>Human Anatomical Systems</h2>
            <p>
              Explore every major system in 3D. Coverage labels honestly indicate where the
              BodyParts3D 4.0 male reference has complete, partial, or planned structures.
            </p>
          </div>
          <button type="button" className="a360-text-link" onClick={() => onNavigate('systems')}>
            View all systems <ArrowRight size={15} />
          </button>
        </div>

        <div className="a360-systems-grid">
          {CANONICAL_SYSTEMS.map((sys) => {
            const count = sys.meshSystems.reduce((acc, m) => acc + (partCountsByMesh.get(m) ?? 0), 0);
            return (
              <article key={sys.id} className="a360-system-card">
                <div className="a360-system-card-top">
                  <span className="a360-swatch" style={{ background: sys.color }} aria-hidden="true" />
                  <h3>{sys.name.en}</h3>
                </div>
                <p className="a360-system-meta">
                  {sys.coverageLabel} · {count > 0 ? `${count.toLocaleString()} meshes` : 'Planned'}
                </p>
                <p className="a360-system-summary">{sys.shortSummary.en}</p>
                <div className="a360-card-actions">
                  <button
                    type="button"
                    className="a360-card-btn"
                    onClick={() => onExploreSystem(sys.id)}
                  >
                    Explore in 3D
                  </button>
                  <button
                    type="button"
                    className="a360-card-link"
                    onClick={() => onNavigate('systems')}
                  >
                    Structure list
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="a360-section a360-learning-band">
        <div className="a360-section-head">
          <div>
            <h2>Structured Study & Exam Preparation</h2>
            <p>
              Connect spatial 3D exploration with concise explanations, guided anatomical pathways,
              terminology, and self-testing quizzes.
            </p>
          </div>
        </div>

        <div className="a360-features-grid">
          <button type="button" className="a360-feature-card" onClick={() => onNavigate('learn')}>
            <BookOpen size={20} />
            <h3>System & Structure Lessons</h3>
            <p>
              Read clear FSc, MDCAT, and MBBS-aligned explanations with key facts linked directly to
              3D organs, bones, and muscles.
            </p>
            <span className="a360-feature-cta">Open lessons <ArrowRight size={14} /></span>
          </button>

          <button type="button" className="a360-feature-card" onClick={() => onNavigate('learn')}>
            <Compass size={20} />
            <h3>Guided 3D Body Pathways</h3>
            <p>
              Step sequentially through blood circulation, airway ventilation, digestion, and the
              weight-bearing skeletal axis.
            </p>
            <span className="a360-feature-cta">Start a tour <ArrowRight size={14} /></span>
          </button>

          <button type="button" className="a360-feature-card" onClick={() => onNavigate('quiz')}>
            <HelpCircle size={20} />
            <h3>Verified Anatomy Quizzes</h3>
            <p>
              Test your recall with system and structure MCQs, instant rationales, and one-click
              3D inspection of every tested organ.
            </p>
            <span className="a360-feature-cta">Practice quizzes <ArrowRight size={14} /></span>
          </button>

          <button type="button" className="a360-feature-card" onClick={onExplore}>
            <Layers3 size={20} />
            <h3>Dissect, Ghost & Isolate</h3>
            <p>
              Separate overlapping systems using the 0–100% Explode inventory, make surrounding
              tissues transparent, or isolate any single piece.
            </p>
            <span className="a360-feature-cta">Open 3D studio <ArrowRight size={14} /></span>
          </button>
        </div>
      </section>

      <footer className="a360-footer">
        <p>
          <strong>Anatomy 360</strong> · Educational 3D Human Anatomy Platform · BodyParts3D, © The
          Database Center for Life Science licensed under CC Attribution 4.0 International.
        </p>
        <div className="a360-footer-links">
          <button type="button" onClick={() => onNavigate('about')}>About & Attribution</button>
          <button type="button" onClick={() => onNavigate('search')}>Search Catalog</button>
          <button type="button" onClick={onExplore}>3D Explorer</button>
        </div>
      </footer>
    </div>
  );
}
