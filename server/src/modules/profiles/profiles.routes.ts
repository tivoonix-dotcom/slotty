import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { getProfileById, updateProfile } from './profiles.service.js';
import { uploadProfileAvatar } from './profiles.storage.js';
import { normalizeBelarusPhone } from './belarusPhone.js';

export const profilesRouter = Router();

profilesRouter.use(authMiddleware);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

const patchMe = z.object({
  full_name: z.string().min(1).max(200).optional(),
  avatar_url: z.union([z.string().min(1).max(2048), z.null()]).optional(),
  phone: z.union([z.string().max(80), z.null()]).optional(),
  address: z.union([z.string().max(500), z.null()]).optional(),
});

function trimOrUndef(s: string | null | undefined): string | null | undefined {
  if (s === undefined) return undefined;
  if (s === null) return null;
  const t = s.trim();
  return t.length ? t : null;
}

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

    let phone: string | null | undefined = undefined;
    if (body.phone !== undefined) {
      if (body.phone === null) {
        phone = null;
      } else {
        const r = normalizeBelarusPhone(body.phone);
        if (!r.ok) {
          throw ApiError.badRequest(r.message, 'PHONE_INVALID');
        }
        phone = r.compact;
      }
    }

    let address: string | null | undefined = undefined;
    if (body.address !== undefined) {
      address = body.address === null ? null : trimOrUndef(body.address) ?? null;
    }

    const profile = await updateProfile(req.user!.id, {
      full_name: body.full_name?.trim(),
      avatar_url: body.avatar_url,
      phone,
      address,
    });
    res.json(profile);
  }),
);
