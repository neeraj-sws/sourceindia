const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');
router.get('/all-products', productsController.allProduct);

router.post('/', productsController.createProducts);
router.get('/count', productsController.getProductsCount);
router.get('/', productsController.getAllProducts);
router.get('/server-side', productsController.getAllProductsServerSide);
router.delete('/delete-selected', productsController.deleteSelectedProducts);
router.get('/companies', productsController.getAllCompanyInfo);
router.get('/companies_filtered', productsController.getFilteredCompanies);
router.get('/filtered', productsController.getFilteredProducts);
router.post('/company-review', productsController.companyReview);
router.get('/companies/:id', productsController.getCompanyInfoById);
router.get('/item-hierarchy/:item_id', productsController.getItemHierarchy);
router.get('/:id', productsController.getProductsById);
router.put('/:id', productsController.updateProducts);
router.delete('/:id', productsController.deleteProducts);
router.patch('/:id/status', productsController.updateProductsStatus);
router.patch('/:id/delete_status', productsController.updateProductsDeleteStatus);
router.post('/:id/images', productsController.appendProductImages);
router.delete('/:id/images/:imageId', productsController.removeProductImage);

module.exports = router;
