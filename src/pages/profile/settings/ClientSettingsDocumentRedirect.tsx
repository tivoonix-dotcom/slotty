import { Navigate, useParams } from 'react-router-dom';
import { PROFILE_SETTINGS_DOCUMENTS_PATH } from '../../../app/paths';
import { LEGAL_DOCUMENTS, type LegalDocId } from '../../../constants/legalDocuments';
import { getLegalDocumentPagePath } from '../../../constants/legalDocumentPaths';

/** Редирект со старых URL /profile/settings/documents/:docId на legal-страницы. */
export function ClientSettingsDocumentRedirect() {
  const { docId } = useParams<{ docId: string }>();
  const known = LEGAL_DOCUMENTS.find((d) => d.id === docId);

  if (!known || !docId) {
    return <Navigate to={PROFILE_SETTINGS_DOCUMENTS_PATH} replace />;
  }

  return <Navigate to={getLegalDocumentPagePath(docId as LegalDocId)} replace />;
}
