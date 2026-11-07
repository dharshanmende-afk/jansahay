import express from 'express';
import { RealtimeService } from '../services/realtimeService.js';
import { GovDataService } from '../services/govDataService.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = express.Router();

// GET /api/realtime/live-ticker (Public news ticker)
router.get('/live-ticker', (req, res) => {
  const updates = RealtimeService.getLiveUpdates();
  return res.json({
    success: true,
    data: updates.slice(0, 5)
  });
});

// POST /api/realtime/sync (Admin Protected - sync live feeds)
router.post('/sync', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await RealtimeService.refreshLiveFeeds();
    return res.json({
      success: true,
      message: 'Synchronization completed successfully',
      data: result
    });
  } catch (err) {
    console.error('[Realtime] Sync error:', err);
    return res.status(500).json({
      success: false,
      error: 'SyncError',
      message: 'Government feed synchronization failed'
    });
  }
});

// POST /api/realtime/fetch-government-schemes (Admin Protected - Live Scraping)
router.post('/fetch-government-schemes', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log(`[Realtime] Admin (${req.user.email}) initiated live government data fetch...`);
    const report = await GovDataService.fetchAndSync();
    return res.json({
      success: true,
      message: report.summary,
      data: report
    });
  } catch (err) {
    console.error('[Realtime] Government data fetch error:', err);
    return res.status(500).json({
      success: false,
      error: 'GovFetchError',
      message: 'Error fetching live government data. Official portals may be rate limiting or down.',
      details: err.message
    });
  }
});

// GET /api/realtime/live-schemes?keyword=farmer (Public search from MyScheme)
router.get('/live-schemes', async (req, res) => {
  try {
    const keyword = req.query.keyword || 'scholarship';
    const result = await GovDataService.queryMyScheme([keyword]);
    return res.json({
      success: true,
      message: `Found ${result.items?.length || 0} live schemes for keyword: ${keyword}`,
      data: result.items || [],
      report: result.report,
      source: 'MyScheme.gov.in (Live)'
    });
  } catch (err) {
    console.error('[Realtime] Live schemes error:', err);
    return res.status(500).json({
      success: false,
      error: 'SearchError',
      message: 'Error querying live schemes'
    });
  }
});

// GET /api/realtime/sources-health (Public check status of official portals)
router.get('/sources-health', async (req, res) => {
  try {
    const health = await GovDataService.checkSourcesHealth();
    return res.json({
      success: true,
      data: health
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'HealthError',
      message: 'Error checking source health'
    });
  }
});

// GET /api/realtime/live-pib-updates (Public PIB releases)
router.get('/live-pib-updates', async (req, res) => {
  try {
    const updates = await GovDataService.getLiveUpdates();
    return res.json({
      success: true,
      data: updates,
      source: 'PIB - Press Information Bureau (Live)'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'PIBError',
      message: 'Error fetching PIB updates'
    });
  }
});

export default router;
