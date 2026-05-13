import { ApiError } from '../../utils/ApiError.js';

/**
 * Future: validate `appointments.status = completed`, client ownership, single review per appointment.
 */
export async function createReviewForCompletedAppointment(): Promise<never> {
  throw ApiError.notImplemented(
    'Reviews are not implemented yet. Requires a completed appointment owned by the client.',
    'REVIEWS_TODO',
  );
}
