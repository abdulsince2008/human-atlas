import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Eye,
  Flame,
  Layers,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { DEFAULT_VISIBLE, type Atlas, type SceneState } from '../anatomy';
import { CANONICAL_SYSTEMS, type CanonicalSystemId } from '../anatomy-systems';
import { useStudy } from '../components/StudyContext';
import {
  ANATOMY_FLASHCARDS,
  formatIntervalLabel,
  isCardDue,
  type FlashcardFocus,
  type ReviewRating,
} from '../spaced-repetition';
import { generateAdaptiveRecommendations } from '../adaptive-study';
import type { StudyContextInput } from '../study-context-engine';

const AnatomyScene = lazy(() => import('../scene'));

export type RevisionTab = 'queue' | 'flashcards' | 'bookmarks';

interface Props {
  atlas: Atlas | null;
  initialTab?: RevisionTab;
  initialSystem?: CanonicalSystemId | 'all';
  onInspectConcept: (conceptId: string) => void;
  onOpenLearnSystem: (systemId: CanonicalSystemId) => void;
  onOpenPracticalLab: () => void;
  onOpenReference: (conceptId: string) => void;
  onOpenStudyContext?: (input: StudyContextInput) => void;
}

export default function RevisionPage({
  atlas,
  initialTab = 'flashcards',
  initialSystem = 'all',
  onInspectConcept,
  onOpenLearnSystem,
  onOpenPracticalLab,
  onOpenReference,
  onOpenStudyContext,
}: Props) {
  const {
    state,
    revisionQueue,
    isBookmarked,
    toggleBookmark,
    rateFlashcard,
  } = useStudy();

  const [tab, setTab] = useState<RevisionTab>(initialTab);
  const [systemFilter, setSystemFilter] = useState<CanonicalSystemId | 'all'>(initialSystem);
  const [focusFilter, setFocusFilter] = useState<FlashcardFocus | 'all'>('all');
  const [dueOnly, setDueOnly] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [show3DCard, setShow3DCard] = useState(false);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (initialSystem) setSystemFilter(initialSystem);
  }, [initialSystem]);

  const deck = useMemo(() => {
    const now = Date.now();
    return ANATOMY_FLASHCARDS.filter((c) => {
      if (systemFilter !== 'all' && c.canonicalSystem !== systemFilter) return false;
      if (focusFilter !== 'all' && c.focus !== focusFilter) return false;
      if (dueOnly && !isCardDue(state.flashcardReviews[c.id], now)) return false;
      return true;
    });
  }, [systemFilter, focusFilter, dueOnly, state.flashcardReviews]);

  const safeIdx = deck.length > 0 ? Math.min(cardIndex, deck.length - 1) : 0;
  const activeCard = deck[safeIdx];
  const activeReview = activeCard ? state.flashcardReviews[activeCard.id] : undefined;
  const dueCount = useMemo(() => {
    const now = Date.now();
    return ANATOMY_FLASHCARDS.filter((c) => isCardDue(state.flashcardReviews[c.id], now)).length;
  }, [state.flashcardReviews]);

  const previewSceneState = useMemo<SceneState>(() => {
    const concept = atlas && activeCard ? atlas.concepts.find((c) => c.id === activeCard.conceptId) : undefined;
    return {
      embedded: true,
      suppressHoverTooltip: true,
      explode: 0,
      visible: DEFAULT_VISIBLE,
      selected: concept?.elements ?? [],
      isolate: false,
      ghostSurroundings: Boolean(concept?.elements.length),
      interactionMode: 'orbit',
      view: 'three-quarter',
      rotate: false,
      reset: 0,
      focusRequest: safeIdx + 1,
    };
  }, [atlas, activeCard, safeIdx]);

  const handleRate = (rating: ReviewRating) => {
    if (!activeCard) return;
    rateFlashcard(activeCard.id, activeCard.conceptId, activeCard.structureName, rating);
    setShowAnswer(false);
    setCardIndex((prev) => (deck.length > 1 ? (prev + 1) % deck.length : 0));
  };

  const bookmarksList = useMemo(
    () => Object.values(state.bookmarks).sort((a, b) => b.createdAt - a.createdAt),
    [state.bookmarks],
  );

  const adaptiveRecommendations = useMemo(
    () => generateAdaptiveRecommendations(state, atlas, { limit: 4 }),
    [state, atlas],
  );

  return (
    <div className="a360-page">
      <header className="a360-page-header">
        <p className="a360-kicker">Unified Active Recall & Spaced Repetition</p>
        <h1>Revision Hub, Flashcards & Bookmarks</h1>
        <p className="a360-lead">
          Revise anatomical names, functions, locations, and verified relationships generated directly
          from the canonical atlas curriculum—combined with Practical Lab misses and saved items.
        </p>
      </header>

      <div className="a360-category-tabs" role="tablist" aria-label="Revision sections">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'flashcards'}
          className={`a360-category-tab ${tab === 'flashcards' ? 'active' : ''}`}
          onClick={() => setTab('flashcards')}
        >
          <Layers size={15} />
          <span>Flashcards ({deck.length})</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'queue'}
          className={`a360-category-tab ${tab === 'queue' ? 'active' : ''}`}
          onClick={() => setTab('queue')}
        >
          <Flame size={15} />
          <span>Revision Queue ({revisionQueue.length})</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'bookmarks'}
          className={`a360-category-tab ${tab === 'bookmarks' ? 'active' : ''}`}
          onClick={() => setTab('bookmarks')}
        >
          <Bookmark size={15} />
          <span>Saved Bookmarks ({bookmarksList.length})</span>
        </button>
      </div>

      {tab === 'flashcards' && (
        <section className="a360-flashcard-section">
          <div className="a360-quiz-filters">
            <label className="a360-select-field">
              <span>System</span>
              <select
                value={systemFilter}
                onChange={(e) => {
                  setSystemFilter(e.target.value as CanonicalSystemId | 'all');
                  setCardIndex(0);
                  setShowAnswer(false);
                }}
              >
                <option value="all">All 12 Systems</option>
                {CANONICAL_SYSTEMS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name.en}
                  </option>
                ))}
              </select>
            </label>

            <label className="a360-select-field">
              <span>Card Focus</span>
              <select
                value={focusFilter}
                onChange={(e) => {
                  setFocusFilter(e.target.value as FlashcardFocus | 'all');
                  setCardIndex(0);
                  setShowAnswer(false);
                }}
              >
                <option value="all">All Focus Areas</option>
                <option value="function">Functions</option>
                <option value="location">Locations</option>
                <option value="name">Identification / Latin</option>
                <option value="relationship">Relationships</option>
                <option value="fact">Key Facts</option>
              </select>
            </label>

            <div className="a360-filter-toggle-wrap">
              <button
                type="button"
                className={`a360-filter-btn ${dueOnly ? 'active' : ''}`}
                onClick={() => {
                  setDueOnly((v) => !v);
                  setCardIndex(0);
                  setShowAnswer(false);
                }}
              >
                Due Only ({dueCount})
              </button>
              <button
                type="button"
                className={`a360-filter-btn ${show3DCard ? 'active' : ''}`}
                onClick={() => setShow3DCard((v) => !v)}
              >
                <Eye size={14} /> {show3DCard ? 'Hide 3D Preview' : '3D Card Preview'}
              </button>
            </div>
          </div>

          {!activeCard ? (
            <div className="a360-empty-box">
              <p>
                No flashcards match the current filters or all filtered cards have already been reviewed for now.
              </p>
              <button
                type="button"
                className="a360-btn-secondary"
                onClick={() => {
                  setSystemFilter('all');
                  setFocusFilter('all');
                  setDueOnly(false);
                }}
              >
                <RotateCcw size={14} /> Show All Flashcards
              </button>
            </div>
          ) : (
            <div className={`a360-fc-stage ${show3DCard && activeCard.inModel ? 'with-3d' : ''}`}>
              <article className="a360-fc-card">
                <div className="a360-fc-meta">
                  <span>
                    Card {safeIdx + 1} of {deck.length} ·{' '}
                    {CANONICAL_SYSTEMS.find((s) => s.id === activeCard.canonicalSystem)?.name.en} ·{' '}
                    {activeCard.focus}
                  </span>
                  <button
                    type="button"
                    className={`a360-btn-secondary ${isBookmarked('structure', activeCard.conceptId) ? 'is-saved' : ''}`}
                    onClick={() =>
                      toggleBookmark({
                        kind: 'structure',
                        targetId: activeCard.conceptId,
                        title: activeCard.structureName,
                        subtitle: activeCard.canonicalSystem,
                        canonicalSystem: activeCard.canonicalSystem,
                      })
                    }
                  >
                    <Bookmark size={14} />
                    {isBookmarked('structure', activeCard.conceptId) ? 'Saved' : 'Save Structure'}
                  </button>
                </div>

                <h2 className="a360-fc-prompt">{activeCard.frontPrompt}</h2>

                {activeReview && (
                  <p className="a360-muted">
                    Previous interval: {formatIntervalLabel(activeReview.intervalDays)} · Repetitions:{' '}
                    {activeReview.repetitions} · Ease factor: {activeReview.easeFactor.toFixed(2)}
                  </p>
                )}

                {!showAnswer ? (
                  <div className="a360-fc-reveal-row">
                    <button
                      type="button"
                      className="a360-btn-primary"
                      onClick={() => setShowAnswer(true)}
                    >
                      Show Answer
                    </button>
                    <button
                      type="button"
                      className="a360-btn-secondary"
                      onClick={() => {
                        setShowAnswer(false);
                        setCardIndex((i) => (i + 1) % deck.length);
                      }}
                    >
                      Skip Card
                    </button>
                  </div>
                ) : (
                  <div className="a360-fc-answer" aria-live="polite">
                    <p className="a360-kicker">Verified Answer · {activeCard.structureName}</p>
                    <p className="a360-fc-answer-main">{activeCard.backAnswer}</p>
                    {activeCard.backDetails.length > 0 && (
                      <ul className="a360-fact-list">
                        {activeCard.backDetails.map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                      </ul>
                    )}

                    <div className="a360-fc-rating-row">
                      <button
                        type="button"
                        className="a360-rate-btn is-hard"
                        onClick={() => handleRate('difficult')}
                      >
                        Mark Difficult (~4 hr)
                      </button>
                      <button
                        type="button"
                        className="a360-rate-btn is-repeat"
                        onClick={() => handleRate('repeat')}
                      >
                        Repeat Later (1–3 days)
                      </button>
                      <button
                        type="button"
                        className="a360-rate-btn is-good"
                        onClick={() => handleRate('understood')}
                      >
                        Understood ({activeReview ? formatIntervalLabel(Math.max(6, Math.round(activeReview.intervalDays * activeReview.easeFactor))) : '1–6 days'})
                      </button>
                    </div>

                    <div className="a360-ref-footer-links">
                      {activeCard.inModel && (
                        <button
                          type="button"
                          className="a360-btn-secondary"
                          onClick={() => onInspectConcept(activeCard.conceptId)}
                        >
                          Inspect in 3D <ArrowRight size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="a360-btn-secondary"
                        onClick={() => onOpenReference(activeCard.conceptId)}
                      >
                        Open Reference Entry
                      </button>
                      {onOpenStudyContext && (
                        <button
                          type="button"
                          className="a360-btn-primary"
                          onClick={() =>
                            onOpenStudyContext({
                              conceptId: activeCard.conceptId,
                              systemId: activeCard.canonicalSystem,
                              sourceModule: 'revision',
                            })
                          }
                        >
                          Study Workspace <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <p className="a360-provenance-line">
                  Scheduling uses a documented SM-2 spaced-repetition interval curve for personal study organization (not a clinical outcome claim).
                </p>
              </article>

              {show3DCard && activeCard.inModel && (
                <div className="a360-fc-3d-panel">
                  <div className="a360-rel-3d-viewport">
                    {atlas ? (
                      <Suspense fallback={<div className="a360-empty-box">Loading 3D preview…</div>}>
                        <AnatomyScene
                          atlas={atlas}
                          state={previewSceneState}
                          onSelect={() => {}}
                          onProgress={() => {}}
                          onError={() => {}}
                        />
                      </Suspense>
                    ) : (
                      <div className="a360-empty-box">Loading 3D model catalog…</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {tab === 'queue' && (
        <section className="a360-subblock">
          <div className="a360-list-header">
            <div>
              <h2>Recommended Revision Queue</h2>
              <p className="a360-muted">
                Prioritized automatically from Practical Lab misses, difficult flashcards, saved bookmarks, and remaining lesson topics.
              </p>
            </div>
            {Object.keys(state.weakConcepts).length > 0 && (
              <button
                type="button"
                className="a360-btn-primary"
                onClick={onOpenPracticalLab}
              >
                Launch Practical Lab Practice
              </button>
            )}
          </div>

          {adaptiveRecommendations.length > 0 && onOpenStudyContext && (
            <div className="a360-coverage-box" style={{ marginBottom: '12px' }}>
              <strong>Adaptive Next Study Recommendations:</strong>{' '}
              <div className="a360-card-actions flex-wrap" style={{ marginTop: '8px' }}>
                {adaptiveRecommendations.map((rec) => (
                  <button
                    key={rec.id}
                    type="button"
                    className="a360-btn-secondary"
                    onClick={() => onOpenStudyContext(rec.studyInput)}
                  >
                    {rec.targetTitle} ({rec.reasonLabel}) <ArrowRight size={13} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {revisionQueue.length === 0 ? (
            <div className="a360-empty-box">
              <CheckCircle2 size={18} />
              <p>Your revision queue is clear. Explore a Practical Lab exam or mark structures to build targeted revision.</p>
            </div>
          ) : (
            <div className="a360-search-results-list">
              {revisionQueue.map((entry) => (
                <div key={entry.id} className="a360-search-row">
                  <div className="a360-search-row-info">
                    <strong>{entry.title}</strong>
                    <span>{entry.subtitle}</span>
                  </div>
                  <div className="a360-card-actions">
                    {entry.conceptId && (
                      <button
                        type="button"
                        className="a360-card-btn"
                        onClick={() => onInspectConcept(entry.conceptId!)}
                      >
                        Inspect 3D
                      </button>
                    )}
                    {entry.cardId ? (
                      <button
                        type="button"
                        className="a360-btn-secondary"
                        onClick={() => {
                          const idx = ANATOMY_FLASHCARDS.findIndex((c) => c.id === entry.cardId);
                          if (idx >= 0) {
                            setSystemFilter('all');
                            setFocusFilter('all');
                            setDueOnly(false);
                            setCardIndex(idx);
                            setShowAnswer(false);
                            setTab('flashcards');
                          }
                        }}
                      >
                        Review Card
                      </button>
                    ) : entry.canonicalSystem ? (
                      <button
                        type="button"
                        className="a360-btn-secondary"
                        onClick={() => onOpenLearnSystem(entry.canonicalSystem!)}
                      >
                        Open Lesson
                      </button>
                    ) : null}
                    {onOpenStudyContext && (
                      <button
                        type="button"
                        className="a360-btn-secondary"
                        onClick={() =>
                          onOpenStudyContext({
                            conceptId: entry.conceptId,
                            systemId: entry.canonicalSystem,
                            sourceModule: 'revision',
                          })
                        }
                      >
                        Study Workspace
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'bookmarks' && (
        <section className="a360-subblock">
          <h2>Saved Structures, Lessons & Study Items</h2>
          {bookmarksList.length === 0 ? (
            <div className="a360-empty-box">
              <p>
                No saved bookmarks yet. Save any structure from 3D Explorer, Reference Library,
                Lessons, Quizzes, or Flashcards.
              </p>
            </div>
          ) : (
            <div className="a360-search-results-list">
              {bookmarksList.map((bm) => (
                <div key={bm.id} className="a360-search-row">
                  <div className="a360-search-row-info">
                    <strong>{bm.title}</strong>
                    <span>
                      {bm.kind} {bm.subtitle ? `· ${bm.subtitle}` : ''}
                    </span>
                  </div>
                  <div className="a360-card-actions">
                    {bm.kind === 'structure' && (
                      <>
                        <button
                          type="button"
                          className="a360-card-btn"
                          onClick={() => onInspectConcept(bm.targetId)}
                        >
                          Inspect in 3D
                        </button>
                        <button
                          type="button"
                          className="a360-btn-secondary"
                          onClick={() => onOpenReference(bm.targetId)}
                        >
                          Reference
                        </button>
                      </>
                    )}
                    {bm.canonicalSystem && bm.kind !== 'structure' && (
                      <button
                        type="button"
                        className="a360-card-btn"
                        onClick={() => onOpenLearnSystem(bm.canonicalSystem!)}
                      >
                        Open in Learn
                      </button>
                    )}
                    {onOpenStudyContext && (
                      <button
                        type="button"
                        className="a360-btn-secondary"
                        onClick={() =>
                          onOpenStudyContext(
                            bm.kind === 'structure'
                              ? {
                                  conceptId: bm.targetId,
                                  systemId: bm.canonicalSystem,
                                  sourceModule: 'bookmarks',
                                }
                              : {
                                  topicId: bm.targetId,
                                  systemId: bm.canonicalSystem,
                                  sourceModule: 'bookmarks',
                                },
                          )
                        }
                      >
                        Study Workspace
                      </button>
                    )}
                    <button
                      type="button"
                      className="a360-btn-secondary"
                      aria-label={`Remove bookmark ${bm.title}`}
                      onClick={() =>
                        toggleBookmark({
                          kind: bm.kind,
                          targetId: bm.targetId,
                          title: bm.title,
                          subtitle: bm.subtitle,
                          canonicalSystem: bm.canonicalSystem,
                        })
                      }
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
