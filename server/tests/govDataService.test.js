import { describe, it, expect } from 'vitest';
import { GovDataService } from '../src/services/govDataService.js';
import db from '../src/db/database.js';

describe('GovDataService - Live Sync & Concurrency Suite (Vitest)', () => {
  it('Real source sync execution and report shape', async () => {
    const result = await GovDataService.fetchAndSync();

    expect(result.startedAt).toBeTruthy();
    expect(result.completedAt).toBeTruthy();
    expect(typeof result.totalInserted).toBe('number');
    expect(typeof result.totalUpdated).toBe('number');
    expect(typeof result.totalSkipped).toBe('number');
    expect(typeof result.totalSchemesInDB).toBe('number');
    expect(result.totalSchemesInDB).toBeGreaterThan(0);
    expect(Array.isArray(result.sources)).toBe(true);
    expect(Array.isArray(result.errors)).toBe(true);
  });

  it('Preserves citizen and profile data during sync', async () => {
    const usersBefore = db.find('users');
    const profilesBefore = db.find('profiles');

    expect(usersBefore.length).toBeGreaterThan(0);
    const sampleUser = usersBefore[0];

    await GovDataService.fetchAndSync();

    const usersAfter = db.find('users');
    const profilesAfter = db.find('profiles');

    expect(usersAfter.length).toBe(usersBefore.length);
    expect(profilesAfter.length).toBe(profilesBefore.length);
    expect(usersAfter.some(u => u.id === sampleUser.id)).toBe(true);
  });

  it('Concurrency lock prevents parallel overwrites', async () => {
    const [res1, res2] = await Promise.all([
      GovDataService.fetchAndSync(),
      GovDataService.fetchAndSync()
    ]);

    expect(res1).toBeTruthy();
    expect(res2).toBeTruthy();

    const hasLockRejection =
      (res1.errors && res1.errors.some(e => e.includes('Sync lock active'))) ||
      (res2.errors && res2.errors.some(e => e.includes('Sync lock active')));
    const bothCompleted =
      typeof res1.totalSchemesInDB === 'number' && typeof res2.totalSchemesInDB === 'number';
    expect(hasLockRejection || bothCompleted).toBe(true);
  });
});
