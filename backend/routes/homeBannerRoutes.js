const express = require('express');
const router = express.Router();
const homeBannerController = require('../controllers/homeBannerController');

router.post('/', homeBannerController.createHomeBanners);
router.get('/count', homeBannerController.getHomeBannersCount);
router.get('/', homeBannerController.getAllHomeBanners);
router.get('/server-side', homeBannerController.getAllHomeBannersServerSide);
router.delete('/delete-selected', homeBannerController.deleteSelectedHomeBanners);
router.get('/:id', homeBannerController.getHomeBannersById);
router.put('/:id', homeBannerController.updateHomeBanners);
router.delete('/:id', homeBannerController.deleteHomeBanners);
router.patch('/:id/status', homeBannerController.updateHomeBannersStatus);
router.patch('/:id/delete_status', homeBannerController.updateHomeBannersDeleteStatus);

module.exports = router;
