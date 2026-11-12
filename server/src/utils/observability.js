import crypto from 'crypto';
import logger from './logger.js';

const SENSITIVE_KEY_RE = /(aadhaar|aadhar|pan|bank|account|ifsc|password|token|secret|authorization|cookie)/i;

function sanitizeContext(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEY_RE.test(k)) {
      clean[k] = '[REDACTED]';
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      clean[k] = sanitizeContext(v);
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

/**
 * Lightweight, dependency-free Sentry Envelope reporter for Node.js.
 * Activated ONLY when SENTRY_DSN is set in environment variables.
 * Never transmits Aadhaar, bank details, tokens, or request secrets.
 */
export async function reportErrorToSentry(err, context = {}) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn || !dsn.startsWith('http')) return false;

  try {
    const parsed = new URL(dsn);
    const publicKey = parsed.username;
    const projectId = parsed.pathname.replace(/^\/+/, '');
    if (!publicKey || !projectId) return false;

    const envelopeUrl = `${parsed.protocol}//${parsed.host}/api/${projectId}/envelope/`;
    const eventId = crypto.randomBytes(16).toString('hex');
    const sentAt = new Date().toISOString();

    const header = JSON.stringify({ event_id: eventId, sent_at: sentAt, dsn });
    const itemHeader = JSON.stringify({ type: 'event' });
    const payload = JSON.stringify({
      event_id: eventId,
      timestamp: sentAt,
      platform: 'node',
      level: 'error',
      environment: process.env.NODE_ENV || 'production',
      server_name: 'jansahay-api',
      exception: {
        values: [
          {
            type: err?.name || 'Error',
            value: err?.message || String(err),
            stacktrace: err?.stack ? { frames: [{ filename: 'server', function: err.stack.split('\n')[1]?.trim() || 'unknown' }] } : undefined
          }
        ]
      },
      extra: sanitizeContext(context)
    });

    const body = `${header}\n${itemHeader}\n${payload}`;
    await fetch(envelopeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${publicKey}, sentry_client=jansahay-node/2.0`
      },
      body
    });
    return true;
  } catch (reportErr) {
    logger.warn({ err: reportErr.message }, 'Sentry error reporting failed silently');
    return false;
  }
}
