const express = require('express');
const router = express.Router();
const homeBannerController = require('../controllers/homeBannerController');

router.post('/', homeBannerController.createHomeBanners);
router.get('/', homeBannerController.getAllHomeBanners);
router.get('/server-side', homeBannerController.getAllHomeBannersServerSide);
router.get('/:id', homeBannerController.getHomeBannersById);
router.put('/:id', homeBannerController.updateHomeBanners);
router.delete('/:id', homeBannerController.deleteHomeBanners);
router.patch('/:id/status', homeBannerController.updateHomeBannersStatus);

module.exports = router;
