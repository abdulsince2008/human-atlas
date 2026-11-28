import { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  Compass,
  GraduationCap,
  SlidersHorizontal,
} from 'lucide-react';
import { EDUCATION_TRACKS } from '../education/education-curricula';
import type { EducationTrackId } from '../education/education-types';
import { resolveRoleAndTrackMapping, type AppRoute } from '../navigation-registry';
import type { AudienceRole, ExperienceDepth } from '../study-store';
import { useStudy } from './StudyContext';
import SpeakGuidanceButton from './SpeakGuidanceButton';

interface Props {
  onNavigate: (route: AppRoute) => void;
  onStartGuidedStudy?: () => void;
}

const ROLE_OPTIONS: {
  id: Exclude<AudienceRole, 'unset'>;
  title: string;
  subtitle: string;
  cta: string;
}[] = [
  {
    id: 'learning',
    title: 'I am learning',
    subtitle: 'Follow clear explanations, match your school or medical syllabus, and practice quizzes.',
    cta: 'Choose my level',
  },
  {
    id: 'teaching',
    title: 'I am teaching',
    subtitle: 'Plan lessons across 16 subjects, reorder topics, present in 3D, and export handouts.',
    cta: 'Open Educator Workspace',
  },
  {
    id: 'exploring',
    title: 'I just want to explore',
    subtitle: 'Rotate the 3D human body freely, tap organs to see what they do, and browse at your pace.',
    cta: 'Explore 3D Body',
  },
];

export default function OnboardingExperience({ onNavigate, onStartGuidedStudy }: Props) {
  const { state, setAudienceAndTrack, dismissOnboarding } = useStudy();
  const [selectedRole, setSelectedRole] = useState<AudienceRole>(state.audienceRole);
  const [selectedTrackId, setSelectedTrackId] = useState<EducationTrackId>(
    state.educationTrackId ?? 'school_foundations',
  );
  const [keepSimple, setKeepSimple] = useState<boolean>(state.experienceDepth === 'guided');

  const activeTrackSpec = EDUCATION_TRACKS.find((t) => t.id === selectedTrackId) ?? EDUCATION_TRACKS[0];

  const handleChooseRole = (role: Exclude<AudienceRole, 'unset'>) => {
    setSelectedRole(role);
    if (role === 'teaching') {
      setAudienceAndTrack({
        role: 'teaching',
        educationTrackId: 'medical_foundations',
        studyTrack: 'MBBS / Medical',
        experienceDepth: 'full',
        onboardingCompleted: true,
        trackSelected: true,
        dismissBanner: true,
      });
      onNavigate('educator');
      return;
    }

    if (role === 'exploring') {
      setAudienceAndTrack({
        role: 'exploring',
        educationTrackId: null,
        studyTrack: 'General Biology',
        experienceDepth: 'guided',
        onboardingCompleted: true,
        trackSelected: false,
        dismissBanner: true,
      });
      return;
    }
  };

  const handleConfirmLearningTrack = () => {
    const mapped = resolveRoleAndTrackMapping(selectedTrackId);
    const depth: ExperienceDepth = keepSimple ? 'guided' : mapped.experienceDepth;
    setAudienceAndTrack({
      role: 'learning',
      educationTrackId: selectedTrackId,
      studyTrack: mapped.studyTrack,
      experienceDepth: depth,
      onboardingCompleted: true,
      trackSelected: true,
      dismissBanner: true,
    });
    if (selectedTrackId === 'school_foundations' && onStartGuidedStudy) {
      onStartGuidedStudy();
    }
  };

  const spokenWelcome =
    selectedRole === 'learning'
      ? `Choose the level that matches you best, from Grades 6 to 8 up to MBBS, Nursing, or Research. You can change your level or switch between simple and full view anytime.`
      : `Welcome to Alphatomy. Explore the human body, learn how it works, and practice what you discover. Choose I am learning, I am teaching, or I just want to explore, or skip to browse right away.`;

  return (
    <section className="a360-onboarding-gateway" aria-label="Welcome and pathway setup">
      <div className="a360-onboarding-head">
        <div>
          <p className="a360-kicker">Welcome to Alphatomy · Free &amp; Open · Change Anytime</p>
          <h2>Explore the human body, learn how it works, and practice what you discover.</h2>
          <p className="a360-muted">
            No account needed. Pick how you want to use Alphatomy today—or skip and browse freely.
          </p>
        </div>
        <div className="a360-onboarding-head-actions">
          <SpeakGuidanceButton text={spokenWelcome} label="Listen to guide" stopLabel="Stop voice" />
          <button
            type="button"
            className="a360-btn-secondary"
            onClick={() => dismissOnboarding(true)}
          >
            Skip for now
          </button>
        </div>
      </div>

      <div className="a360-role-grid" role="group" aria-label="Choose how you want to use Alphatomy">
        {ROLE_OPTIONS.map((opt) => {
          const isSelected = selectedRole === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              className={`a360-role-card ${isSelected ? 'active' : ''}`}
              aria-pressed={isSelected}
              onClick={() => handleChooseRole(opt.id)}
            >
              <span className="a360-role-icon">
                {opt.id === 'learning' ? (
                  <BookOpen size={20} aria-hidden="true" />
                ) : opt.id === 'teaching' ? (
                  <GraduationCap size={20} aria-hidden="true" />
                ) : (
                  <Compass size={20} aria-hidden="true" />
                )}
              </span>
              <strong>{opt.title}</strong>
              <span className="a360-role-desc">{opt.subtitle}</span>
              <span className="a360-role-cta">
                {opt.cta} <ArrowRight size={14} aria-hidden="true" />
              </span>
            </button>
          );
        })}
      </div>

      {selectedRole === 'learning' && (
        <div className="a360-track-picker" aria-label="Choose your learning level">
          <div className="a360-track-picker-head">
            <div>
              <h3>What best matches your level?</h3>
              <p className="a360-muted">
                This sets default explanation depth without hiding any tool or subject.
              </p>
            </div>
            <label className="a360-simple-toggle">
              <input
                type="checkbox"
                checked={keepSimple}
                onChange={(e) => setKeepSimple(e.target.checked)}
              />
              <SlidersHorizontal size={14} aria-hidden="true" />
              <span>Keep explanations simple &amp; step-by-step first</span>
            </label>
          </div>

          <div className="a360-track-options">
            {EDUCATION_TRACKS.map((track) => {
              const active = selectedTrackId === track.id;
              return (
                <button
                  key={track.id}
                  type="button"
                  className={`a360-track-option ${active ? 'active' : ''}`}
                  aria-pressed={active}
                  onClick={() => {
                    setSelectedTrackId(track.id);
                    setKeepSimple(track.id === 'school_foundations' || track.id === 'secondary_premed');
                  }}
                >
                  <span className="a360-track-option-title">
                    {active && <Check size={14} aria-hidden="true" />}
                    <strong>{track.label}</strong>
                  </span>
                  <span>{track.stageSummary}</span>
                </button>
              );
            })}
          </div>

          <div className="a360-track-confirm-bar">
            <span className="a360-muted">
              Selected: <strong>{activeTrackSpec.shortLabel}</strong> ·{' '}
              {keepSimple ? 'Guided (Simple explanations first)' : 'Full Scientific Depth'}
            </span>
            <div className="a360-card-actions">
              <button
                type="button"
                className="a360-btn-primary"
                onClick={handleConfirmLearningTrack}
              >
                Save &amp; Start Learning
                <ArrowRight size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="a360-btn-secondary"
                onClick={() => {
                  const mapped = resolveRoleAndTrackMapping(selectedTrackId);
                  setAudienceAndTrack({
                    role: 'learning',
                    educationTrackId: selectedTrackId,
                    studyTrack: mapped.studyTrack,
                    experienceDepth: keepSimple ? 'guided' : mapped.experienceDepth,
                    onboardingCompleted: true,
                    trackSelected: true,
                    dismissBanner: true,
                  });
                  onNavigate('syllabus');
                }}
              >
                Find My Syllabus Instead
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
