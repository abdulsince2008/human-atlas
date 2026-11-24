import type { Atlas } from '../anatomy';
import type { CanonicalSystemId } from '../anatomy-systems';
import PracticalLabWorkspace from '../components/PracticalLabWorkspace';

interface Props {
  atlas: Atlas | null;
  atlasError?: string;
  initialSystemId?: CanonicalSystemId | null;
  onInspectConcept: (conceptId: string) => void;
  onOpenLearnSystem: (systemId: CanonicalSystemId) => void;
}

export default function PracticalLabPage({
  atlas,
  atlasError,
  initialSystemId,
  onInspectConcept,
  onOpenLearnSystem,
}: Props) {
  return (
    <PracticalLabWorkspace
      atlas={atlas}
      atlasError={atlasError}
      initialSystemId={initialSystemId}
      onInspectConcept={onInspectConcept}
      onOpenLearnSystem={onOpenLearnSystem}
    />
  );
}
