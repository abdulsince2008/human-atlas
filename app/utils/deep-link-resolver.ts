import type { CanonicalSystemId } from '../anatomy-systems';
import { CLINICAL_CASES, type ClinicalCaseStudy } from '../data/clinical-data';
import { HISTOLOGY_ENTRIES, type HistologyEntry } from '../data/histology-data';
import { PHYSIOLOGY_MODULES, type PhysiologyModuleSpec } from '../data/physiology-data';

export function resolvePhysiologyTarget(
  moduleId?: string | null,
  systemId?: string | null,
): PhysiologyModuleSpec['id'] {
  if (moduleId) {
    const exact = PHYSIOLOGY_MODULES.find((m) => m.id === moduleId);
    if (exact) return exact.id;
  }
  if (systemId) {
    const bySys = PHYSIOLOGY_MODULES.find((m) => m.systemId === (systemId as CanonicalSystemId));
    if (bySys) return bySys.id;
  }
  return PHYSIOLOGY_MODULES[0].id;
}

export function resolveClinicalCaseTarget(
  caseId?: string | null,
  systemId?: string | null,
): ClinicalCaseStudy {
  if (caseId) {
    const exact = CLINICAL_CASES.find((c) => c.id === caseId);
    if (exact) return exact;
  }
  if (systemId) {
    const bySys = CLINICAL_CASES.find((c) => c.systemId === (systemId as CanonicalSystemId));
    if (bySys) return bySys;
  }
  return CLINICAL_CASES[0];
}

export function resolveHistologyTarget(
  entryId?: string | null,
  systemId?: string | null,
): HistologyEntry {
  if (entryId) {
    const exact = HISTOLOGY_ENTRIES.find((h) => h.id === entryId);
    if (exact) return exact;
  }
  if (systemId) {
    const bySys = HISTOLOGY_ENTRIES.find((h) => h.canonicalSystem === (systemId as CanonicalSystemId));
    if (bySys) return bySys;
  }
  return HISTOLOGY_ENTRIES[0];
}
