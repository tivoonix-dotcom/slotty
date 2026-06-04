export type PlatformAdminOverview = {
  usersTotal: number;
  clientsTotal: number;
  mastersTotal: number;
  activeMastersTotal: number;
  pendingCategoryRequests: number;
  pendingSponsorRequests: number;
  blockedUsers: number;
  bookingsToday: number;
  cancellationsLast7Days: number;
};

export type SupportTicketAdmin = {
  id: string;
  ticketCode: string;
  userId: string;
  masterProfileId: string | null;
  plan: string | null;
  category: string;
  severity: string;
  subject: string;
  status: string;
  message: string;
  contactEmail: string | null;
  masterName: string | null;
  userEmail: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: string | null;
};

export type SupportTicketAdminDetail = SupportTicketAdmin & {
  affectedServices: string[];
  relatedBookingCode: string | null;
  relatedPaymentId: string | null;
  preferredContactChannel: string;
  metadata: Record<string, unknown>;
  events: Array<{
    id: string;
    eventType: string;
    actorRole: string;
    message: string | null;
    createdAt: string;
  }>;
  attachments: Array<{ id: string; fileName: string; mimeType: string; sizeBytes: number }>;
};

export type SponsorRequestAdmin = {
  id: string;
  status: 'pending' | 'in_review' | 'closed' | 'rejected';
  contactName: string;
  phone: string;
  email: string | null;
  companyName: string | null;
  city: string | null;
  message: string;
  adminComment: string | null;
  createdAt: string;
  reviewedAt: string | null;
  masterId: string;
  masterName: string;
  profileUrl: string;
};

export type AccountDeletionRequestAdmin = {
  id: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  message: string;
  requestedAt: string;
  processedAt: string | null;
  processedBy: string | null;
  adminNote: string | null;
  userFullName: string;
  userEmail: string | null;
  userRole: string;
  accountStatus: string;
  masterDisplayName: string | null;
};

export type ProfileReportAdmin = {
  id: string;
  status: 'pending' | 'in_review' | 'closed' | 'rejected';
  reasonCode: string;
  reasonText: string | null;
  adminComment: string | null;
  createdAt: string;
  reviewedAt: string | null;
  masterId: string;
  masterName: string;
  profileUrl: string;
  reporterId: string | null;
  reporterName: string | null;
};

export type CategoryChangeRequestAdmin = {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  adminComment: string | null;
  createdAt: string;
  reviewedAt: string | null;
  masterId: string;
  masterName: string;
  profileUrl: string;
  currentCategory: { id: string; code: string; name: string } | null;
  requestedCategory: { id: string; code: string; name: string };
  activity: {
    servicesCount: number;
    activeWindowsCount: number;
    futureBookingsCount: number;
    reviewsCount: number;
  };
};

export type PlatformUserListItem = {
  id: string;
  fullName: string;
  role: string;
  accountStatus: string;
  phone: string | null;
  email: string | null;
  telegramUsername: string | null;
  createdAt: string;
  hasMasterProfile: boolean;
  appointmentsCount: number;
};

export type PlatformUserAuthIdentity = {
  provider: 'telegram' | 'google' | 'email';
  providerUserId: string;
  email: string | null;
  emailVerified: boolean;
  linkedAt: string;
};

export type PlatformUserEmailConflict = {
  id: string;
  fullName: string;
  role: string;
};

export type PlatformUserSecurityEvent = {
  id: string;
  action: string;
  createdAt: string;
  metadata: Record<string, unknown> | null;
};

export type PlatformUserDetail = PlatformUserListItem & {
  blockedAt: string | null;
  blockedReason: string | null;
  accessRestrictedUntil: string | null;
  accessRestrictionReason: string | null;
  identities: PlatformUserAuthIdentity[];
  emailConflicts: PlatformUserEmailConflict[];
  securityEvents?: PlatformUserSecurityEvent[];
};

export type PlatformMasterListItem = {
  masterId: string;
  displayName: string;
  slug: string | null;
  profileUrl: string;
  categoryName: string | null;
  publicationStatus: string;
  isVerified: boolean;
  planCode: string;
  planName: string;
  servicesCount: number;
  slotsCount: number;
  appointmentsCount: number;
  reviewsCount: number;
  ratingAvg: number;
  createdAt: string;
  hasPendingCategoryRequest: boolean;
};

export type PlatformMasterPickerItem = {
  masterId: string;
  displayName: string;
  planCode: string;
};

export type PlatformMasterBillingEvent = {
  id: string;
  eventType: string;
  planCode: string | null;
  billingPeriod: string | null;
  amount: number | null;
  currency: string;
  status: string;
  source: string;
  errorMessage: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type PlatformMasterDetail = PlatformMasterListItem & {
  phone: string | null;
  email: string | null;
  telegramUsername: string | null;
  adminHiddenReason: string | null;
  adminPauseReason: string | null;
  masterPlan: string;
  proInterested: boolean;
  proStatus: string | null;
  proStartedAt: string | null;
  proExpiresAt: string | null;
  publishedAt: string | null;
  subscription: {
    id: string;
    status: string;
    billingPeriod: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    planCode: string;
    planName: string;
    priceMonth: number;
    priceYear: number;
    usage: { activeServices: number; monthlyAppointments: number };
  } | null;
  billingEvents: PlatformMasterBillingEvent[];
};

export type PlatformServiceListItem = {
  id: string;
  title: string;
  masterId: string;
  masterName: string;
  categoryName: string | null;
  priceAmount: number;
  durationMinutes: number;
  isActive: boolean;
  isAdminHidden: boolean;
  adminHiddenAt: string | null;
  adminHiddenReason: string | null;
  createdAt: string;
  appointmentsCount: number;
};

export type PlatformBookingListItem = {
  id: string;
  bookingCode: string | null;
  clientId: string;
  clientName: string;
  clientAccountStatus: string;
  masterId: string;
  masterName: string;
  serviceTitle: string;
  startsAt: string;
  endsAt: string;
  status: string;
  cancelledBy: 'client' | 'master' | null;
  priceSnapshot: number;
  createdAt: string;
  updatedAt: string;
  cancelReason: string | null;
  clientNote: string | null;
};

export type PlatformBookingDetail = PlatformBookingListItem & {
  clientEmail: string | null;
  clientPhone: string | null;
  clientTelegramUsername: string | null;
  clientStats: {
    totalBookings: number;
    cancellationsByClient: number;
    cancellationsByMaster: number;
    noShows: number;
    completed: number;
  };
  recentBookings: PlatformBookingListItem[];
};

export type PlatformClientBookingStats = {
  clientId: string;
  fullName: string;
  accountStatus: string;
  email: string | null;
  totalBookings: number;
  cancellationsByClient: number;
  cancellationsByMaster: number;
  noShows: number;
  completed: number;
  lastBookingAt: string | null;
  lastCancellationAt: string | null;
};

export type PromoCodeAdmin = {
  id: string;
  code: string;
  title: string | null;
  discountPercent: number;
  appliesToPlan: string;
  billingPeriod: 'month' | 'year' | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
};

export type PlatformPurchaseRow = {
  id: string;
  masterId: string;
  masterName: string;
  eventType: string;
  planCode: string | null;
  billingPeriod: string | null;
  amount: number | null;
  currency: string;
  status: string;
  source: string;
  promoCode: string | null;
  baseAmount: number | null;
  discountAmount: number | null;
  createdAt: string;
};

export type PlatformPurchasesSummary = {
  totalRevenue: number;
  purchasesCount: number;
  withPromoCount: number;
  totalDiscountGiven: number;
  revenueThisMonth: number;
  purchasesThisMonth: number;
};

export type ProManualPaymentRequestAdmin = {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  payerFullName: string;
  tariffAmount: number;
  declaredPaidAmount: number;
  receivedAmount: number | null;
  bankFeeAmount: number | null;
  feeCoveredBy: string;
  currency: string;
  billingPeriod: 'month' | 'year';
  paidAt: string | null;
  paymentComment: string;
  receiptUrl: string | null;
  receiptFilePath: string | null;
  adminNote: string | null;
  rejectionReason: string | null;
  taxReceiptCreated: boolean;
  taxReceiptNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  masterId: string;
  masterName: string;
  profileUrl: string;
};

export type PlatformAuditLogItem = {
  id: string;
  adminUserId: string;
  adminName: string;
  action: string;
  entityType: string;
  entityId: string;
  targetUserId: string | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type EmailCampaignAudience =
  | 'newsletter_subscribers'
  | 'masters'
  | 'clients'
  | 'all_profiles'
  | 'test_only';

export type EmailCampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled' | 'failed';

export type EmailCampaignAdmin = {
  id: string;
  title: string;
  subject: string;
  previewText: string | null;
  bodyHtml: string;
  bodyText: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
  audience: EmailCampaignAudience;
  status: EmailCampaignStatus;
  createdByProfileId: string | null;
  createdAt: string;
  updatedAt: string;
  scheduledAt: string | null;
  sentAt: string | null;
  cancelledAt: string | null;
};

export type EmailCampaignRecipientAdmin = {
  id: string;
  campaignId: string;
  email: string;
  profileId: string | null;
  subscriberId: string | null;
  status: string;
  sentAt: string | null;
  failedAt: string | null;
  errorMessage: string | null;
  resendMessageId: string | null;
  createdAt: string;
};

export type NewsletterSubscriberAdmin = {
  id: string;
  email: string;
  status: string;
  source: string;
  subscribedAt: string;
  unsubscribedAt: string | null;
};

export type NotificationDeliveryAdmin = {
  id: string;
  notificationId: string | null;
  profileId: string;
  channel: string;
  status: string;
  dedupeKey: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  failedAt: string | null;
  createdAt: string;
  fullName: string;
  email: string | null;
};

export type AppointmentReminderFailureAdmin = {
  appointmentId: string;
  reminderKind: string;
  status: string;
  failedAt: string | null;
  errorMessage: string | null;
  retryCount: number;
  fullName: string;
  email: string | null;
};
