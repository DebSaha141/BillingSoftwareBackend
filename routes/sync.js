const express = require('express');
const router = express.Router();
const {
  pushSync,
  pullSync,
  fullDownload,
} = require('../controllers/syncController');

// POST /api/sync/push — App pushes unsynced data to cloud
router.post('/push', pushSync);

// GET /api/sync/pull?since=ISO_TIMESTAMP — App pulls changes since last sync
router.get('/pull', pullSync);

// POST /api/sync/full-download — First install: get everything
router.post('/full-download', fullDownload);

module.exports = router;