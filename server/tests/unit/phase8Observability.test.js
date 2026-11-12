import { describe, it, expect, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/server.js';
import { reportErrorToSentry } from '../../src/utils/observability.js';

describe('Phase 8: Observability, PII-Redacted Sentry Reporting & Health Telemetry', () => {
  const originalDsn = process.env.SENTRY_DSN;

  afterEach(() => {
    if (originalDsn === undefined) {
      delete process.env.SENTRY_DSN;
    } else {
      process.env.SENTRY_DSN = originalDsn;
    }
    vi.restoreAllMocks();
  });

  it('reportErrorToSentry returns false cleanly when SENTRY_DSN is unset or invalid', async () => {
    delete process.env.SENTRY_DSN;
    expect(await reportErrorToSentry(new Error('No DSN error'))).toBe(false);

    process.env.SENTRY_DSN = 'not-a-valid-dsn';
    expect(await reportErrorToSentry(new Error('Invalid DSN error'))).toBe(false);
  });

  it('reportErrorToSentry sends Sentry envelope and redacts sensitive PII fields', async () => {
    process.env.SENTRY_DSN = 'https://pub123key@o999.ingest.sentry.io/456789';
    let capturedUrl = '';
    let capturedBody = '';
    let capturedHeaders = {};

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, opts) => {
      capturedUrl = url;
      capturedBody = opts.body;
      capturedHeaders = opts.headers;
      return { ok: true, status: 200 };
    });

    const sent = await reportErrorToSentry(new Error('Simulated 500 failure'), {
      requestId: 'req-42',
      route: '/api/eligibility/evaluate',
      aadhaarNumber: '1234-5678-9012',
      bankAccount: '9988776655',
      ifscCode: 'SBIN0001234',
      password: 'SuperSecretPassword',
      nested: {
        token: 'jwt-secret-value',
        safeHint: 'non-sensitive'
      }
    });

    expect(sent).toBe(true);
    expect(capturedUrl).toBe('https://o999.ingest.sentry.io/api/456789/envelope/');
    expect(capturedHeaders['Content-Type']).toBe('application/x-sentry-envelope');
    expect(capturedBody).toContain('Simulated 500 failure');
    expect(capturedBody).toContain('req-42');
    expect(capturedBody).toContain('non-sensitive');
    expect(capturedBody).not.toContain('1234-5678-9012');
    expect(capturedBody).not.toContain('9988776655');
    expect(capturedBody).not.toContain('SBIN0001234');
    expect(capturedBody).not.toContain('SuperSecretPassword');
    expect(capturedBody).not.toContain('jwt-secret-value');
    expect(capturedBody).toContain('[REDACTED]');
  });

  it('GET /api/health returns 200 with structured observability metadata', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.observability).toBeDefined();
    expect(res.body.observability.structuredLogging).toBe('pino');
    expect(typeof res.body.observability.sentryEnabled).toBe('boolean');
  });
});
