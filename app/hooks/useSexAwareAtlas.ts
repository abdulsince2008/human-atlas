import { useEffect, useMemo, useState } from 'react';
import type { Atlas } from '../anatomy';
import {
  getActiveConceptsForSex,
  getActivePartsForSex,
  loadFemaleAtlasManifest,
  loadMaleEnhancementsManifest,
  loadSharedEnhancementsManifest,
  type AnatomySex,
  type FemaleAtlasManifest,
  type OverlayManifest,
} from '../atlas-layers';

export interface SexAwareAtlasResult {
  effectiveAtlas: Atlas | null;
  femaleOverlay: FemaleAtlasManifest | null;
  sharedOverlay: OverlayManifest | null;
  maleOverlay: OverlayManifest | null;
  overlaysLoaded: boolean;
}

/**
 * Resolves the active Male or Female Atlas (including Shared, Male, and Female HuBMAP overlays)
 * using cached manifest loaders in atlas-layers.ts so every workspace sees consistent structures.
 */
export function useSexAwareAtlas(baseAtlas: Atlas | null, sex: AnatomySex): SexAwareAtlasResult {
  const [sharedOverlay, setSharedOverlay] = useState<OverlayManifest | null>(null);
  const [maleOverlay, setMaleOverlay] = useState<OverlayManifest | null>(null);
  const [femaleOverlay, setFemaleOverlay] = useState<FemaleAtlasManifest | null>(null);
  const [overlaysLoaded, setOverlaysLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      loadSharedEnhancementsManifest(),
      loadMaleEnhancementsManifest(),
      loadFemaleAtlasManifest(),
    ]).then(([sharedRes, maleRes, femaleRes]) => {
      if (!active) return;
      if (sharedRes.status === 'fulfilled') setSharedOverlay(sharedRes.value);
      if (maleRes.status === 'fulfilled') setMaleOverlay(maleRes.value);
      if (femaleRes.status === 'fulfilled') setFemaleOverlay(femaleRes.value);
      setOverlaysLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const effectiveAtlas = useMemo<Atlas | null>(() => {
    if (!baseAtlas) return null;
    const parts = getActivePartsForSex(baseAtlas, femaleOverlay, sex, {
      shared: sharedOverlay,
      male: maleOverlay,
    });
    const concepts = getActiveConceptsForSex(baseAtlas, femaleOverlay, sex, {
      shared: sharedOverlay,
      male: maleOverlay,
    });
    return {
      ...baseAtlas,
      sex,
      parts,
      concepts,
    };
  }, [baseAtlas, femaleOverlay, sharedOverlay, maleOverlay, sex]);

  return {
    effectiveAtlas,
    femaleOverlay,
    sharedOverlay,
    maleOverlay,
    overlaysLoaded,
  };
}
