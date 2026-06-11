import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getPublicAppConfig } from './public.appConfig.js';
import {
  buildSitemapXml,
  listPublishedMasterSitemapEntries,
} from './sitemap.service.js';

export const publicRouter = Router();

publicRouter.get(
  '/config',
  asyncHandler(async (req, res) => {
    const config = await getPublicAppConfig(req);
    res.json({ ok: true, ...config });
  }),
);

publicRouter.get(
  '/sitemap-masters.xml',
  asyncHandler(async (_req, res) => {
    const entries = await listPublishedMasterSitemapEntries();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(buildSitemapXml(entries));
  }),
);
