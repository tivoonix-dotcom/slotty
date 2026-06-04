import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { requireProfileMutation } from '../../middlewares/profileAccountAccess.js';
import {
  cancelMyAccountDeletionRequest,
  createAccountDeletionRequest,
  getMyAccountDeletionRequest,
} from './accountDeletion.service.js';
import { createDeletionRequestBodySchema } from './accountDeletion.validation.js';

export const accountDeletionRouter = Router();

accountDeletionRouter.use(authMiddleware, requireProfileMutation);

accountDeletionRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ request: await getMyAccountDeletionRequest(req.user!.id) });
  }),
);

accountDeletionRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = createDeletionRequestBodySchema.parse(req.body);
    const request = await createAccountDeletionRequest(req.user!.id, body.message ?? '');
    res.status(201).json({ request });
  }),
);

accountDeletionRouter.post(
  '/cancel',
  asyncHandler(async (req, res) => {
    res.json({ request: await cancelMyAccountDeletionRequest(req.user!.id) });
  }),
);
