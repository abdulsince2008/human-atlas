/**
 * Anatomy 360 — Browser-Native Video Recording & Composition Engine
 *
 * Uses HTMLCanvasElement.captureStream() + MediaRecorder with a dedicated 2D
 * composition canvas that composites:
 *   1. Live WebGL 3D AnatomyScene canvas frame
 *   2. Rendered educational title bar, step indicator, and captions
 *   3. Rendered educational annotation callout cards
 *   4. Optional local microphone audio via navigator.mediaDevices.getUserMedia()
 *
 * Strictly browser-local — zero backend/cloud video encoding services.
 */

export interface RecordingOverlayState {
  presentationTitle: string;
  stepIndex: number;
  stepCount: number;
  stepTitle: string;
  explanation: string;
  annotations: { label: string; detail?: string; tone?: string }[];
  disclosureNote?: string;
}

export type RecordingStatus =
  | 'idle'
  | 'recording'
  | 'paused'
  | 'stopped'
  | 'unsupported'
  | 'error';

export interface VideoRecordingCapability {
  supported: boolean;
  preferredMimeType: string | null;
  fileExtension: 'webm' | 'mp4';
  microphoneApiAvailable: boolean;
  reason?: string;
}

export const CANDIDATE_VIDEO_MIME_TYPES = [
  'video/webm;codecs=vp8,opus',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8',
  'video/webm;codecs=vp9',
  'video/webm',
  'video/mp4',
] as const;

export const CANDIDATE_VIDEO_ONLY_MIME_TYPES = [
  'video/webm;codecs=vp8',
  'video/webm;codecs=vp9',
  'video/webm',
  'video/mp4',
] as const;

export function detectSupportedVideoMimeType(
  mediaRecorderCtor?: typeof MediaRecorder,
  includeAudio = true,
): string | null {
  const ctor =
    mediaRecorderCtor ??
    (typeof MediaRecorder !== 'undefined' ? MediaRecorder : undefined);
  if (!ctor || typeof ctor.isTypeSupported !== 'function') {
    return null;
  }
  const candidates = includeAudio
    ? CANDIDATE_VIDEO_MIME_TYPES
    : CANDIDATE_VIDEO_ONLY_MIME_TYPES;
  for (const mime of candidates) {
    try {
      if (ctor.isTypeSupported(mime)) {
        return mime;
      }
    } catch {
      // Ignore browser-specific codec query errors and continue fallback list
    }
  }
  return null;
}

export function getVideoRecordingCapability(env?: {
  hasMediaRecorder?: boolean;
  mediaRecorderCtor?: typeof MediaRecorder;
  hasCaptureStream?: boolean;
  hasMediaDevices?: boolean;
}): VideoRecordingCapability {
  const hasMediaRecorder =
    env?.hasMediaRecorder ?? typeof MediaRecorder !== 'undefined';

  let hasCaptureStream = env?.hasCaptureStream;
  if (hasCaptureStream === undefined) {
    if (typeof document !== 'undefined') {
      const testCanvas = document.createElement('canvas');
      hasCaptureStream = typeof testCanvas.captureStream === 'function';
    } else {
      hasCaptureStream = false;
    }
  }

  const microphoneApiAvailable =
    env?.hasMediaDevices ??
    (typeof navigator !== 'undefined' &&
      Boolean(navigator.mediaDevices) &&
      typeof navigator.mediaDevices.getUserMedia === 'function');

  if (!hasMediaRecorder || !hasCaptureStream) {
    return {
      supported: false,
      preferredMimeType: null,
      fileExtension: 'webm',
      microphoneApiAvailable,
      reason: !hasMediaRecorder
        ? 'This browser does not support the MediaRecorder API.'
        : 'This browser does not support HTMLCanvasElement.captureStream().',
    };
  }

  const preferredMimeType = detectSupportedVideoMimeType(env?.mediaRecorderCtor);
  const fileExtension: 'webm' | 'mp4' =
    preferredMimeType && preferredMimeType.includes('mp4') ? 'mp4' : 'webm';

  return {
    supported: true,
    preferredMimeType,
    fileExtension,
    microphoneApiAvailable,
  };
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i++) {
    const candidate = `${current} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
      if (lines.length >= maxLines - 1) break;
    }
  }
  lines.push(current);

  if (lines.length > maxLines) {
    lines.length = maxLines;
  }
  return lines;
}

export class PresentationVideoRecorder {
  private compositeCanvas: HTMLCanvasElement | null = null;
  private compositeCtx: CanvasRenderingContext2D | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private canvasStream: MediaStream | null = null;
  private micStream: MediaStream | null = null;
  private combinedStream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private timerId: number | null = null;
  private running = false;
  private objectUrl: string | null = null;
  private mimeType: string = 'video/webm';

  private getSourceCanvas: () => HTMLCanvasElement | null;
  private getOverlay: () => RecordingOverlayState;

  constructor(
    getSourceCanvas: () => HTMLCanvasElement | null,
    getOverlay: () => RecordingOverlayState,
  ) {
    this.getSourceCanvas = getSourceCanvas;
    this.getOverlay = getOverlay;
  }

  public async start(options?: {
    includeMicrophone?: boolean;
    fps?: number;
    width?: number;
    height?: number;
  }): Promise<{ mimeType: string; microphoneActive: boolean; micWarning?: string }> {
    const cap = getVideoRecordingCapability();
    if (!cap.supported) {
      throw new Error(cap.reason || 'Browser video recording is not supported.');
    }

    this.stopStreamsAndLoop();
    this.revokeObjectUrl();
    this.chunks = [];

    const width = options?.width ?? 1280;
    const height = options?.height ?? 720;
    const fps = options?.fps ?? 30;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText =
      'position:fixed;left:-9999px;top:0;width:1px;height:1px;pointer-events:none;opacity:0;';
    if (typeof document !== 'undefined' && document.body) {
      document.body.appendChild(canvas);
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      canvas.remove();
      throw new Error('Could not initialize 2D composition canvas for recording.');
    }
    this.compositeCanvas = canvas;
    this.compositeCtx = ctx;

    // Render initial frame before starting captureStream
    this.drawCompositeFrame();

    const canvasStream = canvas.captureStream(fps);
    this.canvasStream = canvasStream;

    const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];
    let microphoneActive = false;
    let micWarning: string | undefined;

    if (options?.includeMicrophone && cap.microphoneApiAvailable) {
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.micStream = micStream;
        for (const audioTrack of micStream.getAudioTracks()) {
          tracks.push(audioTrack);
        }
        microphoneActive = micStream.getAudioTracks().length > 0;
      } catch {
        micWarning =
          'Microphone permission was denied or unavailable; recording video without audio.';
      }
    }

    const combinedStream = new MediaStream(tracks);
    this.combinedStream = combinedStream;

    const preferredForTracks = detectSupportedVideoMimeType(undefined, microphoneActive);
    const recorderOptions: MediaRecorderOptions = {};
    if (preferredForTracks) {
      recorderOptions.mimeType = preferredForTracks;
      this.mimeType = preferredForTracks;
    } else if (cap.preferredMimeType) {
      recorderOptions.mimeType = cap.preferredMimeType;
      this.mimeType = cap.preferredMimeType;
    } else {
      this.mimeType = 'video/webm';
    }

    const recorder = new MediaRecorder(combinedStream, recorderOptions);
    this.mediaRecorder = recorder;

    recorder.ondataavailable = (ev: BlobEvent) => {
      if (ev.data && ev.data.size > 0) {
        this.chunks.push(ev.data);
      }
    };

    this.running = true;
    recorder.start(250);
    this.startCompositeLoop(fps);

    return {
      mimeType: recorder.mimeType || this.mimeType,
      microphoneActive,
      micWarning,
    };
  }

  public pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  public resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  public stop(): Promise<{ blob: Blob; url: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
      const recorder = this.mediaRecorder;
      if (!recorder || recorder.state === 'inactive') {
        this.stopStreamsAndLoop();
        reject(new Error('No active recording to stop.'));
        return;
      }

      recorder.onstop = () => {
        const finalMime = recorder.mimeType || this.mimeType || 'video/webm';
        const blob = new Blob(this.chunks, { type: finalMime });
        this.stopStreamsAndLoop();
        if (blob.size === 0) {
          reject(new Error('No video frames were captured. Please record for at least 1 second before stopping.'));
          return;
        }
        this.revokeObjectUrl();
        const url = URL.createObjectURL(blob);
        this.objectUrl = url;
        resolve({ blob, url, mimeType: finalMime });
      };

      recorder.onerror = () => {
        this.stopStreamsAndLoop();
        reject(new Error('Video recording encountered an encoding error.'));
      };

      try {
        if (recorder.state === 'recording' && typeof recorder.requestData === 'function') {
          recorder.requestData();
        }
      } catch {
        // Some browsers throw if requestData is called right before stop
      }

      recorder.stop();
    });
  }

  public dispose(): void {
    const recorder = this.mediaRecorder;
    if (recorder) {
      recorder.onstop = null;
      recorder.onerror = null;
      recorder.ondataavailable = null;
      if (recorder.state !== 'inactive') {
        try {
          recorder.stop();
        } catch {
          // Ignore already-stopped errors
        }
      }
    }
    this.stopStreamsAndLoop();
    this.revokeObjectUrl();
    this.chunks = [];
  }

  private startCompositeLoop(fps: number): void {
    if (!this.running) return;
    const targetIntervalMs = Math.max(33, Math.round(1000 / Math.max(10, Math.min(fps, 30))));
    const tick = () => {
      if (!this.running) return;
      const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
      this.drawCompositeFrame();
      const track = this.canvasStream?.getVideoTracks()[0] as
        | (MediaStreamTrack & { requestFrame?: () => void })
        | undefined;
      if (track && typeof track.requestFrame === 'function') {
        try {
          track.requestFrame();
        } catch {
          // Ignore browsers that do not support explicit requestFrame
        }
      }
      const elapsed = typeof performance !== 'undefined' ? performance.now() - t0 : 0;
      const delay = Math.max(16, targetIntervalMs - elapsed);
      this.timerId = window.setTimeout(tick, delay);
    };
    tick();
  }

  private drawCompositeFrame(): void {
    const canvas = this.compositeCanvas;
    const ctx = this.compositeCtx;
    if (!canvas || !ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Studio background matching AnatomyScene clear color
    ctx.fillStyle = '#f4f6f8';
    ctx.fillRect(0, 0, w, h);

    // 1. Composite live WebGL canvas preserving aspect ratio (cover/contain fit)
    const source = this.getSourceCanvas();
    if (source && source.width > 0 && source.height > 0) {
      const srcAspect = source.width / source.height;
      const dstAspect = w / h;
      let drawW = w;
      let drawH = h;
      let dx = 0;
      let dy = 0;

      if (srcAspect > dstAspect) {
        drawH = h;
        drawW = h * srcAspect;
        dx = (w - drawW) / 2;
      } else {
        drawW = w;
        drawH = w / srcAspect;
        dy = (h - drawH) / 2;
      }
      try {
        ctx.drawImage(source, dx, dy, drawW, drawH);
      } catch {
        // Ignore transient WebGL frame read errors
      }
    }

    const overlay = this.getOverlay();

    // 2. Top educational header bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.84)';
    ctx.fillRect(0, 0, w, 58);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 13px system-ui, -apple-system, sans-serif';
    ctx.fillText('ANATOMY 360  •  GUIDED 3D PRESENTATION', 24, 23);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 18px system-ui, -apple-system, sans-serif';
    ctx.fillText(overlay.presentationTitle, 24, 46);

    const stepBadge = `Step ${overlay.stepIndex + 1} / ${Math.max(1, overlay.stepCount)}`;
    ctx.font = '600 14px system-ui, -apple-system, sans-serif';
    const badgeW = ctx.measureText(stepBadge).width + 24;
    ctx.fillStyle = '#0f766e';
    ctx.fillRect(w - badgeW - 24, 15, badgeW, 28);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(stepBadge, w - badgeW - 12, 34);

    // 3. Right-side annotation callout cards (up to 4)
    const annotations = overlay.annotations.slice(0, 4);
    if (annotations.length > 0) {
      const cardW = 310;
      const cardX = w - cardW - 24;
      let cardY = 78;

      for (const ann of annotations) {
        const detailLines = ann.detail
          ? wrapTextLines(ctx, ann.detail, cardW - 28, 2)
          : [];
        const cardH = 34 + detailLines.length * 16 + (detailLines.length > 0 ? 8 : 0);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.80)';
        ctx.fillRect(cardX, cardY, cardW, cardH);

        // Tone accent bar
        const accent =
          ann.tone === 'vessel'
            ? '#ef4444'
            : ann.tone === 'nerve'
              ? '#eab308'
              : ann.tone === 'clinical'
                ? '#f97316'
                : ann.tone === 'warning'
                  ? '#f59e0b'
                  : '#14b8a6';
        ctx.fillStyle = accent;
        ctx.fillRect(cardX, cardY, 4, cardH);

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 13px system-ui, -apple-system, sans-serif';
        ctx.fillText(ann.label, cardX + 14, cardY + 21);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '400 12px system-ui, -apple-system, sans-serif';
        detailLines.forEach((line, i) => {
          ctx.fillText(line, cardX + 14, cardY + 39 + i * 16);
        });

        cardY += cardH + 10;
      }
    }

    // 4. Bottom educational caption & disclosure bar
    const captionH = overlay.disclosureNote ? 124 : 100;
    const captionY = h - captionH;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.86)';
    ctx.fillRect(0, captionY, w, captionH);

    ctx.fillStyle = '#5eead4';
    ctx.font = '700 16px system-ui, -apple-system, sans-serif';
    ctx.fillText(overlay.stepTitle, 24, captionY + 28);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '400 14px system-ui, -apple-system, sans-serif';
    const captionLines = wrapTextLines(ctx, overlay.explanation, w - 48, 2);
    captionLines.forEach((line, i) => {
      ctx.fillText(line, 24, captionY + 52 + i * 20);
    });

    if (overlay.disclosureNote) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = '600 11px system-ui, -apple-system, sans-serif';
      const discLines = wrapTextLines(ctx, overlay.disclosureNote, w - 48, 1);
      if (discLines[0]) {
        ctx.fillText(discLines[0], 24, captionY + 108);
      }
    }
  }

  private stopStreamsAndLoop(): void {
    this.running = false;
    if (this.timerId !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    const streams = [this.canvasStream, this.micStream, this.combinedStream];
    for (const stream of streams) {
      if (stream) {
        for (const track of stream.getTracks()) {
          try {
            track.stop();
          } catch {
            // Ignore track stop errors
          }
        }
      }
    }
    this.canvasStream = null;
    this.micStream = null;
    this.combinedStream = null;
    this.mediaRecorder = null;
    if (this.compositeCanvas) {
      try {
        this.compositeCanvas.remove();
      } catch {
        // Ignore DOM removal errors
      }
      this.compositeCanvas = null;
      this.compositeCtx = null;
    }
  }

  private revokeObjectUrl(): void {
    if (this.objectUrl && typeof URL !== 'undefined') {
      try {
        URL.revokeObjectURL(this.objectUrl);
      } catch {
        // Ignore revoke errors
      }
      this.objectUrl = null;
    }
  }
}
