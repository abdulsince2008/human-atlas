import { Film, BookOpen } from 'lucide-react';
import type { CanonicalSystemId } from '../anatomy-systems';
import EducatorToolkitPanel from '../components/EducatorToolkitPanel';
import TeacherClassroomPanel from '../components/TeacherClassroomPanel';
import type { AppRoute } from '../components/SiteHeader';
import type { CurriculumAuthorityId, EducationDomainId } from '../education/education-types';

interface Props {
  initialSourceKind?: 'domain' | 'framework' | 'custom_syllabus';
  initialDomainId?: EducationDomainId;
  initialFrameworkId?: CurriculumAuthorityId;
  initialCustomSyllabusId?: string;
  onNavigate: (route: AppRoute) => void;
  onOpenTopic: (params: {
    route: AppRoute;
    domainId?: EducationDomainId;
    topicId?: string;
    systemId?: CanonicalSystemId;
    conceptId?: string;
  }) => void;
}

const EDUCATOR_WORKFLOW_STEPS = [
  '1. Pick curriculum or subject',
  '2. Select chapters & topics',
  '3. Inspect outcomes & coverage',
  '4. Reorder teaching sequence',
  '5. Launch study or 3D view',
  '6. Present live in 3D',
  '7. Export .pptx / .pdf / .md',
];

export default function EducatorPage({
  initialSourceKind,
  initialDomainId,
  initialFrameworkId,
  initialCustomSyllabusId,
  onNavigate,
  onOpenTopic,
}: Props) {
  return (
    <div className="a360-page" data-testid="educator-page">
      <header className="a360-page-header">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="a360-kicker">Teacher, Lecturer &amp; Professor Workspace</p>
            <h1>Plan Courses, Sequence Topics &amp; Export Teaching Handouts</h1>
            <p className="a360-lead">
              Select any of the 16 biomedical domains, any of the 13 curriculum frameworks, or your own saved institutional syllabus to inspect learning outcomes, coverage limitations, custom teaching sequences, lecture outlines, and printable student worksheets.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="a360-btn-primary"
              onClick={() => onNavigate('present')}
            >
              <Film size={15} aria-hidden="true" />
              <span>3D Presentation Studio</span>
            </button>
            <button
              type="button"
              className="a360-btn-secondary"
              onClick={() => onNavigate('learn')}
            >
              <BookOpen size={15} aria-hidden="true" />
              <span>Browse 16 Subjects</span>
            </button>
          </div>
        </div>
      </header>

      <section className="a360-educator-workflow" aria-label="Educator 7-step teaching workflow">
        <span className="a360-educator-workflow-label">Teaching Workflow:</span>
        <ol className="a360-educator-steps">
          {EDUCATOR_WORKFLOW_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <TeacherClassroomPanel />

      <EducatorToolkitPanel
        initialSourceKind={initialSourceKind}
        initialDomainId={initialDomainId}
        initialFrameworkId={initialFrameworkId}
        initialCustomSyllabusId={initialCustomSyllabusId}
        onNavigate={onNavigate}
        onOpenTopic={onOpenTopic}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-xs text-slate-500">
        <span>
          Exports are structured reference outlines and practice sheets; verify local syllabus rules and laboratory SOPs prior to graded examinations.
        </span>
        <button
          type="button"
          onClick={() => onNavigate('syllabus')}
          className="font-semibold text-teal-800 hover:underline"
        >
          Open Worldwide Syllabus Navigator →
        </button>
      </div>
    </div>
  );
}
