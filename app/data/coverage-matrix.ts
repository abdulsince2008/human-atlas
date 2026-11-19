import type { Atlas } from '../anatomy';
import { CANONICAL_SYSTEMS, canonicalSystemForMeshSystem, type CanonicalSystemId } from '../anatomy-systems';

export type GeometryCoverageTier =
  | 'real_individual_meshes'
  | 'partial_mesh_coverage'
  | 'male_reference_only'
  | 'surface_reference_only';

export interface SystemCoverageRow {
  systemId: CanonicalSystemId;
  name: string;
  meshCount: number;
  uniqueConceptCount: number;
  bilateralPairedCount: number;
  totalTriangles: number;
  geometryStatus: GeometryCoverageTier;
  honestLimitationNote: string;
}

const SYSTEM_LIMITATIONS: Record<CanonicalSystemId, { status: GeometryCoverageTier; note: string }> = {
  skeletal: {
    status: 'real_individual_meshes',
    note: 'Individual bones across axial and appendicular skeleton; micro-foramina and trabecular interior are not modeled.',
  },
  muscular: {
    status: 'real_individual_meshes',
    note: 'Major skeletal muscles and primary tendons present; fine fascial compartments and deformable contraction rigs are absent.',
  },
  nervous: {
    status: 'partial_mesh_coverage',
    note: '123 verified brain/CNS meshes (gyri, cerebellum, brainstem, ventricles, optic nerves); arachnoid/pia mater, falx cerebri, and lower cranial nerve cisterns are absent.',
  },
  cardiovascular: {
    status: 'real_individual_meshes',
    note: 'Heart chambers, great vessels, and major systemic arteries/veins modeled; microvascular capillary beds and fine coronary sub-branches are absent.',
  },
  respiratory: {
    status: 'real_individual_meshes',
    note: 'Larynx, trachea, main bronchi, and pulmonary lobes modeled; microscopic alveolar parenchyma and separate visceral/parietal pleura sheets are absent.',
  },
  digestive: {
    status: 'real_individual_meshes',
    note: 'GI tract and accessory glands (liver, gallbladder, pancreas) modeled; peritoneal reflections and mesenteries are conceptual only.',
  },
  urinary: {
    status: 'partial_mesh_coverage',
    note: 'Gross kidneys, ureters, and urinary bladder modeled; intrarenal nephron microarchitecture is separate histology/physiology curriculum.',
  },
  reproductive: {
    status: 'male_reference_only',
    note: 'Adult male reproductive structures only (BodyParts3D 4.0); authentic licensed adult female reference pack is not bundled.',
  },
  endocrine: {
    status: 'partial_mesh_coverage',
    note: 'Pituitary, thyroid, adrenal, and pancreatic gross organs present; parathyroid micro-glands and cellular islets are conceptual only.',
  },
  lymphatic: {
    status: 'partial_mesh_coverage',
    note: 'Spleen, thymus, and select thoracic/lymphoid references present; comprehensive regional lymph-node chains are not fully meshed.',
  },
  integumentary: {
    status: 'surface_reference_only',
    note: 'Outer body surface envelope only; epidermal/dermal layers, hair follicles, and sweat glands are covered in histology curriculum.',
  },
  sensory: {
    status: 'partial_mesh_coverage',
    note: 'Ocular and orbital structures modeled; inner-ear cochlea/vestibular ossicles and olfactory epithelium require specialist asset packs.',
  },
};

/**
 * Computes a truthful, real-time 12-system anatomical coverage matrix directly from atlas.json.
 * Never counts concept-only curriculum labels as 3D meshes.
 */
export function buildAnatomyCoverageMatrix(atlas: Atlas): SystemCoverageRow[] {
  const buckets = new Map<
    CanonicalSystemId,
    { meshes: number; concepts: Set<string>; bilateral: number; tris: number }
  >(
    CANONICAL_SYSTEMS.map((s) => [
      s.id,
      { meshes: 0, concepts: new Set<string>(), bilateral: 0, tris: 0 },
    ]),
  );

  for (const part of atlas.parts) {
    const sysObj = canonicalSystemForMeshSystem(part.system);
    const b = buckets.get(sysObj.id);
    if (!b) continue;
    b.meshes++;
    b.concepts.add(part.conceptId);
    if (/\b(left|right)\b/i.test(part.name)) b.bilateral++;
    b.tris += Math.floor(part.indexCount / 3);
  }

  return CANONICAL_SYSTEMS.map((sys) => {
    const b = buckets.get(sys.id)!;
    const lim = SYSTEM_LIMITATIONS[sys.id];
    return {
      systemId: sys.id,
      name: sys.name.en,
      meshCount: b.meshes,
      uniqueConceptCount: b.concepts.size,
      bilateralPairedCount: b.bilateral,
      totalTriangles: b.tris,
      geometryStatus: lim.status,
      honestLimitationNote: lim.note,
    };
  });
}
