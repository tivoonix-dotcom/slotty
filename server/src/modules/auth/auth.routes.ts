import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { authMiddleware, optionalAuthMiddleware } from '../../middlewares/auth.js';
import {
  buildConsentGateFromRequest,
  completeGoogleLoginWithPending,
  linkEmail,
  linkGoogle,
  linkTelegram,
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  loginWithTelegram,
} from './auth.service.js';
import { createPendingGoogleLogin } from './googleLoginPending.store.js';
import { acceptConsentsForProfile } from '../legal/legal.service.js';
import {
  buildClientOAuthDoneUrl,
  buildGoogleAuthorizationUrl,
  exchangeGoogleAuthorizationCode,
  signGoogleLinkHandoff,
  signGoogleOAuthState,
  verifyGoogleLinkHandoff,
  verifyGoogleOAuthState,
} from './googleOAuth.service.js';
import {
  consumeGoogleLinkHandoff,
  createGoogleLinkHandoff,
} from './googleLinkHandoff.store.js';
import { syncMasterAccountVerified } from './accountVerification.js';
import { listAuthIdentitiesForProfile } from './authIdentities.service.js';
import {
  requestPasswordReset,
  resetPasswordWithToken,
  sendVerificationEmailByAddress,
  sendVerificationEmailForProfile,
  verifyEmailWithToken,
} from './email/emailAuth.service.js';
import { authCredentialLimiter, authEmailSendLimiter } from '../../middlewares/rateLimit.js';
import {
  issueSessionContextFromRequest,
  listAuthSessionsForProfile,
  revokeAuthSession,
  revokeOtherAuthSessions,
} from './authSessions.service.js';
import { resolveCanonicalProfileId } from './authIdentities.service.js';

export const authRouter = Router();

const telegramBody = z.object({
  initDataRaw: z.string().min(1, 'initDataRaw is required'),
});

const googleBody = z.object({
  idToken: z.string().min(1, 'idToken is required'),
});

const googleLinkBody = googleBody.extend({
  handoffToken: z.string().min(1).optional(),
});

const emailLoginBody = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(8, 'Пароль минимум 8 символов'),
});

const emailLinkBody = emailLoginBody;

const tokenBody = z.object({
  token: z.string().min(1, 'token is required'),
});

const resetPasswordBody = z.object({
  token: z.string().min(1, 'token is required'),
  password: z.string().min(8, 'Пароль минимум 8 символов'),
});

const sendVerificationBody = z.object({
  email: z.string().email('Введите корректный email').optional(),
});

const forgotPasswordBody = z.object({
  email: z.string().email('Введите корректный email'),
});

const googleOAuthStartBody = z.object({
  purpose: z.enum(['link', 'login']),
  returnPath: z.string().max(256).optional(),
});

const consentItemSchema = z.object({
  documentKey: z.string().min(1),
  version: z.coerce.number().int().positive(),
});

const consentsField = z.object({
  consents: z.array(consentItemSchema).min(1).optional(),
});

const telegramLoginBody = telegramBody.merge(consentsField);
const googleLoginBody = googleBody.merge(consentsField);
const emailRegisterBody = emailLoginBody.merge(consentsField);
const emailLoginWithConsentsBody = emailLoginBody.merge(consentsField);

const acceptConsentsBody = z.object({
  consents: z.array(consentItemSchema).min(1),
});

const googlePendingCompleteBody = z.object({
  pendingToken: z.string().min(1),
  consents: z.array(consentItemSchema).min(1),
});

authRouter.post(
  '/telegram',
  authCredentialLimiter,
  asyncHandler(async (req, res) => {
    const body = telegramLoginBody.parse(req.body);
    const gate = buildConsentGateFromRequest(req, body.consents, 'telegram');
    const out = await loginWithTelegram(body.initDataRaw, gate, issueSessionContextFromRequest(req));
    res.json(out);
  }),
);

authRouter.post(
  '/google',
  authCredentialLimiter,
  asyncHandler(async (req, res) => {
    const body = googleLoginBody.parse(req.body);
    const gate = buildConsentGateFromRequest(req, body.consents, 'google');
    const out = await loginWithGoogle(body.idToken, gate, issueSessionContextFromRequest(req));
    res.json(out);
  }),
);

authRouter.post(
  '/google/complete-pending',
  authCredentialLimiter,
  asyncHandler(async (req, res) => {
    const body = googlePendingCompleteBody.parse(req.body);
    const gate = buildConsentGateFromRequest(req, body.consents, 'google');
    const out = await completeGoogleLoginWithPending(
      body.pendingToken,
      body.consents,
      gate,
      issueSessionContextFromRequest(req),
    );
    res.json(out);
  }),
);

authRouter.post(
  '/consents/accept',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const body = acceptConsentsBody.parse(req.body);
    const gate = buildConsentGateFromRequest(req, body.consents, 'web');
    const status = await acceptConsentsForProfile(req.user!.id, body.consents, gate.meta);
    res.json({ ok: true, consentStatus: status });
  }),
);

authRouter.post(
  '/email/login',
  authCredentialLimiter,
  asyncHandler(async (req, res) => {
    const body = emailLoginWithConsentsBody.parse(req.body);
    const gate = buildConsentGateFromRequest(req, body.consents, 'email');
    const out = await loginWithEmail(body.email, body.password, gate, issueSessionContextFromRequest(req));
    res.json(out);
  }),
);

authRouter.post(
  '/email/register',
  authCredentialLimiter,
  asyncHandler(async (req, res) => {
    const body = emailRegisterBody.parse(req.body);
    const gate = buildConsentGateFromRequest(req, body.consents, 'email');
    const out = await registerWithEmail(
      body.email,
      body.password,
      gate,
      issueSessionContextFromRequest(req),
    );
    res.json(out);
  }),
);

authRouter.get(
  '/identities',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const profileId = req.user!.id;
    const identities = await listAuthIdentitiesForProfile(profileId);
    await syncMasterAccountVerified(profileId).catch((e) => {
      console.error('[SLOTTY] sync master is_verified on identities list failed:', e);
    });
    res.json({ identities });
  }),
);

authRouter.get(
  '/sessions',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const profileId = await resolveCanonicalProfileId(req.user!.id);
    const sessions = await listAuthSessionsForProfile(profileId, req.user!.authSessionId);
    res.json({ sessions });
  }),
);

authRouter.post(
  '/sessions/revoke-others',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const profileId = await resolveCanonicalProfileId(req.user!.id);
    const out = await revokeOtherAuthSessions(profileId, req.user!.authSessionId);
    res.json({ ok: true, ...out });
  }),
);

authRouter.delete(
  '/sessions/:sessionId',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const sessionId = z.string().uuid().parse(req.params.sessionId);
    const profileId = await resolveCanonicalProfileId(req.user!.id);
    const out = await revokeAuthSession(profileId, sessionId, req.user!.authSessionId);
    res.json({ ok: true, ...out });
  }),
);

authRouter.post(
  '/link/telegram',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const body = telegramBody.parse(req.body);
    const out = await linkTelegram(body.initDataRaw, req.user!.id);
    res.json(out);
  }),
);

authRouter.post(
  '/google/link-handoff',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { jti, profileId } = await createGoogleLinkHandoff(req.user!.id);
    res.json({ handoffToken: signGoogleLinkHandoff(profileId, jti) });
  }),
);

authRouter.post(
  '/link/google',
  optionalAuthMiddleware,
  asyncHandler(async (req, res) => {
    const body = googleLinkBody.parse(req.body);
    let profileId = req.user?.id;
    if (body.handoffToken) {
      const handoff = verifyGoogleLinkHandoff(body.handoffToken);
      try {
        await consumeGoogleLinkHandoff(handoff.jti, handoff.profileId);
      } catch {
        throw ApiError.badRequest(
          'Ссылка для привязки Google уже использована или устарела. Откройте снова из Telegram.',
          'GOOGLE_LINK_HANDOFF_INVALID',
        );
      }
      profileId = handoff.profileId;
    }
    if (!profileId) {
      throw ApiError.unauthorized('Войдите в аккаунт, чтобы привязать Google', 'AUTH_REQUIRED');
    }
    const out = await linkGoogle(body.idToken, profileId);
    res.json(out);
  }),
);

authRouter.post(
  '/google/oauth/start',
  optionalAuthMiddleware,
  asyncHandler(async (req, res) => {
    const body = googleOAuthStartBody.parse(req.body ?? {});
    if (body.purpose === 'link' && !req.user?.id) {
      throw ApiError.unauthorized('Войдите в аккаунт, чтобы привязать Google', 'AUTH_REQUIRED');
    }
    const state = signGoogleOAuthState({
      purpose: body.purpose,
      profileId: body.purpose === 'link' ? req.user!.id : undefined,
      returnPath: body.returnPath,
    });
    res.json({ authorizationUrl: buildGoogleAuthorizationUrl(state, req) });
  }),
);

authRouter.get(
  '/google/oauth/callback',
  asyncHandler(async (req, res) => {
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const stateRaw = typeof req.query.state === 'string' ? req.query.state : '';
    const oauthError = typeof req.query.error === 'string' ? req.query.error : '';

    let oauthPurpose: 'link' | 'login' = 'login';
    try {
      if (stateRaw) oauthPurpose = verifyGoogleOAuthState(stateRaw).purpose;
    } catch {
      /* use login for error redirect */
    }

    if (oauthError) {
      res.redirect(buildClientOAuthDoneUrl({ purpose: oauthPurpose, error: oauthError }));
      return;
    }

    if (!code || !stateRaw) {
      res.redirect(buildClientOAuthDoneUrl({ purpose: oauthPurpose, error: 'missing_code' }));
      return;
    }

    try {
      const state = verifyGoogleOAuthState(stateRaw);
      const idToken = await exchangeGoogleAuthorizationCode(code, req);

      if (state.purpose === 'link') {
        await linkGoogle(idToken, state.profileId!);
        res.redirect(
          buildClientOAuthDoneUrl({ purpose: 'link', returnPath: state.returnPath }),
        );
        return;
      }

      try {
        const session = await loginWithGoogle(idToken, undefined, issueSessionContextFromRequest(req));
        res.redirect(
          buildClientOAuthDoneUrl({
            purpose: 'login',
            token: session.token,
            returnPath: state.returnPath,
          }),
        );
      } catch (loginErr) {
        if (loginErr instanceof ApiError && loginErr.code === 'CONSENT_REQUIRED') {
          const pendingToken = createPendingGoogleLogin(idToken);
          const isNewUser = loginErr.details?.isNewUser === true;
          res.redirect(
            buildClientOAuthDoneUrl({
              purpose: 'login',
              returnPath: state.returnPath,
              error: 'CONSENT_REQUIRED',
              pendingToken,
              isNewUser: isNewUser ? '1' : '0',
            }),
          );
          return;
        }
        throw loginErr;
      }
    } catch (e) {
      const errCode =
        e instanceof ApiError ? (e.code ?? 'oauth_failed') : 'oauth_failed';
      let purpose: 'link' | 'login' = 'login';
      try {
        purpose = verifyGoogleOAuthState(stateRaw).purpose;
      } catch {
        /* keep login */
      }
      res.redirect(buildClientOAuthDoneUrl({ purpose, error: errCode }));
    }
  }),
);

authRouter.post(
  '/link/email',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const body = emailLinkBody.parse(req.body);
    const out = await linkEmail(body.email, body.password, req.user!.id);
    res.json(out);
  }),
);

authRouter.post(
  '/email/send-verification',
  authEmailSendLimiter,
  optionalAuthMiddleware,
  asyncHandler(async (req, res) => {
    const body = sendVerificationBody.parse(req.body ?? {});
    if (req.user?.id) {
      const out = await sendVerificationEmailForProfile(req.user.id);
      res.json({ ok: true, sent: out.sent });
      return;
    }
    if (!body.email) {
      throw ApiError.badRequest('Укажите email или войдите в аккаунт', 'EMAIL_REQUIRED');
    }
    const out = await sendVerificationEmailByAddress(body.email);
    res.json({ ok: true, sent: out.sent });
  }),
);

authRouter.post(
  '/email/verify',
  authCredentialLimiter,
  asyncHandler(async (req, res) => {
    const body = tokenBody.parse(req.body);
    await verifyEmailWithToken(body.token);
    res.json({ ok: true, verified: true });
  }),
);

authRouter.post(
  '/email/forgot-password',
  authEmailSendLimiter,
  asyncHandler(async (req, res) => {
    const body = forgotPasswordBody.parse(req.body);
    await requestPasswordReset(body.email);
    res.json({
      ok: true,
      message: 'Если аккаунт с этим email существует, мы отправили ссылку для сброса пароля.',
    });
  }),
);

authRouter.post(
  '/email/reset-password',
  authCredentialLimiter,
  asyncHandler(async (req, res) => {
    const body = resetPasswordBody.parse(req.body);
    await resetPasswordWithToken(body.token, body.password);
    res.json({ ok: true });
  }),
);
