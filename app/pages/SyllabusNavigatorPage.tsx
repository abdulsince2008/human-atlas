import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  ClipboardList,
  ExternalLink,
  FileText,
  Globe2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { useStudy } from '../components/StudyContext';
import PageOrientationBar from '../components/PageOrientationBar';
import type { AppRoute } from '../components/SiteHeader';
import {
  CURRICULUM_FRAMEWORKS,
  EDUCATION_TRACKS,
} from '../education/education-curricula';
import type {
  CurriculumAuthorityId,
  EducationDomainId,
  EducationTrackId,
} from '../education/education-types';
import {
  getRegistrySubjectByDomain,
  getRegistryTopicById,
  getRegistryTopicsForFramework,
  REGISTRY_COVERAGE_LABELS,
  REGISTRY_REVIEW_LABELS,
  REGISTRY_TOPICS,
} from '../registry/knowledge-registry';
import {
  computeSyllabusCoverageReport,
  matchDraftItemsToRegistry,
  tokenizeSyllabusText,
} from '../syllabus/syllabus-mapper';
import { parseSyllabusText } from '../syllabus/syllabus-parser';
import type {
  CustomSyllabusItem,
  CustomSyllabusMetadata,
  CustomSyllabusProfile,
  SyllabusCoverageCategory,
} from '../syllabus/syllabus-types';

interface Props {
  initialFrameworkId?: CurriculumAuthorityId | null;
  onNavigate: (route: AppRoute) => void;
  onOpenTopic: (params: {
    route: AppRoute;
    domainId?: EducationDomainId;
    topicId?: string;
    systemId?: string;
    conceptId?: string;
  }) => void;
  onOpenEducatorForFramework: (frameworkId: CurriculumAuthorityId) => void;
  onOpenEducatorForCustomSyllabus: (syllabusId: string) => void;
}

const SAMPLE_SYLLABUS_TEXT = `# Block 1: Cellular & Cardiac Foundations
1. Plasma membrane transport, cellular organelles & mitosis
2. Heart Chambers, Valves & Great Vessels
3. Coronary Arterial Supply & Myocardial Ischemia

# Block 2: Organ Pharmacology & Physiology
4. Pharmacokinetics (ADME) and receptor pharmacodynamics
5. Glomerular Filtration Rate (GFR) & Renal Acid-Base Balance
6. General & Systemic Pathology: Necrosis, Apoptosis & Inflammation
7. Quantitative Quantum Electrochemistry of Cryogenic Synapses`;

const EMPTY_METADATA: CustomSyllabusMetadata = {
  country: '',
  institution: '',
  programme: '',
  degree: '',
  yearOrSemester: '',
  courseName: '',
};

const CATEGORY_TEXT: Record<SyllabusCoverageCategory, { label: string; toneClass: string }> = {
  available: {
    label: 'Available (Substantial)',
    toneClass: 'text-emerald-800 border-emerald-200 bg-emerald-50/70',
  },
  partially_available: {
    label: 'Partially available',
    toneClass: 'text-amber-900 border-amber-200 bg-amber-50/70',
  },
  not_available_yet: {
    label: 'Not available yet',
    toneClass: 'text-slate-700 border-slate-200 bg-slate-50',
  },
};

export default function SyllabusNavigatorPage({
  initialFrameworkId,
  onNavigate,
  onOpenTopic,
  onOpenEducatorForFramework,
  onOpenEducatorForCustomSyllabus,
}: Props) {
  const { state, saveCustomSyllabus, deleteCustomSyllabus } = useStudy();

  const [mode, setMode] = useState<'official' | 'custom' | 'saved'>('official');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [trackFilter, setTrackFilter] = useState<EducationTrackId | 'all'>('all');
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<CurriculumAuthorityId>(
    initialFrameworkId ?? CURRICULUM_FRAMEWORKS[0].id,
  );

  // Custom syllabus builder state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<CustomSyllabusMetadata>(EMPTY_METADATA);
  const [rawPaste, setRawPaste] = useState<string>('');
  const [sourceFormat, setSourceFormat] = useState<'manual' | 'paste' | 'file'>('paste');
  const [items, setItems] = useState<CustomSyllabusItem[]>([]);
  const [manualTitle, setManualTitle] = useState('');
  const [manualUnit, setManualUnit] = useState('');
  const [formError, setFormError] = useState('');
  const [savedNotice, setSavedNotice] = useState('');

  useEffect(() => {
    if (initialFrameworkId) {
      setSelectedFrameworkId(initialFrameworkId);
      setMode('official');
    }
  }, [initialFrameworkId]);

  const countries = useMemo(
    () => Array.from(new Set(CURRICULUM_FRAMEWORKS.map((f) => f.country))).sort(),
    [],
  );

  const visibleFrameworks = useMemo(
    () =>
      CURRICULUM_FRAMEWORKS.filter((fw) => {
        if (countryFilter !== 'all' && fw.country !== countryFilter) return false;
        if (trackFilter !== 'all' && !fw.tracks.includes(trackFilter)) return false;
        return true;
      }),
    [countryFilter, trackFilter],
  );

  const selectedFramework = useMemo(
    () =>
      visibleFrameworks.find((f) => f.id === selectedFrameworkId) ??
      visibleFrameworks[0] ??
      CURRICULUM_FRAMEWORKS[0],
    [visibleFrameworks, selectedFrameworkId],
  );

  const frameworkMappedTopics = useMemo(
    () => getRegistryTopicsForFramework(selectedFramework.id),
    [selectedFramework],
  );

  const coverageReport = useMemo(
    () => computeSyllabusCoverageReport(items),
    [items],
  );

  const handleParseText = (textToParse: string, fileName?: string, fmt: 'paste' | 'file' = 'paste') => {
    setFormError('');
    setSavedNotice('');
    const drafts = parseSyllabusText(textToParse, fileName);
    if (drafts.length === 0) {
      setFormError('No topic lines were detected. Paste or enter one topic per line, or upload a .txt / .md / .csv outline.');
      return;
    }
    const matched = matchDraftItemsToRegistry(drafts);
    setSourceFormat(fmt);
    setItems(matched);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const content = await file.text();
      setRawPaste(content);
      handleParseText(content, file.name, 'file');
    } catch {
      setFormError('Could not read the selected file.');
    }
  };

  const handleLoadSample = () => {
    setMetadata({
      country: 'Pakistan',
      institution: 'Example Medical & Allied Sciences University',
      programme: 'MBBS / BS Human Sciences',
      degree: 'Undergraduate',
      yearOrSemester: 'Year 1 · Semester 1',
      courseName: 'Integrated Human Structure, Cell & Therapeutics',
    });
    setRawPaste(SAMPLE_SYLLABUS_TEXT);
    handleParseText(SAMPLE_SYLLABUS_TEXT, undefined, 'paste');
  };

  const handleAddManualItem = () => {
    const trimmed = manualTitle.trim();
    if (trimmed.length < 2) {
      setFormError('Enter a topic title (at least 2 characters) to add it manually.');
      return;
    }
    setFormError('');
    setSavedNotice('');
    const matched = matchDraftItemsToRegistry([
      {
        id: `manual-item-${Date.now()}`,
        rawLine: trimmed,
        title: trimmed,
        unit: manualUnit.trim() || undefined,
      },
    ])[0];
    setItems((prev) => [...prev, matched]);
    setManualTitle('');
    setManualUnit('');
  };

  const handleUpdateItemTitle = (itemId: string, nextTitle: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const rematch = matchDraftItemsToRegistry([
          { id: it.id, rawLine: it.rawLine, title: nextTitle, unit: it.unit },
        ])[0];
        return { ...it, title: nextTitle, keywords: tokenizeSyllabusText(nextTitle), mappings: rematch.mappings };
      }),
    );
  };

  const handleToggleIgnoreItem = (itemId: string) => {
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, ignored: !it.ignored } : it)));
  };

  const handleRemoveItem = (itemId: string) => {
    setItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  const handleConfirmMapping = (itemId: string, registryTopicId: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id !== itemId
          ? it
          : {
              ...it,
              mappings: it.mappings.map((m) =>
                m.registryTopicId === registryTopicId ? { ...m, confirmed: true } : m,
              ),
            },
      ),
    );
  };

  const handleAddOrRemapTopic = (itemId: string, registryTopicId: string) => {
    if (!registryTopicId) return;
    const topic = getRegistryTopicById(registryTopicId);
    if (!topic) return;
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        if (it.mappings.some((m) => m.registryTopicId === registryTopicId)) return it;
        return {
          ...it,
          mappings: [
            ...it.mappings,
            {
              registryTopicId: topic.id,
              domainId: topic.domainId,
              title: topic.title,
              confidence: 'manual',
              matchReason: 'Manually mapped by user',
              confirmed: true,
            },
          ],
        };
      }),
    );
  };

  const handleRemoveMapping = (itemId: string, registryTopicId: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id !== itemId
          ? it
          : {
              ...it,
              mappings: it.mappings.filter((m) => m.registryTopicId !== registryTopicId),
            },
      ),
    );
  };

  const handleSaveProfile = () => {
    setFormError('');
    if (!metadata.courseName.trim() || !metadata.institution.trim() || !metadata.country.trim()) {
      setFormError('Please provide at least Country, University / Institution, and Course / Subject Name.');
      return;
    }
    if (items.length === 0) {
      setFormError('Extract or add at least one syllabus topic before saving.');
      return;
    }
    const now = Date.now();
    const profile: CustomSyllabusProfile = {
      id: editingId ?? `custom-syl-${now}`,
      createdAt:
        state.customSyllabi.find((s) => s.id === editingId)?.createdAt ?? now,
      updatedAt: now,
      sourceFormat,
      metadata: {
        country: metadata.country.trim(),
        institution: metadata.institution.trim(),
        programme: metadata.programme.trim() || 'Human Sciences',
        degree: metadata.degree.trim() || 'Undergraduate / Medical',
        yearOrSemester: metadata.yearOrSemester.trim() || 'General',
        courseName: metadata.courseName.trim(),
      },
      items,
    };
    saveCustomSyllabus(profile);
    setEditingId(profile.id);
    setSavedNotice(`Saved "${profile.metadata.courseName}" locally to this browser.`);
  };

  const handleLoadSavedForEdit = (profile: CustomSyllabusProfile) => {
    setEditingId(profile.id);
    setMetadata(profile.metadata);
    setSourceFormat(profile.sourceFormat);
    setItems(profile.items);
    setSavedNotice('');
    setFormError('');
    setMode('custom');
  };

  return (
    <div className="a360-page">
      <header className="a360-page-header">
        <p className="a360-kicker">Worldwide Syllabus Navigator</p>
        <h1>Find Your Curriculum or Match a Custom Syllabus</h1>
        <p className="a360-lead">
          Browse {CURRICULUM_FRAMEWORKS.length} public national, regulatory, and university curriculum alignment references worldwide or paste/upload your own school, university, MBBS, nursing, or graduate syllabus to inspect real Anatomy 360 topic coverage locally.
        </p>
      </header>

      <PageOrientationBar
        whatThisIs="Find lessons that match your exact school, board, or university syllabus—or paste your own course list."
        primaryHint="Browse the 13 built-in curricula below, or switch to the Match Custom Syllabus tab to paste your own chapters."
        spokenSummary="Worldwide Syllabus Navigator. Pick a school or medical curriculum on the first tab, or switch to Custom Syllabus to paste your own course outline and see which Anatomy 360 lessons match."
        howToSteps={[
          'Use tab 1 to pick an existing school, national board, or university curriculum.',
          'Use tab 2 to paste your own syllabus lines or upload a .txt, .md, or .csv file.',
          'Click any matched topic to open its study workspace, or send the list straight to the Educator Workspace.',
        ]}
      />

      {/* Mode Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4" role="tablist" aria-label="Syllabus navigator modes">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'official'}
          onClick={() => setMode('official')}
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
            mode === 'official'
              ? 'border-teal-800 bg-teal-800 text-white'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Globe2 size={14} />
          <span>Curriculum Alignment References ({CURRICULUM_FRAMEWORKS.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={mode === 'custom'}
          onClick={() => setMode('custom')}
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
            mode === 'custom'
              ? 'border-teal-800 bg-teal-800 text-white'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Upload size={14} />
          <span>My Syllabus Is Not Listed (Custom Builder)</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={mode === 'saved'}
          onClick={() => setMode('saved')}
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
            mode === 'saved'
              ? 'border-teal-800 bg-teal-800 text-white'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FileText size={14} />
          <span className="tabular-nums">My Saved Syllabi ({state.customSyllabi.length})</span>
        </button>
      </div>

      {/* MODE A: 13 CURRICULUM ALIGNMENT REFERENCES */}
      {mode === 'official' && (
        <section className="space-y-6" aria-label="Curriculum alignment references">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <h2 className="text-lg font-bold text-slate-900">Alignment Mapping vs. Endorsement</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  These {CURRICULUM_FRAMEWORKS.length} alignment references document verified public syllabi and topic mappings created by Anatomy 360 to help learners locate aligned lessons. Listing a curriculum indicates topic mapping only and does not imply institutional accreditation, endorsement, or examination equivalence.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                  <span>Country / Jurisdiction</span>
                  <select
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800"
                  >
                    <option value="all">All Countries ({CURRICULUM_FRAMEWORKS.length})</option>
                    {countries.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                  <span>Learning Level</span>
                  <select
                    value={trackFilter}
                    onChange={(e) => setTrackFilter(e.target.value as EducationTrackId | 'all')}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800"
                  >
                    <option value="all">All Learning Levels</option>
                    {EDUCATION_TRACKS.map((tr) => (
                      <option key={tr.id} value={tr.id}>{tr.shortLabel}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Framework Directory List */}
            <div className="space-y-2.5 lg:col-span-5">
              {visibleFrameworks.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-600">
                  No curriculum references match both filters.
                  <button
                    type="button"
                    onClick={() => { setCountryFilter('all'); setTrackFilter('all'); }}
                    className="ml-2 font-semibold text-teal-800 underline"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                visibleFrameworks.map((fw) => {
                  const active = selectedFramework.id === fw.id;
                  const count = getRegistryTopicsForFramework(fw.id).length;
                  return (
                    <button
                      key={fw.id}
                      type="button"
                      onClick={() => setSelectedFrameworkId(fw.id)}
                      className={`block w-full rounded-xl border p-4 text-left transition-colors ${
                        active
                          ? 'border-teal-700 bg-teal-50/60'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <p className="text-xs font-medium text-slate-500">
                        {fw.country} · {fw.applicableGradesOrYears} · <span className="tabular-nums">{count} mapped topics</span>
                      </p>
                      <h3 className="mt-1 text-sm font-bold text-slate-900">{fw.title}</h3>
                      <p className="mt-1 text-xs text-slate-600">{fw.authority}</p>
                    </button>
                  );
                })
              )}
            </div>

            {/* Selected Framework Detail & Mapped Topics */}
            <article className="space-y-5 lg:col-span-7">
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <p className="text-xs font-medium text-slate-500">
                  {selectedFramework.country} · {selectedFramework.requirementType.replace(/_/g, ' ')} · Checked {selectedFramework.dateAccessed}
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">{selectedFramework.title}</h2>
                <p className="mt-2 text-xs text-slate-700">
                  <strong>Issuing Authority:</strong> {selectedFramework.authority} · <strong>Version:</strong> {selectedFramework.academicYearOrVersion}
                </p>
                <p className="mt-1.5 text-xs text-slate-700">
                  <strong>Geographic &amp; Institutional Scope:</strong> {selectedFramework.geographicScope}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{selectedFramework.supports}</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{selectedFramework.adoptionNote}</p>

                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                  <a
                    href={selectedFramework.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
                  >
                    <span>Official Source Document</span>
                    <ExternalLink size={13} />
                  </a>

                  <button
                    type="button"
                    onClick={() => onOpenEducatorForFramework(selectedFramework.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-teal-800 bg-teal-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-900 whitespace-nowrap"
                  >
                    <ClipboardList size={13} />
                    <span>Open in Educator Workspace</span>
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">
                    Mapped Registry Topics (<span className="tabular-nums">{frameworkMappedTopics.length}</span>)
                  </h3>
                  <span className="text-xs text-slate-500">All items unreviewed · Educational mapping only</span>
                </div>

                <div className="mt-3 divide-y divide-slate-100">
                  {frameworkMappedTopics.map((tp) => {
                    const subj = getRegistrySubjectByDomain(tp.domainId);
                    const mapping = tp.curriculumMappings.find((m) => m.frameworkId === selectedFramework.id);
                    return (
                      <div key={tp.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-500">
                            {subj?.shortTitle ?? tp.domainId} · {REGISTRY_COVERAGE_LABELS[tp.coverageStatus]} · {mapping?.gradeOrYear ?? tp.difficultyTiers[0]}
                          </p>
                          <p className="mt-0.5 text-sm font-semibold text-slate-900">{tp.title}</p>
                          {mapping && (
                            <p className="mt-0.5 text-xs text-slate-600">Aligned unit: {mapping.unitOrModule}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            onOpenTopic({
                              route: tp.navigationTarget.route,
                              domainId: tp.domainId,
                              topicId: tp.id,
                              systemId: tp.systemId,
                              conceptId: tp.relatedConceptIds[0],
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap shrink-0"
                        >
                          <BookOpen size={13} />
                          <span>Open Module</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>
          </div>
        </section>
      )}

      {/* MODE B: CUSTOM SYLLABUS BUILDER & HONEST COVERAGE MATCHER */}
      {mode === 'custom' && (
        <section className="space-y-6" aria-label="Custom syllabus builder">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId ? 'Edit Custom Syllabus' : 'Add Your Own Institution Syllabus'}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Stored privately in your browser (IndexedDB / localStorage) with zero server
                  uploads. Paste text, upload a <code>.txt</code> / <code>.md</code> /{' '}
                  <code>.csv</code> outline, or enter topics manually to inspect honest Anatomy 360
                  coverage.
                </p>
              </div>
              <button
                type="button"
                onClick={handleLoadSample}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
              >
                <Sparkles size={13} />
                <span>Load Sample Syllabus</span>
              </button>
            </div>

            {/* Metadata Form */}
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-700">
                <span>Country / Region *</span>
                <input
                  type="text"
                  value={metadata.country}
                  onChange={(e) => setMetadata((m) => ({ ...m, country: e.target.value }))}
                  placeholder="e.g. Pakistan, United Kingdom, Canada"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-700">
                <span>University / School / Board *</span>
                <input
                  type="text"
                  value={metadata.institution}
                  onChange={(e) => setMetadata((m) => ({ ...m, institution: e.target.value }))}
                  placeholder="e.g. Dow University, King’s College"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-700">
                <span>Programme</span>
                <input
                  type="text"
                  value={metadata.programme}
                  onChange={(e) => setMetadata((m) => ({ ...m, programme: e.target.value }))}
                  placeholder="e.g. MBBS, BS Nursing, FSc Pre-Med"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-700">
                <span>Degree / Track</span>
                <input
                  type="text"
                  value={metadata.degree}
                  onChange={(e) => setMetadata((m) => ({ ...m, degree: e.target.value }))}
                  placeholder="e.g. Grade 11, BS Hons, MD"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-700">
                <span>Year / Semester / Block</span>
                <input
                  type="text"
                  value={metadata.yearOrSemester}
                  onChange={(e) => setMetadata((m) => ({ ...m, yearOrSemester: e.target.value }))}
                  placeholder="e.g. Year 1 · Cardiopulmonary Block"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-700">
                <span>Course / Subject Name *</span>
                <input
                  type="text"
                  value={metadata.courseName}
                  onChange={(e) => setMetadata((m) => ({ ...m, courseName: e.target.value }))}
                  placeholder="e.g. Thorax Anatomy & General Pharmacology"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
                />
              </label>
            </div>

            {/* Paste or Upload Input */}
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
                  <span>Paste Syllabus Outline or Topic List</span>
                  <textarea
                    rows={6}
                    value={rawPaste}
                    onChange={(e) => setRawPaste(e.target.value)}
                    placeholder="Paste numbered units, bulleted lecture topics, or chapter headings (one per line)..."
                    className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm font-normal text-slate-900"
                  />
                </label>
                <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleParseText(rawPaste, undefined, 'paste')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-teal-800 bg-teal-800 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-900 whitespace-nowrap"
                  >
                    <span>Parse &amp; Match Syllabus Topics</span>
                  </button>

                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap">
                    <Upload size={13} />
                    <span>Upload .txt / .md / .csv</span>
                    <input
                      type="file"
                      accept=".txt,.md,.csv,text/plain,text/csv,text/markdown"
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 lg:col-span-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Add Single Topic Manually
                </h3>
                <div className="mt-2.5 space-y-2.5">
                  <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                    <span>Topic Title</span>
                    <input
                      type="text"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      placeholder="e.g. Cranial Nerves & Brainstem"
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                    <span>Unit / Week (optional)</span>
                    <input
                      type="text"
                      value={manualUnit}
                      onChange={(e) => setManualUnit(e.target.value)}
                      placeholder="e.g. Unit 3: Neuroanatomy"
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleAddManualItem}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap"
                  >
                    <Plus size={13} />
                    <span>Add &amp; Match Row</span>
                  </button>
                </div>
              </div>
            </div>

            {formError && (
              <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-900" role="alert">
                {formError}
              </p>
            )}
            {savedNotice && (
              <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900" role="status">
                {savedNotice}
              </p>
            )}
          </div>

          {/* Truthful Coverage Report & Interactive Mapping Editor */}
          {items.length > 0 && (
            <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Honest Coverage &amp; Mapping Report</h2>
                  <p className="mt-1 text-xs text-slate-600">{coverageReport.disclaimer}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-teal-800 bg-teal-800 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-900 whitespace-nowrap"
                  >
                    <Check size={14} />
                    <span>Save Syllabus Locally</span>
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => onOpenEducatorForCustomSyllabus(editingId)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
                    >
                      <ClipboardList size={14} />
                      <span>Open in Educator Workspace</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Tabular Metrics Breakdown */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Active Topics</p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{coverageReport.activeItems}</p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                  <p className="text-xs text-emerald-800">Available (Substantial)</p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-emerald-950">
                    {coverageReport.availableCount} <span className="text-xs font-normal">({coverageReport.availablePct}%)</span>
                  </p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                  <p className="text-xs text-amber-900">Partially Available</p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-amber-950">{coverageReport.partiallyAvailableCount}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-600">Not Available Yet</p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{coverageReport.notAvailableYetCount}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-600">Awaiting Confirmation</p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{coverageReport.unconfirmedCount}</p>
                </div>
              </div>

              {/* Per-Row Review & Multi-Mapping Editor */}
              <div className="divide-y divide-slate-200">
                {items.map((item, idx) => {
                  const row = coverageReport.rows.find((r) => r.itemId === item.id);
                  const statusMeta = row ? CATEGORY_TEXT[row.category] : CATEGORY_TEXT.not_available_yet;
                  return (
                    <div key={item.id} className={`py-4 ${item.ignored ? 'opacity-50' : ''}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="tabular-nums font-semibold">Item {idx + 1}</span>
                            {item.unit && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>{item.unit}</span>
                              </>
                            )}
                            {!item.ignored && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className={`rounded border px-2 py-0.5 font-semibold ${statusMeta.toneClass}`}>
                                  {statusMeta.label}
                                </span>
                              </>
                            )}
                          </div>

                          <input
                            type="text"
                            aria-label={`Syllabus item ${idx + 1} title`}
                            value={item.title}
                            onChange={(e) => handleUpdateItemTitle(item.id, e.target.value)}
                            className="w-full max-w-2xl rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900"
                          />

                          {row && !item.ignored && (
                            <p className="text-xs text-slate-600">{row.explanation}</p>
                          )}

                          {/* Matched Registry Modules */}
                          {!item.ignored && item.mappings.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              {item.mappings.map((m) => {
                                const regTopic = getRegistryTopicById(m.registryTopicId);
                                const subj = getRegistrySubjectByDomain(m.domainId);
                                return (
                                  <div
                                    key={m.registryTopicId}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p className="font-semibold text-slate-900">
                                        {m.title}
                                      </p>
                                      <p className="text-slate-600">
                                        {subj?.shortTitle ?? m.domainId} · Confidence: {m.confidence} ({m.confirmed ? 'Confirmed' : 'Suggested — confirm match'}) ·{' '}
                                        {regTopic ? REGISTRY_COVERAGE_LABELS[regTopic.coverageStatus] : ''} ·{' '}
                                        {regTopic ? REGISTRY_REVIEW_LABELS[regTopic.reviewStatus] : ''}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {!m.confirmed && (
                                        <button
                                          type="button"
                                          onClick={() => handleConfirmMapping(item.id, m.registryTopicId)}
                                          className="rounded border border-teal-700 bg-teal-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-teal-800 whitespace-nowrap"
                                        >
                                          Confirm Match
                                        </button>
                                      )}
                                      {regTopic && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            onOpenTopic({
                                              route: regTopic.navigationTarget.route,
                                              domainId: regTopic.domainId,
                                              topicId: regTopic.id,
                                              systemId: regTopic.systemId,
                                              conceptId: regTopic.relatedConceptIds[0],
                                            })
                                          }
                                          className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap"
                                        >
                                          Open Topic
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        aria-label={`Remove mapping ${m.title}`}
                                        onClick={() => handleRemoveMapping(item.id, m.registryTopicId)}
                                        className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-rose-50 hover:text-rose-800 whitespace-nowrap"
                                      >
                                        Unlink
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Manual Remap / Add Multi-Mapping */}
                          {!item.ignored && (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <label className="text-xs text-slate-600" htmlFor={`remap-${item.id}`}>
                                Remap / Link module:
                              </label>
                              <select
                                id={`remap-${item.id}`}
                                defaultValue=""
                                onChange={(e) => {
                                  handleAddOrRemapTopic(item.id, e.target.value);
                                  e.target.value = '';
                                }}
                                className="max-w-md rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800"
                              >
                                <option value="">Select Anatomy 360 topic to link…</option>
                                {REGISTRY_TOPICS.map((rt) => (
                                  <option key={rt.id} value={rt.id}>
                                    [{getRegistrySubjectByDomain(rt.domainId)?.shortTitle ?? rt.domainId}] {rt.title}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleIgnoreItem(item.id)}
                            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                          >
                            {item.ignored ? 'Restore' : 'Ignore'}
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete syllabus item ${item.title}`}
                            onClick={() => handleRemoveItem(item.id)}
                            className="rounded-lg border border-slate-300 bg-white p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* MODE C: SAVED CUSTOM SYLLABI */}
      {mode === 'saved' && (
        <section className="space-y-4" aria-label="Saved custom syllabi">
          {state.customSyllabi.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <h2 className="text-base font-bold text-slate-900">No Saved Syllabi Yet</h2>
              <p className="mt-1 text-xs text-slate-600">
                Use &ldquo;My Syllabus Is Not Listed&rdquo; to paste, upload, or manually enter your institutional syllabus and inspect real coverage.
              </p>
              <button
                type="button"
                onClick={() => setMode('custom')}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-teal-800 bg-teal-800 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-900"
              >
                Create Custom Syllabus
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {state.customSyllabi.map((profile) => {
                const rep = computeSyllabusCoverageReport(profile.items);
                return (
                  <article key={profile.id} className="rounded-xl border border-slate-200 bg-white p-5">
                    <p className="text-xs text-slate-500">
                      {profile.metadata.country} · {profile.metadata.institution} · {profile.metadata.yearOrSemester}
                    </p>
                    <h3 className="mt-1 text-base font-bold text-slate-900">{profile.metadata.courseName}</h3>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {profile.metadata.programme} · {profile.metadata.degree}
                    </p>
                    <p className="mt-2 text-xs text-slate-700 tabular-nums">
                      {rep.activeItems} topics · {rep.availableCount} available ({rep.availablePct}%) ·{' '}
                      {rep.partiallyAvailableCount} partial · {rep.notAvailableYetCount} not available
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleLoadSavedForEdit(profile)}
                        className="rounded-lg border border-teal-800 bg-teal-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-900 whitespace-nowrap"
                      >
                        Inspect &amp; Edit Mapping
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenEducatorForCustomSyllabus(profile.id)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
                      >
                        Educator Workspace
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCustomSyllabus(profile.id)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 whitespace-nowrap"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-xs text-slate-500">
        <span>All curriculum mappings indicate educational alignment only and remain unreviewed by external faculty.</span>
        <button
          type="button"
          onClick={() => onNavigate('learn')}
          className="font-semibold text-teal-800 hover:underline"
        >
          Browse All 16 Subjects in Learn Workspace →
        </button>
      </div>
    </div>
  );
}
