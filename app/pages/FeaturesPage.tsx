import { ArrowRight, ExternalLink, Layers, Sparkles } from 'lucide-react';
import {
  getToolByRoute,
  type AppRoute,
} from '../navigation-registry';
import PageOrientationBar from '../components/PageOrientationBar';
import SiteFooter from '../components/SiteFooter';
import ToolIcon from '../components/ToolIcon';

interface Props {
  onNavigate: (route: AppRoute) => void;
}

const FEATURE_CATEGORIES: {
  id: string;
  title: string;
  description: string;
  routes: AppRoute[];
}[] = [
  {
    id: 'explore-body',
    title: 'Explore the Body',
    description:
      'Inspect Male (2,301 parts) and Female (2,328 parts + optional layers) interactive 3D anatomy directly in WebGL with x-ray, explode, clip planes, and FMA hierarchy.',
    routes: ['explorer', 'systems', 'relationships', 'atlases'],
  },
  {
    id: 'learn-anatomy',
    title: 'Learn Anatomy',
    description:
      'Follow plain-language or advanced biomedical lessons synchronized with the 3D scene and worldwide school/medical curricula.',
    routes: ['study', 'learn', 'syllabus', 'search'],
  },
  {
    id: 'study-revise',
    title: 'Study and Revise',
    description:
      'Build lasting retention with spaced-repetition flashcards, saved structure bookmarks, weak-area queues, and portable JSON backups.',
    routes: ['revision', 'bookmarks', 'dashboard'],
  },
  {
    id: 'practice-assess',
    title: 'Practice and Assess',
    description:
      'Test your recall with topic-tagged multiple-choice questions and interactive 3D spotter lab identification exams.',
    routes: ['quiz', 'practical-lab'],
  },
  {
    id: 'teach-present',
    title: 'Teach and Present',
    description:
      'Sequence lectures across 16 subjects, play animated 3D classroom walkthroughs, share classroom codes, and export .pptx, .pdf, and .md handouts.',
    routes: ['educator', 'present'],
  },
  {
    id: 'advanced-tools',
    title: 'Advanced Educational Tools',
    description:
      'Connect macroscopic 3D structures to real light-microscopy histology slides, dynamic physiology sliders, and clinical reasoning cases.',
    routes: ['physiology', 'histology', 'clinical'],
  },
];

const SCREENSHOT_GALLERY = [
  {
    src: '/assets/screenshots/explorer-preview.png',
    title: 'Interactive 3D Body Explorer',
    caption: 'Real-time WebGL Male & Female anatomy meshes with system filters, cross-sections, and instant structure inspection.',
    route: 'explorer' as AppRoute,
  },
  {
    src: '/assets/screenshots/study-workspace-preview.png',
    title: 'Guided Study Workspace',
    caption: 'Plain-language through MBBS/PhD notes paired beside live 3D anatomical views and practice checks.',
    route: 'study' as AppRoute,
  },
  {
    src: '/assets/screenshots/educator-workspace-preview.png',
    title: 'Teacher & Professor Workspace',
    caption: 'Curriculum planning across 16 biomedical subjects, custom lesson sequences, and classroom/handout tools.',
    route: 'educator' as AppRoute,
  },
];

export default function FeaturesPage({ onNavigate }: Props) {
  return (
    <div className="a360-page" data-testid="features-page">
      <header className="a360-page-header">
        <p className="a360-kicker">Platform Capabilities Overview</p>
        <h1>Alphatomy Features &amp; Learning Workspaces</h1>
        <p className="a360-lead">
          Every module on this page connects directly to the live educational software running in
          your browser — combining BodyParts3D 4.0 and HuBMAP Human Reference Atlas meshes with
          structured curriculum study, quizzes, simulations, and educator tools.
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <button
            type="button"
            className="a360-btn-primary"
            onClick={() => onNavigate('explorer')}
          >
            Open 3D Explorer
          </button>
          <button
            type="button"
            className="a360-btn-secondary"
            onClick={() => onNavigate('pricing')}
          >
            View Plans &amp; Pricing
          </button>
        </div>
      </header>

      <PageOrientationBar
        whatThisIs="A complete functional overview of Alphatomy organized by how students, learners, and teachers use the software."
        primaryHint="Click any feature card below to open that exact tool directly — no login required for core exploration."
        spokenSummary="Alphatomy Features page. Features are grouped into Explore the Body, Learn Anatomy, Study and Revise, Practice and Assess, Teach and Present, and Advanced Educational Tools."
      />

      <section className="a360-section" aria-labelledby="features-screenshots-heading">
        <div className="a360-section-head">
          <div>
            <p className="a360-kicker">Live Application Previews</p>
            <h2 id="features-screenshots-heading">Genuine Views Inside Alphatomy</h2>
            <p>
              Unretouched captures taken directly from the running Alphatomy web application.
            </p>
          </div>
          <button
            type="button"
            className="a360-text-link"
            onClick={() => onNavigate('about')}
          >
            Dataset Scope &amp; Licenses <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {SCREENSHOT_GALLERY.map((shot) => (
            <article
              key={shot.src}
              className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <div className="aspect-video w-full overflow-hidden border-b border-slate-200 bg-slate-100">
                <img
                  src={shot.src}
                  alt={shot.title}
                  className="h-full w-full object-cover object-top"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-1 flex-col justify-between gap-3 p-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{shot.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{shot.caption}</p>
                </div>
                <button
                  type="button"
                  className="a360-card-btn self-start"
                  onClick={() => onNavigate(shot.route)}
                >
                  Open Live View <ExternalLink size={13} aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="space-y-8">
        {FEATURE_CATEGORIES.map((category) => (
          <section
            key={category.id}
            className="a360-section"
            aria-labelledby={`feat-cat-${category.id}`}
          >
            <div className="a360-section-head">
              <div>
                <h2 id={`feat-cat-${category.id}`}>{category.title}</h2>
                <p>{category.description}</p>
              </div>
            </div>
            <div className="a360-tools-grid">
              {category.routes.map((r) => {
                const tool = getToolByRoute(r);
                return (
                  <article key={tool.id} className="a360-tool-card">
                    <div className="a360-tool-card-top">
                      <span className="a360-tool-icon-box">
                        <ToolIcon name={tool.icon} size={18} />
                      </span>
                      <div>
                        <h3>{tool.title}</h3>
                        <p className="a360-tool-tech">{tool.technicalTitle}</p>
                      </div>
                    </div>
                    <p className="a360-tool-summary">{tool.summary}</p>
                    <p className="a360-tool-bestfor">{tool.bestFor}</p>
                    <div className="a360-tool-card-footer">
                      <button
                        type="button"
                        className="a360-card-btn"
                        onClick={() => onNavigate(tool.route)}
                      >
                        <span>{tool.actionLabel}</span>
                        <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <p className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide text-teal-800">
              <Sparkles size={13} aria-hidden="true" /> Transparent Scope &amp; AI Metering
            </p>
            <h2 className="text-lg font-semibold text-slate-900">
              Truthful Coverage &amp; Separate AI Metered Allowance
            </h2>
            <p className="max-w-3xl text-sm text-slate-600">
              Alphatomy openly documents unmodeled structures (such as thyroid/parathyroid meshes,
              ear ossicles, and systemic lymph node chains) on our About &amp; Licenses page. Optional
              AI Navigator usage is token-metered separately from core 3D exploration. Educational
              software only — not intended for medical diagnosis or treatment.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              className="a360-btn-secondary"
              onClick={() => onNavigate('about')}
            >
              <Layers size={15} aria-hidden="true" /> Coverage &amp; Licenses
            </button>
            <button
              type="button"
              className="a360-btn-primary"
              onClick={() => onNavigate('pricing')}
            >
              Compare Plans
            </button>
          </div>
        </div>
      </section>

      <SiteFooter onNavigate={onNavigate} />
    </div>
  );
}
