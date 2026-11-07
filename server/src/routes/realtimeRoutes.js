import express from 'express';
import { RealtimeService } from '../services/realtimeService.js';
import { GovDataService } from '../services/govDataService.js';

const router = express.Router();

// GET /api/realtime/live-ticker
router.get('/live-ticker', (req, res) => {
  const updates = RealtimeService.getLiveUpdates();
  return res.json({
    success: true,
    data: updates.slice(0, 5)
  });
});

// POST /api/realtime/sync — sync local cache
router.post('/sync', async (req, res) => {
  try {
    const result = await RealtimeService.refreshLiveFeeds();
    return res.json({
      success: true,
      message: 'Synchronization completed successfully',
      data: result
    });
  } catch (err) {
    console.error('[Realtime] Sync error:', err);
    return res.status(500).json({ success: false, message: 'Sync error' });
  }
});

// POST /api/realtime/fetch-government-schemes — fetch LIVE data from government websites
// This is the core "real data from government websites" endpoint
router.post('/fetch-government-schemes', async (req, res) => {
  try {
    console.log('[Realtime] Starting live government data fetch...');
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
      message: 'Error fetching government data. The servers may be temporarily unavailable. Cached data is still available.',
      error: err.message
    });
  }
});

// GET /api/realtime/live-schemes?keyword=farmer — search live schemes from MyScheme API
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
    return res.status(500).json({ success: false, message: 'Error fetching live schemes' });
  }
});

// GET /api/realtime/sources-health — check status of official portals
router.get('/sources-health', async (req, res) => {
  try {
    const health = await GovDataService.checkSourcesHealth();
    return res.json({
      success: true,
      data: health
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error checking source health' });
  }
});

// GET /api/realtime/live-pib-updates — fetch latest PIB press releases
router.get('/live-pib-updates', async (req, res) => {
  try {
    const updates = await GovDataService.getLiveUpdates();
    return res.json({
      success: true,
      data: updates,
      source: 'PIB - Press Information Bureau (Live)'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching PIB updates' });
  }
});

export default router;
