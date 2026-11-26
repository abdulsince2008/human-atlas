import type { Atlas } from '../anatomy';
import type { CanonicalSystemId } from '../anatomy-systems';
import PracticalLabWorkspace from '../components/PracticalLabWorkspace';
import type { StudyContextInput } from '../study-context-engine';

interface Props {
  atlas: Atlas | null;
  atlasError?: string;
  initialSystemId?: CanonicalSystemId | null;
  onInspectConcept: (conceptId: string) => void;
  onOpenLearnSystem: (systemId: CanonicalSystemId) => void;
  onOpenStudyContext?: (input: StudyContextInput) => void;
}

export default function PracticalLabPage({
  atlas,
  atlasError,
  initialSystemId,
  onInspectConcept,
  onOpenLearnSystem,
  onOpenStudyContext,
}: Props) {
  return (
    <PracticalLabWorkspace
      atlas={atlas}
      atlasError={atlasError}
      initialSystemId={initialSystemId}
      onInspectConcept={onInspectConcept}
      onOpenLearnSystem={onOpenLearnSystem}
      onOpenStudyContext={onOpenStudyContext}
    />
  );
}
