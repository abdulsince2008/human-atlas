import { ExternalLink } from 'lucide-react';
import type { CanonicalSystemId } from '../anatomy-systems';
import { getReviewStatusLabel } from '../data/provenance-registry';
import {
  ACCESS_TYPE_LABELS,
  getStudyResourcesFor,
  type StudyResourceModule,
} from '../data/study-resources';

interface Props {
  conceptId?: string;
  canonicalSystem?: CanonicalSystemId;
  module?: StudyResourceModule;
  limit?: number;
  heading?: string;
  compact?: boolean;
}

export default function StudyResourceList({
  conceptId,
  canonicalSystem,
  module,
  limit = 3,
  heading = 'Curated Open Study Resources',
  compact = false,
}: Props) {
  const resources = getStudyResourcesFor({ conceptId, canonicalSystem, module, limit });
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
                {res.publisher} · {ACCESS_TYPE_LABELS[res.accessType]} · {res.licenseNote} ·{' '}
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
