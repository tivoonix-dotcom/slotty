import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { requestPerfMiddleware } from './requestPerf.js';
import type { Request, Response } from 'express';

function mockRes(): Response & { statusCode: number; finishHandlers: Array<() => void> } {
  const finishHandlers: Array<() => void> = [];
  return {
    statusCode: 200,
    finishHandlers,
    on(event: string, cb: () => void) {
      if (event === 'finish') finishHandlers.push(cb);
    },
    getHeader: () => undefined,
  } as unknown as Response & { statusCode: number; finishHandlers: Array<() => void> };
}

describe('requestPerfMiddleware', () => {
  it('registers finish handler for onboarding paths', () => {
    const req = {
      method: 'GET',
      path: '/me/onboarding-progress',
      baseUrl: '/api/masters',
      route: { path: '/me/onboarding-progress' },
      originalUrl: '/api/masters/me/onboarding-progress',
      requestId: 't1',
      user: { role: 'master' },
    } as unknown as Request;
    const res = mockRes();
    const next = () => {};
    requestPerfMiddleware(req, res, next);
    assert.equal(res.finishHandlers.length, 1);
  });
});
