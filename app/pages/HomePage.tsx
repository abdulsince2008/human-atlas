import { useMemo, useState, type FormEvent } from 'react';
import {
  Activity,
  ArrowRight,
  BookOpen,
  Compass,
  FileText,
  GitBranch,
  Globe2,
  GraduationCap,
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
import { CURRICULUM_FRAMEWORKS, EDUCATION_TRACKS } from '../education/education-curricula';
import type { CurriculumAuthorityId, EducationDomainId } from '../education/education-types';
import { computeRegistryMetrics, REGISTRY_SUBJECTS } from '../registry/knowledge-registry';
import type { RegistrySubjectNode } from '../registry/registry-types';

interface Props {
  atlas: Atlas | null;
  onExplore: () => void;
  onNavigate: (route: AppRoute) => void;
  onInspectConcept: (conceptId: string) => void;
  onExploreSystem: (systemId: CanonicalSystemId) => void;
  onOpenSearchWithQuery?: (query: string) => void;
  onOpenDomain?: (domainId: EducationDomainId) => void;
  onOpenSyllabusFramework?: (frameworkId: CurriculumAuthorityId) => void;
  onOpenEducatorDomain?: (domainId: EducationDomainId) => void;
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

type DomainGroupFilter = 'all' | RegistrySubjectNode['group'];

const DOMAIN_GROUPS: { id: DomainGroupFilter; label: string }[] = [
  { id: 'all', label: 'All 16 Subjects' },
  { id: 'foundational_biosciences', label: 'Foundational Biosciences' },
  { id: 'organ_systems_and_function', label: 'Organ Systems & Function' },
  { id: 'disease_and_therapeutics', label: 'Disease & Therapeutics' },
  { id: 'clinical_and_practice', label: 'Clinical & Practice' },
];

const TRACK_SHORT_MAP = new Map(EDUCATION_TRACKS.map((t) => [t.id, t.shortLabel]));

export default function HomePage({
  atlas,
  onExplore,
  onNavigate,
  onInspectConcept,
  onExploreSystem,
  onOpenSearchWithQuery,
  onOpenDomain,
  onOpenSyllabusFramework,
  onOpenEducatorDomain,
}: Props) {
  const { state, dismissOnboarding, revisionQueue } = useStudy();
  const [heroSearch, setHeroSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<DomainGroupFilter>('all');

  const metrics = useMemo(() => computeRegistryMetrics(atlas), [atlas]);

  const partCountsByMesh = useMemo(() => {
    const map = new Map<string, number>();
    if (atlas) {
      for (const p of atlas.parts) {
        map.set(p.system, (map.get(p.system) ?? 0) + 1);
      }
    }
    return map;
  }, [atlas]);

  const visibleSubjects = useMemo(
    () =>
      groupFilter === 'all'
        ? REGISTRY_SUBJECTS
        : REGISTRY_SUBJECTS.filter((s) => s.group === groupFilter),
    [groupFilter],
  );

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (onOpenSearchWithQuery) {
      onOpenSearchWithQuery(heroSearch.trim());
    } else {
      onNavigate('search');
    }
  };

  return (
    <div className="a360-page">
      {!state.onboardingDismissed && (
        <section className="a360-onboarding-banner" aria-label="Student quick-start onboarding">
          <div>
            <p className="a360-kicker">
              Welcome to Anatomy 360 · Study Track: {state.profile.track}
            </p>
            <h2>Syllabus-Aware Human Sciences, 3D Exploration &amp; Educator Planning</h2>
            <p className="a360-muted">
              Study without creating an account. Progress, flashcards, and custom university or
              school syllabi are saved locally in your browser with JSON backup.
            </p>
            <div className="a360-card-actions flex-wrap" style={{ marginTop: '10px' }}>
              <button
                type="button"
                className="a360-card-btn"
                onClick={() => onNavigate('syllabus')}
              >
                Find or Match Your Syllabus
              </button>
              <button
                type="button"
                className="a360-card-link whitespace-nowrap"
                onClick={() => onNavigate('dashboard')}
              >
                Study Dashboard ({revisionQueue.length} due)
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

      {/* Hero Gateway */}
      <section className="a360-hero">
        <div className="a360-hero-copy">
          <p className="a360-kicker">
            Interactive 3D Human Anatomy &amp; Connected Biomedical Knowledge Platform
          </p>
          <h1>One connected platform for your syllabus, subjects, and 3D anatomy.</h1>
          <p className="a360-lead">
            Built for Grades 9–12, FSc/MDCAT, CBSE, A-Level, MBBS/MD, allied health, and graduate
            educators. Search across {metrics.subjectsCount} biomedical domains,{' '}
            {metrics.topicsCount} registry topics, {metrics.curriculumFrameworksCount} worldwide
            curricula, and {metrics.atlasMeshesCount.toLocaleString()} base 3D meshes (2,301 Male / 2,328 Female default across 2,401 bundled assets).
          </p>

          {/* Global Hero Search */}
          <form onSubmit={handleSearchSubmit} className="mt-5 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex flex-1 items-center">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Search topics, 3D organs, pharmacology, or syllabi…"
                aria-label="Search any human science topic, anatomical structure or subject"
                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-800 focus:outline-none"
              />
            </div>
            <button type="submit" className="a360-btn-primary shrink-0">
              Search Catalog
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>Try:</span>
            {['Pharmacology', 'Heart', 'Pathology', 'Acid-Base', 'Renal filtration'].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() =>
                  onOpenSearchWithQuery ? onOpenSearchWithQuery(q) : onNavigate('search')
                }
                className="font-medium text-teal-800 hover:underline"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="a360-hero-actions">
            <button
              type="button"
              className="a360-btn-primary"
              onClick={() => onNavigate('syllabus')}
            >
              <Globe2 size={16} />
              Find My Syllabus
            </button>
            <button type="button" className="a360-btn-secondary" onClick={onExplore}>
              Launch 3D Explorer
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="a360-btn-secondary"
              onClick={() => onNavigate('educator')}
            >
              <GraduationCap size={16} />
              Educator Workspace
            </button>
          </div>
        </div>

        <div className="a360-hero-panel">
          <div className="a360-panel-head">
            <h2>Quick-Inspect 3D Structures</h2>
            <span>Tap any organ or bone to open directly in the 3D viewport</span>
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

      {/* Live Registry Metrics Strip */}
      <section className="a360-metrics-strip" aria-label="Verified dataset metrics">
        <div className="a360-metric">
          <strong>{metrics.atlasMeshesCount.toLocaleString()}</strong>
          <span>Selectable 3D Meshes</span>
        </div>
        <div className="a360-metric">
          <strong>{metrics.atlasConceptsCount.toLocaleString()}</strong>
          <span>Named FMA Concepts</span>
        </div>
        <div className="a360-metric">
          <strong>
            {metrics.subjectsCount} · {metrics.topicsCount}
          </strong>
          <span>Human Science Subjects &amp; Topics</span>
        </div>
        <div className="a360-metric">
          <strong>
            {metrics.curriculumFrameworksCount} · {metrics.totalAssessmentQuestionsCount}
          </strong>
          <span>Worldwide Syllabi &amp; Assessments</span>
        </div>
      </section>

      {/* SECTION A — Find My Syllabus */}
      <section className="a360-section" aria-labelledby="section-find-syllabus">
        <div className="a360-section-head">
          <div>
            <p className="a360-kicker">Section A · Worldwide Curriculum Mapping</p>
            <h2 id="section-find-syllabus">Find or Match Your Syllabus</h2>
            <p>
              Browse {metrics.curriculumFrameworksCount} national and university curriculum
              references with transparent provenance — or paste any syllabus from your school or
              university to check exact coverage locally.
            </p>
          </div>
          <button type="button" className="a360-text-link" onClick={() => onNavigate('syllabus')}>
            Open Worldwide Syllabus Navigator <ArrowRight size={15} />
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                My Syllabus Is Not Listed? Match Any Course Outline Locally
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Paste syllabus lines, upload a <code>.txt</code>/<code>.md</code>/<code>.csv</code>{' '}
                file, or add topics manually. Anatomy 360 scores every topic against the Universal
                Knowledge Registry, asks you to confirm uncertain suggestions, and reports honestly
                which topics are available, partially covered, or not yet available.
              </p>
              <p className="mt-3 font-mono text-xs tabular-nums text-slate-500">
                {state.customSyllabi.length} custom{' '}
                {state.customSyllabi.length === 1 ? 'syllabus' : 'syllabi'} saved locally in your
                browser
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 border-t border-slate-100 pt-4">
              <button
                type="button"
                className="a360-btn-primary"
                onClick={() => onNavigate('syllabus')}
              >
                <Compass size={15} />
                Open Syllabus Navigator
              </button>
              <button
                type="button"
                className="a360-btn-secondary"
                onClick={() => onNavigate('educator')}
              >
                <FileText size={15} />
                Export Syllabus Outline
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
            {CURRICULUM_FRAMEWORKS.slice(0, 6).map((fw) => (
              <div
                key={fw.id}
                className="flex flex-col justify-between gap-2 rounded-xl border border-slate-200 bg-white p-4"
              >
                <div>
                  <p className="font-mono text-xs text-slate-500">
                    {fw.country} · {fw.applicableGradesOrYears}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-slate-900">{fw.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{fw.supports}</p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                  <span className="text-slate-500">{fw.authority}</span>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenSyllabusFramework
                        ? onOpenSyllabusFramework(fw.id)
                        : onNavigate('syllabus')
                    }
                    className="inline-flex items-center gap-1 font-semibold text-teal-800 hover:underline"
                  >
                    Inspect <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION B — Browse All 16 Human Science Subjects */}
      <section className="a360-section" aria-labelledby="section-browse-subjects">
        <div className="a360-section-head">
          <div>
            <p className="a360-kicker">Section B · Universal Biomedical &amp; Clinical Directory</p>
            <h2 id="section-browse-subjects">Browse All {metrics.subjectsCount} Subjects</h2>
            <p>
              Every subject links chapters, learning outcomes, 3D models, simulations, self-checks,
              and honest coverage/asset disclosures.
            </p>
          </div>
          <button
            type="button"
            className="a360-text-link"
            onClick={() => onOpenDomain?.('cell_biology') ?? onNavigate('learn')}
          >
            Open Curriculum Hub <ArrowRight size={15} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter subjects by group">
          {DOMAIN_GROUPS.map((g) => {
            const active = groupFilter === g.id;
            return (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setGroupFilter(g.id)}
                className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? 'border-teal-800 bg-teal-800 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {g.label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleSubjects.map((subj) => {
            const trackSummary = subj.targetTracks
              .map((t) => TRACK_SHORT_MAP.get(t) ?? t)
              .slice(0, 2)
              .join(' · ');

            return (
              <article
                key={subj.id}
                className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
              >
                <div>
                  <p className="font-mono text-xs tabular-nums text-slate-500">
                    {subj.code} · {subj.chapterIds.length} ch · {subj.topicCount} topics
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-slate-900">{subj.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{subj.overview}</p>
                </div>

                <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                  <p className="text-[11px] font-medium text-slate-500">
                    {subj.coverageLabel} · {trackSummary}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="a360-card-btn"
                      onClick={() =>
                        onOpenDomain ? onOpenDomain(subj.domainId) : onNavigate('learn')
                      }
                    >
                      Open Subject
                    </button>
                    <button
                      type="button"
                      className="a360-card-link"
                      onClick={() =>
                        onOpenEducatorDomain
                          ? onOpenEducatorDomain(subj.domainId)
                          : onNavigate('educator')
                      }
                    >
                      Educator Plan
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* SECTION C — Explore the Human Body (12 Canonical Systems) */}
      <section className="a360-section" aria-labelledby="section-human-body">
        <div className="a360-section-head">
          <div>
            <p className="a360-kicker">Section C · Core 3D Anatomical Atlas</p>
            <h2 id="section-human-body">Explore the Human Body (12 Canonical Systems)</h2>
            <p>
              Inspect verified BodyParts3D and Adult Female overlay geometry in 3D or open
              hierarchical reference profiles. Coverage labels state full, partial, or planned
              geometry transparently.
            </p>
          </div>
          <button type="button" className="a360-text-link" onClick={() => onNavigate('systems')}>
            Open Reference Library <ArrowRight size={15} />
          </button>
        </div>

        <div className="a360-systems-grid">
          {CANONICAL_SYSTEMS.map((sys) => {
            const count = sys.meshSystems.reduce(
              (acc, m) => acc + (partCountsByMesh.get(m) ?? 0),
              0,
            );
            return (
              <article key={sys.id} className="a360-system-card">
                <div className="a360-system-card-top">
                  <span
                    className="a360-swatch"
                    style={{ background: sys.color }}
                    aria-hidden="true"
                  />
                  <h3>{sys.name.en}</h3>
                </div>
                <p className="a360-system-meta">
                  {sys.coverageLabel} ·{' '}
                  {atlas === null
                    ? 'Loading 3D index…'
                    : count > 0
                      ? `${count.toLocaleString()} meshes`
                      : 'Planned'}
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

      {/* SECTION D — Teacher & Professor Workspace + Connected Labs */}
      <section className="a360-section a360-learning-band" aria-labelledby="section-educator-labs">
        <div className="a360-section-head">
          <div>
            <p className="a360-kicker">Section D · Teaching Tools &amp; Interactive Labs</p>
            <h2 id="section-educator-labs">Teacher &amp; Professor Workspace + Study Labs</h2>
            <p>
              Prepare lectures across all 16 domains or saved custom syllabi, sequence topics,
              export worksheets, and pair classes with interactive 3D, physiology, and lab tools.
            </p>
          </div>
          <button type="button" className="a360-text-link" onClick={() => onNavigate('educator')}>
            Open Educator Workspace <ArrowRight size={15} />
          </button>
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <p className="font-mono text-xs text-teal-800">
              Grades 9–12 · BS / MBBS · MPhil / PhD Research Tiers
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              Teacher &amp; Professor Planning Workspace
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Choose any domain, curriculum alignment reference, or saved custom syllabus. Inspect
              chapter outcomes, coverage gaps, reorder teaching steps, and export downloadable
              PowerPoint (.pptx), PDF, and Markdown lecture outlines or student worksheets.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              type="button"
              className="a360-btn-primary"
              onClick={() => onNavigate('educator')}
            >
              <GraduationCap size={16} />
              Launch Educator Workspace
            </button>
            <button
              type="button"
              className="a360-btn-secondary"
              onClick={() => onNavigate('practical-lab')}
            >
              Practical Spotter Lab
            </button>
          </div>
        </div>

        <div className="a360-features-grid">
          <button type="button" className="a360-feature-card" onClick={() => onNavigate('learn')}>
            <BookOpen size={20} />
            <h3>16-Domain Curriculum &amp; Lessons</h3>
            <p>
              Synchronized anatomy and biomedical modules with guided 3D pathways and terminology.
            </p>
            <span className="a360-feature-cta">
              Open lessons <ArrowRight size={14} />
            </span>
          </button>

          <button
            type="button"
            className="a360-feature-card"
            onClick={() => onNavigate('relationships')}
          >
            <GitBranch size={20} />
            <h3>Relationship Explorer</h3>
            <p>
              Trace verified muscle attachments, joint articulations, arterial supply, and
              innervation networks.
            </p>
            <span className="a360-feature-cta">
              Explore connections <ArrowRight size={14} />
            </span>
          </button>

          <button
            type="button"
            className="a360-feature-card"
            onClick={() => onNavigate('revision')}
          >
            <Layers3 size={20} />
            <h3>Flashcards &amp; Spaced Repetition</h3>
            <p>
              Active recall deck with 3D previews, SM-2 intervals, bookmarks, and weak-area queue.
            </p>
            <span className="a360-feature-cta">
              Open flashcards <ArrowRight size={14} />
            </span>
          </button>

          <button
            type="button"
            className="a360-feature-card"
            onClick={() => onNavigate('physiology')}
          >
            <Activity size={20} />
            <h3>Physiology Simulations</h3>
            <p>
              Interactive cardiac output, ventilation, nephron filtration, lever mechanics &amp;
              acid-base models.
            </p>
            <span className="a360-feature-cta">
              Launch simulations <ArrowRight size={14} />
            </span>
          </button>

          <button
            type="button"
            className="a360-feature-card"
            onClick={() => onNavigate('histology')}
          >
            <Microscope size={20} />
            <h3>Histology &amp; Microanatomy</h3>
            <p>
              Epithelial, connective, muscle, and nervous tissue study guides linked to gross
              organs.
            </p>
            <span className="a360-feature-cta">
              Browse microanatomy <ArrowRight size={14} />
            </span>
          </button>

          <button
            type="button"
            className="a360-feature-card"
            onClick={() => onNavigate('clinical')}
          >
            <Stethoscope size={20} />
            <h3>Clinical Correlations</h3>
            <p>
              Applied regional anatomy scenarios with learning objectives, 3D inspection, and
              self-checks.
            </p>
            <span className="a360-feature-cta">
              Study correlations <ArrowRight size={14} />
            </span>
          </button>

          <button type="button" className="a360-feature-card" onClick={() => onNavigate('quiz')}>
            <HelpCircle size={20} />
            <h3>Verified Quizzes</h3>
            <p>
              Multiple-choice self-assessment linked to 3D organs with explanations and progress
              tracking.
            </p>
            <span className="a360-feature-cta">
              Practice quizzes <ArrowRight size={14} />
            </span>
          </button>

          <button type="button" className="a360-feature-card" onClick={() => onNavigate('atlases')}>
            <Compass size={20} />
            <h3>Multi-Atlas &amp; Content Packs</h3>
            <p>
              Registry specifications for 2,301 Male / 2,328 Female default meshes (92-part Female Overlay v3.0 + HuBMAP Shared/Male &amp; Optional Pregnancy layers).
            </p>
            <span className="a360-feature-cta">
              Open atlas manager <ArrowRight size={14} />
            </span>
          </button>
        </div>
      </section>

      <footer className="a360-footer">
        <p>
          <strong>Anatomy 360</strong> · Universal Human Sciences &amp; 3D Anatomy Platform ·
          BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0
          International.
        </p>
        <div className="a360-footer-links">
          <button type="button" onClick={() => onNavigate('syllabus')}>
            Syllabus Navigator
          </button>
          <button type="button" onClick={() => onNavigate('educator')}>
            Educator Workspace
          </button>
          <button type="button" onClick={() => onNavigate('about')}>
            About &amp; Attribution
          </button>
          <button type="button" onClick={onExplore}>
            3D Explorer
          </button>
        </div>
      </footer>
    </div>
  );
}
