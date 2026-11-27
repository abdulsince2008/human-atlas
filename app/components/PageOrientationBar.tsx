import { useState, type ReactNode } from 'react';
import { HelpCircle, X } from 'lucide-react';
import SpeakGuidanceButton from './SpeakGuidanceButton';

interface Props {
  whatThisIs: string;
  primaryHint?: string;
  howToSteps?: string[];
  spokenSummary?: string;
  rightSlot?: ReactNode;
}

export default function PageOrientationBar({
  whatThisIs,
  primaryHint,
  howToSteps = [],
  spokenSummary,
  rightSlot,
}: Props) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="a360-orient-bar" role="region" aria-label="Page guidance">
      <div className="a360-orient-main">
        <div className="a360-orient-copy">
          <p className="a360-orient-what">{whatThisIs}</p>
          {primaryHint && <p className="a360-orient-hint">{primaryHint}</p>}
        </div>
        <div className="a360-orient-actions">
          {spokenSummary && (
            <SpeakGuidanceButton
              text={spokenSummary}
              label="Listen"
              stopLabel="Stop"
              compact
            />
          )}
          {howToSteps.length > 0 && (
            <button
              type="button"
              className={`a360-mini-btn ${helpOpen ? 'active' : ''}`}
              aria-expanded={helpOpen}
              onClick={() => setHelpOpen((v) => !v)}
            >
              {helpOpen ? <X size={14} aria-hidden="true" /> : <HelpCircle size={14} aria-hidden="true" />}
              <span>{helpOpen ? 'Hide Help' : 'How to use'}</span>
            </button>
          )}
          {rightSlot}
        </div>
      </div>

      {helpOpen && howToSteps.length > 0 && (
        <ol className="a360-orient-steps">
          {howToSteps.map((step, idx) => (
            <li key={idx}>{step}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
