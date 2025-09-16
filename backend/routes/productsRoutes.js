const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');

router.post('/', productsController.createProducts);
router.get('/count', productsController.getProductsCount);
router.get('/', productsController.getAllProducts);
router.get('/server-side', productsController.getAllProductsServerSide);
router.get('/:id', productsController.getProductsById);
router.put('/:id', productsController.updateProducts);
router.delete('/:id', productsController.deleteProducts);
router.patch('/:id/status', productsController.updateProductsStatus);
router.post('/:id/images', productsController.appendProductImages);   // Add/append images
router.delete('/:id/images/:imageId', productsController.removeProductImage); // Remove single image

module.exports = router;
