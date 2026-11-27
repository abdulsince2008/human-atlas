export interface SpeechGuidanceHandle {
  supported: boolean;
  started: boolean;
  stop: () => void;
}

export function isSpeechSynthesisSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.speechSynthesis?.speak === 'function' &&
    typeof SpeechSynthesisUtterance !== 'undefined'
  );
}

export function stopSpeechGuidance(): void {
  if (!isSpeechSynthesisSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore browser speech engine errors safely
  }
}

export function speakGuidanceText(
  rawText: string,
  options?: {
    rate?: number;
    lang?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  },
): SpeechGuidanceHandle {
  const cleanText = rawText.replace(/\s+/g, ' ').trim();
  if (!cleanText || !isSpeechSynthesisSupported()) {
    return {
      supported: isSpeechSynthesisSupported(),
      started: false,
      stop: () => {},
    };
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = options?.rate ?? 0.96;
    utterance.pitch = 1.0;
    utterance.lang = options?.lang ?? 'en-US';
    utterance.onstart = () => options?.onStart?.();
    utterance.onend = () => options?.onEnd?.();
    utterance.onerror = () => options?.onError?.();

    window.speechSynthesis.speak(utterance);
    return {
      supported: true,
      started: true,
      stop: stopSpeechGuidance,
    };
  } catch {
    options?.onError?.();
    return {
      supported: isSpeechSynthesisSupported(),
      started: false,
      stop: () => {},
    };
  }
}
