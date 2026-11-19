import * as T from 'three';

/**
 * Anatomical Geometry, UV Generation & Validation Utilities
 *
 * BodyParts3D 4.0 binary meshes ship with vertex positions, normals, and triangle indices,
 * but NO UV coordinates. This module generates clean, scale-consistent box/triplanar
 * anatomical UVs (in meters) and validates position, normal, index, and UV integrity.
 *
 * When external glTF/GLB assets already contain valid UVs, those UVs are preserved
 * and validated rather than overwritten.
 */

export interface GeometryValidationResult {
  partId: string;
  valid: boolean;
  hasPositions: boolean;
  hasNormals: boolean;
  hasUVs: boolean;
  uvSource: 'source_mesh' | 'generated_triplanar' | 'missing';
  vertexCount: number;
  triangleCount: number;
  errors: string[];
  warnings: string[];
}

/**
 * Generates seamless scale-consistent triplanar/box-projected UV coordinates
 * based on each vertex's dominant normal axis.
 *
 * @param geometry BufferGeometry with `position` and `normal` attributes.
 * @param tileSizeMeters World-space repeat scale in meters (default 0.08m = 8cm per tile).
 * @returns Float32Array of length vertexCount * 2 written to `geometry.attributes.uv`.
 */
export function generateAnatomicalUVs(
  geometry: T.BufferGeometry,
  tileSizeMeters = 0.08,
): Float32Array {
  const posAttr = geometry.getAttribute('position');
  if (!posAttr) {
    throw new Error('Cannot generate anatomical UVs: geometry is missing position attribute');
  }

  let normAttr = geometry.getAttribute('normal');
  if (!normAttr) {
    geometry.computeVertexNormals();
    normAttr = geometry.getAttribute('normal');
  }

  const count = posAttr.count;
  const invScale = 1 / Math.max(0.005, tileSizeMeters);
  const uvs = new Float32Array(count * 2);

  for (let i = 0; i < count; i++) {
    const px = posAttr.getX(i);
    const py = posAttr.getY(i);
    const pz = posAttr.getZ(i);

    const nx = Math.abs(normAttr ? normAttr.getX(i) : 0);
    const ny = Math.abs(normAttr ? normAttr.getY(i) : 1);
    const nz = Math.abs(normAttr ? normAttr.getZ(i) : 0);

    let u: number;
    let v: number;
    if (nx >= ny && nx >= nz) {
      // X-dominant surface (sagittal/lateral): project onto Z-Y
      u = pz * invScale;
      v = py * invScale;
    } else if (ny >= nx && ny >= nz) {
      // Y-dominant surface (superior/inferior): project onto X-Z
      u = px * invScale;
      v = pz * invScale;
    } else {
      // Z-dominant surface (anterior/posterior): project onto X-Y
      u = px * invScale;
      v = py * invScale;
    }

    uvs[i * 2] = Number.isFinite(u) ? u : 0;
    uvs[i * 2 + 1] = Number.isFinite(v) ? v : 0;
  }

  geometry.setAttribute('uv', new T.BufferAttribute(uvs, 2));
  geometry.userData.uvSource = 'generated_triplanar';
  return uvs;
}

/**
 * Ensures a geometry has valid UV coordinates (preserving source UVs if already valid,
 * otherwise generating triplanar anatomical UVs).
 */
export function ensureAnatomicalUVs(
  geometry: T.BufferGeometry,
  tileSizeMeters = 0.08,
): 'source_mesh' | 'generated_triplanar' {
  const existing = geometry.getAttribute('uv');
  if (existing && existing.count === geometry.getAttribute('position')?.count) {
    let allFinite = true;
    for (let i = 0; i < Math.min(existing.count, 32); i++) {
      if (!Number.isFinite(existing.getX(i)) || !Number.isFinite(existing.getY(i))) {
        allFinite = false;
        break;
      }
    }
    if (allFinite) {
      geometry.userData.uvSource = geometry.userData.uvSource ?? 'source_mesh';
      return geometry.userData.uvSource;
    }
  }
  generateAnatomicalUVs(geometry, tileSizeMeters);
  return 'generated_triplanar';
}

/**
 * Validates anatomical geometry buffers: positions, normals, indices, and UV coordinates.
 */
export function validateAnatomicalGeometry(
  geometry: T.BufferGeometry,
  partId: string,
): GeometryValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const pos = geometry.getAttribute('position');
  const norm = geometry.getAttribute('normal');
  const uv = geometry.getAttribute('uv');
  const index = geometry.getIndex();

  const hasPositions = Boolean(pos && pos.count > 0);
  const hasNormals = Boolean(norm && norm.count > 0);
  const hasUVs = Boolean(uv && uv.count > 0);
  const vertexCount = pos?.count ?? 0;
  const triangleCount = index ? Math.floor(index.count / 3) : Math.floor(vertexCount / 3);

  if (!hasPositions) {
    errors.push(`Part ${partId}: missing or empty position attribute`);
  } else {
    for (let i = 0; i < pos.count; i++) {
      if (
        !Number.isFinite(pos.getX(i)) ||
        !Number.isFinite(pos.getY(i)) ||
        !Number.isFinite(pos.getZ(i))
      ) {
        errors.push(`Part ${partId}: non-finite vertex position at index ${i}`);
        break;
      }
    }
  }

  if (!hasNormals) {
    errors.push(`Part ${partId}: missing normal attribute`);
  } else if (norm.count !== vertexCount) {
    errors.push(`Part ${partId}: normal count (${norm.count}) != vertex count (${vertexCount})`);
  } else {
    let degenerateNormals = 0;
    for (let i = 0; i < norm.count; i++) {
      const nx = norm.getX(i);
      const ny = norm.getY(i);
      const nz = norm.getZ(i);
      if (!Number.isFinite(nx) || !Number.isFinite(ny) || !Number.isFinite(nz)) {
        errors.push(`Part ${partId}: non-finite normal at index ${i}`);
        break;
      }
      const lenSq = nx * nx + ny * ny + nz * nz;
      if (lenSq < 1e-6) degenerateNormals++;
    }
    if (degenerateNormals > norm.count * 0.25) {
      warnings.push(`Part ${partId}: ${degenerateNormals} degenerate zero-length normals`);
    }
  }

  if (index) {
    if (index.count % 3 !== 0) {
      errors.push(`Part ${partId}: index count ${index.count} is not divisible by 3`);
    }
  } else if (vertexCount % 3 !== 0) {
    errors.push(`Part ${partId}: non-indexed vertex count ${vertexCount} is not divisible by 3`);
  }

  if (!hasUVs) {
    errors.push(`Part ${partId}: missing UV attribute`);
  } else if (uv.count !== vertexCount) {
    errors.push(`Part ${partId}: UV count (${uv.count}) != vertex count (${vertexCount})`);
  } else {
    for (let i = 0; i < uv.count; i++) {
      if (!Number.isFinite(uv.getX(i)) || !Number.isFinite(uv.getY(i))) {
        errors.push(`Part ${partId}: non-finite UV coordinate at index ${i}`);
        break;
      }
    }
  }

  const uvSource: GeometryValidationResult['uvSource'] = !hasUVs
    ? 'missing'
    : (geometry.userData.uvSource as 'source_mesh' | 'generated_triplanar' | undefined) ?? 'source_mesh';

  return {
    partId,
    valid: errors.length === 0,
    hasPositions,
    hasNormals,
    hasUVs,
    uvSource,
    vertexCount,
    triangleCount,
    errors,
    warnings,
  };
}
