import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { listActiveLegalDocuments } from './legal.service.js';
import { LEGAL_DOCUMENT_PATHS } from './legal.types.js';

export const legalRouter = Router();

legalRouter.get(
  '/documents',
  asyncHandler(async (_req, res) => {
    const documents = await listActiveLegalDocuments();
    res.json({
      documents: documents.map((d) => ({
        ...d,
        path: LEGAL_DOCUMENT_PATHS[d.documentKey],
      })),
    });
  }),
);
