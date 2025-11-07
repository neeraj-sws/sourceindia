const express = require('express');
const router = express.Router();
const shortcutController = require('../controllers/shortcutController');

router.get('/shortcut_menus', shortcutController.AllshortcutMenus);
router.post('/shortcut_menus', shortcutController.createShortcut);
router.put('/shortcut_menus/:id', shortcutController.updateShortcut);
router.delete('/shortcut_menus/:id', shortcutController.deleteShortcut);

module.exports = router;
