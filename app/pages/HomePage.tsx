import {
  Activity,
  ArrowRight,
  BookOpen,
  Compass,
  GitBranch,
  HelpCircle,
  Layers3,
  Microscope,
  Search,
  Stethoscope,
  X,
} from 'lucide-react';
import type { Atlas } from '../anatomy';
import { CANONICAL_SYSTEMS, type CanonicalSystemId } from '../anatomy-systems';
import type { AppRoute } from '../components/SiteHeader';
import { useStudy } from '../components/StudyContext';

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
  const { state, dismissOnboarding, revisionQueue } = useStudy();

  const partCountsByMesh = new Map<string, number>();
  if (atlas) {
    for (const p of atlas.parts) {
      partCountsByMesh.set(p.system, (partCountsByMesh.get(p.system) ?? 0) + 1);
    }
  }

  return (
    <div className="a360-page">
      {!state.onboardingDismissed && (
        <section className="a360-onboarding-banner" aria-label="Student quick-start onboarding">
          <div>
            <p className="a360-kicker">
              Welcome to Anatomy 360 · Study Track: {state.profile.track}
            </p>
            <h2>Connected 3D Exploration, Curriculum, Practical Spotter & Revision</h2>
            <p className="a360-muted">
              Inspect 3D anatomy directly without creating an account. Progress is saved locally
              and includes spaced-repetition flashcards, physiological models, and JSON backup.
            </p>
            <div className="a360-card-actions" style={{ marginTop: '10px' }}>
              <button
                type="button"
                className="a360-card-btn"
                onClick={() => onNavigate('dashboard')}
              >
                Open Study Dashboard & Profile
              </button>
              <button
                type="button"
                className="a360-card-link"
                onClick={() => onNavigate('relationships')}
              >
                Explore Structure Relationships
              </button>
            </div>
          </div>
          <button
            type="button"
            className="a360-btn-secondary"
            aria-label="Dismiss quick-start banner"
            onClick={() => dismissOnboarding(true)}
          >
            <X size={15} /> Dismiss
          </button>
        </section>
      )}

      <section className="a360-hero">
        <div className="a360-hero-copy">
          <p className="a360-kicker">Interactive 3D Human Anatomy Learning Platform</p>
          <h1>Study real 3D human anatomy with precision and clarity.</h1>
          <p className="a360-lead">
            Built for MBBS, FSc pre-medical, MDCAT, nursing, and biology students. Rotate, zoom,
            dissect, and inspect 2,234 individually selectable anatomical meshes across 12 human
            body systems — paired with structured anatomical notes, relationship graphs, flashcards, and practical spotter exercises.
          </p>
          <div className="a360-hero-actions">
            <button type="button" className="a360-btn-primary" onClick={onExplore}>
              Launch 3D Explorer
              <ArrowRight size={17} />
            </button>
            <button
              type="button"
              className="a360-btn-secondary"
              onClick={() => onNavigate('practical-lab')}
            >
              Practical Lab (3D Spotter)
            </button>
            <button
              type="button"
              className="a360-btn-secondary"
              onClick={() => onNavigate('dashboard')}
            >
              Study Dashboard ({revisionQueue.length} due)
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
              Explore every major system in 3D or inspect hierarchical structure reference pages.
              Coverage labels clearly mark complete, partial, male-only, or planned geometry.
            </p>
          </div>
          <button type="button" className="a360-text-link" onClick={() => onNavigate('systems')}>
            Open Reference Library <ArrowRight size={15} />
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
                    Reference library
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
            <h2>Connected Study, Revision & Medical Science Labs</h2>
            <p>
              Every anatomy concept flows smoothly across structured lessons, relationship diagrams,
              flashcards, physiological mechanics, histology, and practical spotter exams.
            </p>
          </div>
        </div>

        <div className="a360-features-grid">
          <button type="button" className="a360-feature-card" onClick={() => onNavigate('learn')}>
            <BookOpen size={20} />
            <h3>12-System Lessons & Tours</h3>
            <p>
              Synchronized curriculum with guided 3D pathways, terminology, and direct mesh highlighting.
            </p>
            <span className="a360-feature-cta">Open lessons <ArrowRight size={14} /></span>
          </button>

          <button type="button" className="a360-feature-card" onClick={() => onNavigate('relationships')}>
            <GitBranch size={20} />
            <h3>Relationship Explorer</h3>
            <p>
              Trace verified muscle attachments, joint articulations, arterial supply, and innervation networks.
            </p>
            <span className="a360-feature-cta">Explore connections <ArrowRight size={14} /></span>
          </button>

          <button type="button" className="a360-feature-card" onClick={() => onNavigate('revision')}>
            <Layers3 size={20} />
            <h3>Flashcards & Spaced Repetition</h3>
            <p>
              Active recall deck with 3D previews, SM-2 intervals, bookmarks, and weak-area revision queue.
            </p>
            <span className="a360-feature-cta">Open flashcards <ArrowRight size={14} /></span>
          </button>

          <button type="button" className="a360-feature-card" onClick={() => onNavigate('physiology')}>
            <Activity size={20} />
            <h3>Physiology Simulations</h3>
            <p>
              Interactive cardiac output, diaphragm ventilation, nephron filtration, and elbow lever mechanics.
            </p>
            <span className="a360-feature-cta">Launch simulations <ArrowRight size={14} /></span>
          </button>

          <button type="button" className="a360-feature-card" onClick={() => onNavigate('histology')}>
            <Microscope size={20} />
            <h3>Histology & Microanatomy</h3>
            <p>
              Epithelial, connective, muscle, and nervous tissue architecture linked to gross organs.
            </p>
            <span className="a360-feature-cta">Browse microanatomy <ArrowRight size={14} /></span>
          </button>

          <button type="button" className="a360-feature-card" onClick={() => onNavigate('clinical')}>
            <Stethoscope size={20} />
            <h3>Clinical Correlations</h3>
            <p>
              Applied regional anatomy scenarios with learning objectives, 3D inspection, and self-checks.
            </p>
            <span className="a360-feature-cta">Study correlations <ArrowRight size={14} /></span>
          </button>

          <button type="button" className="a360-feature-card" onClick={() => onNavigate('quiz')}>
            <HelpCircle size={20} />
            <h3>Verified Quizzes</h3>
            <p>
              Multiple-choice self-assessment linked to 3D organs with explanations and progress tracking.
            </p>
            <span className="a360-feature-cta">Practice quizzes <ArrowRight size={14} /></span>
          </button>

          <button type="button" className="a360-feature-card" onClick={() => onNavigate('atlases')}>
            <Compass size={20} />
            <h3>Multi-Atlas & Content Packs</h3>
            <p>
              Registry specifications for future female/pediatric atlases and JSON manifest validation tools.
            </p>
            <span className="a360-feature-cta">Open atlas manager <ArrowRight size={14} /></span>
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
          <button type="button" onClick={() => onNavigate('atlases')}>Atlas & Packs</button>
          <button type="button" onClick={() => onNavigate('dashboard')}>Dashboard</button>
          <button type="button" onClick={onExplore}>3D Explorer</button>
        </div>
      </footer>
    </div>
  );
}
