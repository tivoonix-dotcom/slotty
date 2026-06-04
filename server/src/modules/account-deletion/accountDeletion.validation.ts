import { z } from 'zod';

export const createDeletionRequestBodySchema = z.object({
  message: z.string().trim().max(2000).optional().default(''),
  confirmIrreversible: z.literal(true, {
    errorMap: () => ({ message: 'Подтвердите, что понимаете необратимость удаления' }),
  }),
});

export const adminProcessDeletionBodySchema = z.object({
  adminNote: z.string().trim().max(2000).optional().nullable(),
});
