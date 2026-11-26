import { ExternalLink } from 'lucide-react';
import type { CanonicalSystemId } from '../anatomy-systems';
import { getReviewStatusLabel } from '../data/provenance-registry';
import {
  ACCESS_TYPE_LABELS,
  getStudyResourcesFor,
  RESOURCE_KIND_LABELS,
  type StudyResourceModule,
} from '../data/study-resources';
import type { EducationDomainId, EducationTrackId } from '../education/education-types';

interface Props {
  conceptId?: string;
  canonicalSystem?: CanonicalSystemId;
  topicId?: string;
  domainId?: EducationDomainId;
  academicLevel?: EducationTrackId;
  module?: StudyResourceModule;
  limit?: number;
  heading?: string;
  compact?: boolean;
}

export default function StudyResourceList({
  conceptId,
  canonicalSystem,
  topicId,
  domainId,
  academicLevel,
  module,
  limit = 4,
  heading = 'Curated Open Study Resources',
  compact = false,
}: Props) {
  const resources = getStudyResourcesFor({
    conceptId,
    canonicalSystem,
    topicId,
    domainId,
    academicLevel,
    module,
    limit,
  });
  if (resources.length === 0) return null;

  return (
    <section
      className={compact ? 'a360-resource-section compact' : 'a360-resource-section'}
      aria-label={heading}
    >
      <div className="a360-resource-head">
        <h3>{heading}</h3>
        <span className="a360-muted">Direct curated open links</span>
      </div>

      <ul className="a360-resource-list">
        {resources.map((res) => (
          <li key={res.id} className="a360-resource-item">
            <a
              href={res.url}
              target="_blank"
              rel="noopener noreferrer"
              className="a360-resource-link"
              aria-label={`Open external resource: ${res.title} (${res.publisher})`}
            >
              <span className="a360-resource-title">
                {res.title}
                <ExternalLink size={13} aria-hidden="true" />
              </span>
              <span className="a360-resource-meta">
                {res.publisher}
                {res.resourceKind ? ` · ${RESOURCE_KIND_LABELS[res.resourceKind]}` : ''} ·{' '}
                {ACCESS_TYPE_LABELS[res.accessType]} · {res.licenseNote} ·{' '}
                {getReviewStatusLabel(res.reviewStatus)}
              </span>
              {!compact && <span className="a360-resource-summary">{res.summary}</span>}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
