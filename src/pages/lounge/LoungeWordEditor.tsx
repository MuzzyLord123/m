import { useParams } from 'react-router-dom';
import { WordEditor } from '@/components/office/WordEditor';

export default function LoungeWordEditor() {
  const { docId } = useParams<{ docId: string }>();
  if (!docId) return null;
  return <WordEditor documentId={docId} />;
}
