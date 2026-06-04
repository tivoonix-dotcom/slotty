export const DELETION_REQUEST_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'] as const;
export type DeletionRequestStatus = (typeof DELETION_REQUEST_STATUSES)[number];

export type AccountDeletionRequestDto = {
  id: string;
  userId: string;
  status: DeletionRequestStatus;
  message: string;
  requestedAt: string;
  processedAt: string | null;
  processedBy: string | null;
  adminNote: string | null;
};

export type AccountDeletionRequestAdminDto = AccountDeletionRequestDto & {
  userFullName: string;
  userEmail: string | null;
  userRole: string;
  accountStatus: string;
  masterDisplayName: string | null;
};
