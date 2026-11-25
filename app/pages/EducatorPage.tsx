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

export default function EducatorPage({
  initialSourceKind,
  initialDomainId,
  initialFrameworkId,
  initialCustomSyllabusId,
  onNavigate,
  onOpenTopic,
}: Props) {
  return (
    <div className="a360-page">
      <header className="a360-page-header">
        <p className="a360-kicker">Teacher, Lecturer &amp; Professor Workspace</p>
        <h1>Plan Courses, Sequence Topics &amp; Export Teaching Handouts</h1>
        <p className="a360-lead">
          Select any of the 16 biomedical domains, any of the 13 curriculum frameworks, or your own saved institutional syllabus to inspect learning outcomes, coverage limitations, custom teaching sequences, lecture outlines, and printable student worksheets.
        </p>
      </header>

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
