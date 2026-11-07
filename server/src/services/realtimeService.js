import { db } from '../db/database.js';
import { GovDataService } from './govDataService.js';

export class RealtimeService {
  /**
   * Fetches latest live updates ticker from DB
   */
  static getLiveUpdates() {
    const updates = db.find('updates', u => u.active !== false);
    return updates.sort((a, b) => new Date(b.publishedDate || 0) - new Date(a.publishedDate || 0));
  }

  /**
   * Genuine live sync with official public data feeds
   * Does NOT insert fake updates when no sources responded!
   */
  static async refreshLiveFeeds() {
    // Delegates to authentic GovDataService orchestrator
    const syncResult = await GovDataService.fetchAndSync();
    return syncResult;
  }
}
