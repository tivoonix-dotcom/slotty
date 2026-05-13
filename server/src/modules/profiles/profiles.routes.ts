import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { getProfileById, updateProfile } from './profiles.service.js';
import { uploadProfileAvatar } from './profiles.storage.js';

export const profilesRouter = Router();

profilesRouter.use(authMiddleware);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

const patchMe = z.object({
  full_name: z.string().min(1).max(200).optional(),
  avatar_url: z.union([z.string().min(1).max(2048), z.null()]).optional(),
});

profilesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const profile = await getProfileById(req.user!.id);
    res.json(profile);
  }),
);

/** multipart field name: `file` (JPEG / PNG / WebP, до 2 MB). */
profilesRouter.post(
  '/avatar',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file?.buffer?.length) {
      throw ApiError.badRequest('Missing image file (multipart field: file)', 'MISSING_FILE');
    }
    const publicUrl = await uploadProfileAvatar(req.user!.id, file.buffer, file.mimetype);
    const profile = await updateProfile(req.user!.id, { avatar_url: publicUrl });
    res.json(profile);
  }),
);

profilesRouter.patch(
  '/',
  asyncHandler(async (req, res) => {
    const body = patchMe.parse(req.body);
    const profile = await updateProfile(req.user!.id, {
      full_name: body.full_name,
      avatar_url: body.avatar_url,
    });
    res.json(profile);
  }),
);
