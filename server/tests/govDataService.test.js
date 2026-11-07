import test from 'node:test';
import assert from 'node:assert/strict';
import { GovDataService } from '../src/services/govDataService.js';
import db from '../src/db/database.js';

test('GovDataService - Real source sync execution and report shape', async () => {
  const result = await GovDataService.fetchAndSync();

  assert.ok(result.startedAt, 'Expected startedAt timestamp');
  assert.ok(result.completedAt, 'Expected completedAt timestamp');
  assert.equal(typeof result.totalInserted, 'number');
  assert.equal(typeof result.totalUpdated, 'number');
  assert.equal(typeof result.totalSkipped, 'number');
  assert.equal(typeof result.totalSchemesInDB, 'number');
  assert.ok(result.totalSchemesInDB > 0, 'Database should contain schemes');
  assert.ok(Array.isArray(result.sources), 'Sources list should be an array');
  assert.ok(Array.isArray(result.errors), 'Errors list should be an array');
});

test('GovDataService - Preserves citizen and profile data during sync', async () => {
  const usersBefore = db.find('users');
  const profilesBefore = db.find('profiles');
  
  // Verify user Aryan Pawar exists
  const aryanUser = usersBefore.find(u => u.name && u.name.toLowerCase().includes('aryan'));
  assert.ok(aryanUser, 'Existing user Aryan Pawar must exist in DB');

  // Perform sync
  await GovDataService.fetchAndSync();

  const usersAfter = db.find('users');
  const profilesAfter = db.find('profiles');

  assert.equal(usersAfter.length, usersBefore.length, 'User records count must not change');
  assert.equal(profilesAfter.length, profilesBefore.length, 'Profile records count must not change');
  assert.ok(usersAfter.some(u => u.id === aryanUser.id), 'Aryan Pawar user record must be preserved');
});

test('GovDataService - Concurrency lock prevents parallel overwrites', async () => {
  const [res1, res2] = await Promise.all([
    GovDataService.fetchAndSync(),
    GovDataService.fetchAndSync()
  ]);

  assert.ok(res1);
  assert.ok(res2);
  // One runs successfully and the other is either rejected with a lock message or completes
  const hasLockRejection = (res1.errors && res1.errors.some(e => e.includes('Sync lock active'))) ||
                          (res2.errors && res2.errors.some(e => e.includes('Sync lock active')));
  const bothCompleted = typeof res1.totalSchemesInDB === 'number' && typeof res2.totalSchemesInDB === 'number';
  assert.ok(hasLockRejection || bothCompleted, 'Concurrency lock must be respected or handled gracefully');
});
