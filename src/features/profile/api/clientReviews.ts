import { apiFetch } from '../../../shared/api/backendClient';
import { readSlottyApiErrorMessage } from '../../../shared/api/slottyApiErrorMessage';

export async function postClientReview(
  appointmentId: string,
  rating: number,
  body: string,
): Promise<void> {
  const res = await apiFetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appointmentId, rating, body }),
  });
  if (!res.ok) {
    throw new Error(await readSlottyApiErrorMessage(res));
  }
}
