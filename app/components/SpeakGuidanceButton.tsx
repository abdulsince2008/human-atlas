import { useEffect, useId, useState } from 'react';
import { Square, Volume2 } from 'lucide-react';
import {
  isSpeechSynthesisSupported,
  speakGuidanceText,
  stopSpeechGuidance,
} from '../utils/speech-guidance';

interface Props {
  text: string;
  label?: string;
  stopLabel?: string;
  compact?: boolean;
  className?: string;
}

export default function SpeakGuidanceButton({
  text,
  label = 'Listen',
  stopLabel = 'Stop reading',
  compact = false,
  className = '',
}: Props) {
  const [speaking, setSpeaking] = useState(false);
  const [unavailableNotice, setUnavailableNotice] = useState(false);
  const supported = isSpeechSynthesisSupported();
  const statusId = useId();

  useEffect(() => {
    setSpeaking(false);
    stopSpeechGuidance();
    return () => {
      stopSpeechGuidance();
    };
  }, [text]);

  const handleToggle = () => {
    if (!supported) {
      setUnavailableNotice((prev) => !prev);
      return;
    }
    if (speaking) {
      stopSpeechGuidance();
      setSpeaking(false);
      return;
    }
    const res = speakGuidanceText(text, {
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
    if (res.started) {
      setSpeaking(true);
    } else {
      setUnavailableNotice(true);
    }
  };

  return (
    <span className={`a360-speak-wrap ${className}`}>
      <button
        type="button"
        className={`a360-speak-btn ${compact ? 'is-compact' : ''} ${speaking ? 'is-speaking' : ''}`}
        onClick={handleToggle}
        aria-pressed={speaking}
        aria-describedby={unavailableNotice ? statusId : undefined}
        title={
          supported
            ? speaking
              ? 'Stop reading this guidance aloud'
              : 'Read this explanation aloud using your browser voice'
            : 'Audio read-aloud is unavailable in this browser'
        }
      >
        {speaking ? <Square size={14} aria-hidden="true" /> : <Volume2 size={15} aria-hidden="true" />}
        <span>{speaking ? stopLabel : label}</span>
      </button>
      {unavailableNotice && (
        <span id={statusId} className="a360-speak-note" role="status">
          Audio read-aloud is not supported in this browser environment.
        </span>
      )}
    </span>
  );
}
