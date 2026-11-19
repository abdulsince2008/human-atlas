import type { RenderQualityPresetId } from '../tissue-materials';

/**
 * Runtime Anatomical Level-of-Detail (LOD) Controller
 *
 * Manages real switching between full-resolution BodyParts3D meshes (LOD 0: 2,288,268 tris)
 * and validated meshoptimizer overview meshes (LOD 3: /models/atlas.lod3.json) based on
 * camera distance, active quality preset, and close-up/isolation context.
 *
 * Enforces hysteresis bands so zooming near the threshold never causes visual popping/thrashing,
 * and NEVER pretends a LOD asset exists unless it has actually been loaded and verified.
 */

export type RuntimeLodLevel = 0 | 3;

export interface LodTelemetry {
  activeLevel: RuntimeLodLevel;
  lod3Available: boolean;
  lod0Triangles: number;
  lod3Triangles: number;
  activeTriangles: number;
  switchCount: number;
}

export interface LodDecisionInput {
  cameraDistance: number;
  qualityPreset: RenderQualityPresetId;
  lod3Available: boolean;
  isIsolatedOrCloseFocus: boolean;
  isExploded: boolean;
}

export class AnatomicalLodManager {
  private activeLevel: RuntimeLodLevel = 0;
  private lod3Available = false;
  private lod0Triangles: number;
  private lod3Triangles = 0;
  private switchCount = 0;

  constructor(lod0Triangles: number) {
    this.lod0Triangles = lod0Triangles;
  }

  public registerLod3(triangles: number): void {
    if (triangles > 0) {
      this.lod3Available = true;
      this.lod3Triangles = triangles;
    }
  }

  /**
   * Evaluates target LOD level with hysteresis band to avoid rapid toggling.
   * Returns `{ level, changed }`.
   */
  public evaluate(input: LodDecisionInput): { level: RuntimeLodLevel; changed: boolean } {
    if (!this.lod3Available || !input.lod3Available) {
      const changed = this.activeLevel !== 0;
      this.activeLevel = 0;
      return { level: 0, changed };
    }

    // Always use full LOD 0 detail for Ultra preset, isolated organ inspection, or active explosion
    if (input.qualityPreset === 'ultra' || input.isIsolatedOrCloseFocus || input.isExploded) {
      const changed = this.activeLevel !== 0;
      if (changed) {
        this.activeLevel = 0;
        this.switchCount++;
      }
      return { level: 0, changed };
    }

    // Hysteresis thresholds in meters by hardware quality tier
    const thresholds: Record<
      Exclude<RenderQualityPresetId, 'ultra'>,
      { toLow: number; toHigh: number }
    > = {
      performance: { toLow: 1.55, toHigh: 1.25 },
      balanced: { toLow: 2.65, toHigh: 2.25 },
      high: { toLow: 3.6, toHigh: 3.15 },
    };

    const band = thresholds[input.qualityPreset];
    let next: RuntimeLodLevel = this.activeLevel;

    if (this.activeLevel === 0 && input.cameraDistance >= band.toLow) {
      next = 3;
    } else if (this.activeLevel === 3 && input.cameraDistance <= band.toHigh) {
      next = 0;
    }

    const changed = next !== this.activeLevel;
    if (changed) {
      this.activeLevel = next;
      this.switchCount++;
    }
    return { level: next, changed };
  }

  public getTelemetry(): LodTelemetry {
    return {
      activeLevel: this.activeLevel,
      lod3Available: this.lod3Available,
      lod0Triangles: this.lod0Triangles,
      lod3Triangles: this.lod3Triangles,
      activeTriangles: this.activeLevel === 3 && this.lod3Available ? this.lod3Triangles : this.lod0Triangles,
      switchCount: this.switchCount,
    };
  }
}
