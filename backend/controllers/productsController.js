const { Op, fn, col, literal } = require('sequelize');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const Products = require('../models/Products');
const Categories = require('../models/Categories');
const SubCategories = require('../models/SubCategories');
const UploadImage = require('../models/UploadImage');
const Users = require('../models/Users');
const Color = require('../models/Color');
const CompanyInfo = require('../models/CompanyInfo');
const States = require('../models/States');
const ReviewRating = require('../models/ReviewRating');
const CoreActivity = require('../models/CoreActivity');
const Activity = require('../models/Activity');
const getMulterUpload = require('../utils/upload');
const sequelize = require('../config/database');
const parseCsv = (str) => str.split(',').map(s => s.trim()).filter(Boolean);
const parseCsv2 = (value) => value.split(',').map(item => item.trim());

exports.allProduct = async (req, res) => {
  try {
    const { company_id } = req.query;

    if (!company_id) {
      return res.status(400).json({ success: false, message: 'Company ID is required', data: [] });
    }

    if (isNaN(company_id) || parseInt(company_id) <= 0) {
      return res.status(422).json({ success: false, message: 'Company ID must be a valid positive number', data: [] });
    }

    const products = await Products.findAll({ where: { company_id: parseInt(company_id) }, attributes: ['id', 'title', 'description'] });
    console.log(products);

    if (!products || products.length === 0) {
      return res.status(404).json({ success: false, message: 'No products found for the given company', data: [] });
    }

    console.log('Products fetched:', products);
    res.status(200).json({ success: true, message: 'Products fetched successfully', data: products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching products', data: [] });
  }
};

exports.createProducts = async (req, res) => {
  const upload = getMulterUpload('products');
  upload.array('files', 10)(req, res, async (err) => { // allow up to 10 files
    if (err) return res.status(500).json({ error: err.message });

    try {
      const {
        user_id, title, code, article_number, category, sub_category,
        is_gold, is_featured, is_recommended, best_product, status,
        application, short_description, description, slug, core_activity, activity, segment, product_service
      } = req.body;

      if (!user_id || !title || !category || !status || !short_description || !req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'All fields (user_id, title, category, short_description, files) are required' });
      }

      const uploadImages = await Promise.all(req.files.map(async (file) => {
        return await UploadImage.create({
          file: `upload/products/${file.filename}`,
        });
      }));

      const fileIds = uploadImages.map(image => image.id).join(',');

      const products = await Products.create({
        user_id,
        title,
        code,
        article_number,
        category,
        sub_category,
        is_gold,
        is_featured,
        is_recommended,
        best_product,
        status,
        application,
        short_description,
        description,
        slug: slug || '',
        core_activity: core_activity || 0,
        activity: activity || 0,
        segment: segment || 0,
        product_service: product_service || 0,
        file_id: uploadImages[0].id,
        file_ids: fileIds,
      });

      res.status(201).json({ message: 'Product created', products });

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};

exports.getAllProducts = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const page = req.query.page ? parseInt(req.query.page) : null;
    const offset = limit && page ? (page - 1) * limit : null;
    const { user_state, sort_by, title, category, sub_category, company_id, is_delete, status, is_approve } = req.query;
    let order = [['id', 'ASC']];
    if (sort_by === 'newest') order = [['created_at', 'DESC']];
    else if (sort_by === 'a_to_z') order = [['title', 'ASC']];
    else if (sort_by === 'z_to_a') order = [['title', 'DESC']];
    const productWhereClause = {};
    if (title) productWhereClause.title = { [Op.iLike]: `%${title}%` };
    if (category) {
      const categoryArray = parseCsv(category);
      productWhereClause.category = { [Op.in]: categoryArray };
    }
    if (sub_category) {
      const subCategoryArray = parseCsv(sub_category);
      productWhereClause.sub_category = { [Op.in]: subCategoryArray };
    }
    if (company_id) {
      const companyArray = parseCsv(company_id);
      productWhereClause.company_id = { [Op.in]: companyArray };
    }
    if (is_delete) {
      productWhereClause.is_delete = is_delete;
    }
    if (status) {
      productWhereClause.status = status;
    }
    if (is_approve) {
      productWhereClause.is_approve = is_approve;
    }
    let userWhereClause = {};
    if (user_state) {
      const stateIds = parseCsv(user_state);
      userWhereClause.state = { [Op.in]: stateIds };
    }
    const { count, rows } = await Products.findAndCountAll({
      where: productWhereClause,
      order,
      ...(limit && offset !== null ? { limit, offset } : {}),
      include: [
        { model: Categories, as: 'Categories', attributes: ['id', 'name'] },
        { model: SubCategories, as: 'SubCategories', attributes: ['id', 'name'] },
        { model: Color, as: 'Color', attributes: ['id', 'title'] },
        { model: CompanyInfo, as: 'company_info', attributes: ['id', 'organization_name'] },
        { model: UploadImage, as: 'file', attributes: ['file'] },
        {
          model: Users,
          as: 'Users',
          attributes: ['id', 'fname', 'lname', 'state'],
          where: Object.keys(userWhereClause).length ? userWhereClause : undefined,
          include: [{ model: States, as: 'state_data', attributes: ['id', 'name'] }]
        }
      ]
    });
    const modifiedProducts = rows.map(product => {
      const productsData = product.toJSON();
      productsData.getStatus = productsData.status === 1 ? 'Public' : 'Draft';
      productsData.category_name = productsData.Categories?.name || null;
      productsData.sub_category_name = productsData.SubCategories?.name || null;
      productsData.color_name = productsData.Color?.title || null;
      productsData.company_name = productsData.company_info?.organization_name || null;
      productsData.file_name = productsData.file?.file || null;
      productsData.state_name = productsData.Users?.state_data?.name || null;
      productsData.user_full_name = productsData.Users ? `${productsData.Users.fname} ${productsData.Users.lname}` : null;
      delete productsData.Categories;
      delete productsData.SubCategories;
      delete productsData.Color;
      delete productsData.company_info;
      delete productsData.file;
      delete productsData.Users;
      return productsData;
    });
    res.json({
      total: count,
      products: modifiedProducts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProductsById = async (req, res) => {
  try {
    const identifier = req.params.id;

    // Check if identifier is a number (ID) or a string (slug)
    const isNumeric = /^\d+$/.test(identifier);

    // Fetch product by ID or Slug
    const product = await Products.findOne({
      where: isNumeric ? { id: identifier } : { slug: identifier },
      include: [
        { model: Categories, as: 'Categories', attributes: ['id', 'name'] },
        { model: SubCategories, as: 'SubCategories', attributes: ['id', 'name'] },
        { model: Color, as: 'Color', attributes: ['id', 'title'] },
        {
          model: CompanyInfo,
          as: 'company_info',
          attributes: ['id', 'organization_name', 'category_sell', 'company_logo', 'brief_company', 'company_location', 'activity', 'core_activity'
          ],
          include: [
            { model: UploadImage, as: 'companyLogo', attributes: ['file'] },
            { model: Activity, as: 'Activity', attributes: ['name'] },
            { model: CoreActivity, as: 'CoreActivity', attributes: ['name'] },
          ]
        },
        { model: UploadImage, as: 'file', attributes: ['file'] }
      ]
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const productData = product.toJSON();
    const categorySellString = productData.company_info?.category_sell || '';
    const allowedCategories = categorySellString.split(',').map(id => id.trim());


    const allCompanies = await CompanyInfo.findAll({
      where: {
        id: { [Op.ne]: productData.company_info?.id }
      },
      attributes: ['id', 'organization_name', 'category_sell'],
      include: [
        {
          model: UploadImage,
          as: 'companyLogo',
          attributes: ['file']
        }
      ]
    });

    const recommendedCompanies = allCompanies.filter(company => {
      if (!company.category_sell) return false;
      const companyCategories = company.category_sell.split(',').map(id => id.trim());
      return companyCategories.some(cat => allowedCategories.includes(cat));
    });

    const fileIds = productData.file_ids ? productData.file_ids.split(',') : [];

    const associatedImages = await UploadImage.findAll({
      where: { id: { [Op.in]: fileIds } },
      attributes: ['id', 'file'],
    });

    const reviews = await ReviewRating.findAll({
      where: { product_id: product.id },
      attributes: ['id', 'rating', 'review', 'created_at'],
      include: [{
        model: Users,
        as: 'reviewer',
        attributes: ['id', 'fname', 'lname']
      }]
    });

    const formattedReviews = reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      review: r.review,
      created_at: r.created_at,
      reviewer_name: r.reviewer ? `${r.reviewer.fname} ${r.reviewer.lname}` : null
    }));

    const similarProducts = await Products.findAll({
      where: {
        category: product.category,
        id: { [Op.ne]: product.id }
      },
      attributes: ['id', 'title', 'file_ids', 'slug'],
      include: [
        { model: UploadImage, as: 'file', attributes: ['file'] }
      ],
    });

    const formattedSimilarProducts = await Promise.all(similarProducts.map(async (p) => {
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        file_name: p.file?.file || null,
      };
    }));

    const response = {
      ...productData,
      category_name: productData.Categories?.name || null,
      sub_category_name: productData.SubCategories?.name || null,
      color_name: productData.Color?.title || null,
      company_name: productData.company_info?.organization_name || null,
      company_logo: productData.company_info?.companyLogo?.file || null,
      brief_company: productData.company_info?.brief_company || null,
      company_location: productData.company_info?.company_location || null,
      activity_name: productData.company_info?.Activity?.name || null,
      core_activity_name: productData.company_info?.CoreActivity?.name || null,
      file_name: productData.file?.file || null,
      images: associatedImages.map(image => ({ id: image.id, file: image.file })),
      reviews: formattedReviews,
      similar_products: formattedSimilarProducts,
      recommended_companies: recommendedCompanies.map(c => ({
        id: c.id,
        organization_name: c.organization_name,
        category_sell: c.category_sell,
        company_logo_file: c.companyLogo?.file || null
      }))
    };

    // Clean up unwanted fields
    delete response.Categories;
    delete response.SubCategories;
    delete response.Color;
    delete response.company_info;
    delete response.file;

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getProductsCount = async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const now = new Date();

    const [total, statusPublic, statusDraft, addedThisMonth] = await Promise.all([
      Products.count({ where: { is_delete: 0 } }),
      Products.count({ where: { status: 1, is_delete: 0 } }),
      Products.count({ where: { status: 0, is_delete: 0 } }),
      Products.count({
        where: {
          created_at: {
            [Op.between]: [startOfMonth, now],
          },
        },
      }),
    ]);

    res.json({
      total,
      statusPublic,
      statusDraft,
      addedThisMonth,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateProducts = async (req, res) => {
  try {
    const {
      user_id,
      title,
      code,
      article_number,
      category,
      sub_category,
      is_gold,
      is_featured,
      is_recommended,
      best_product,
      status,
      application,
      short_description,
      description,
    } = req.body;

    const product = await Products.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await product.update({
      user_id,
      title,
      code,
      article_number,
      category,
      sub_category,
      is_gold,
      is_featured,
      is_recommended,
      best_product,
      status,
      application,
      short_description,
      description,
    });

    res.status(200).json({
      message: "Product updated successfully",
      product,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.appendProductImages = async (req, res) => {
  const upload = getMulterUpload("products");
  upload.array("files", 10)(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });

    try {
      const product = await Products.findByPk(req.params.id);
      if (!product) return res.status(404).json({ message: "Product not found" });

      let fileIds = product.file_ids ? product.file_ids.split(",") : [];

      const newFileIds = await Promise.all(
        req.files.map(async (file) => {
          const newImage = await UploadImage.create({
            file: `upload/products/${file.filename}`,
          });
          return newImage.id.toString();
        })
      );
      fileIds = [...fileIds, ...newFileIds];
      let finalFileId = product.file_id;
      if (!finalFileId && fileIds.length > 0) {
        finalFileId = fileIds[0];
      }
      await product.update({
        file_id: finalFileId,
        file_ids: fileIds.join(","),
      });
      res.status(200).json({ message: "Images added successfully", product });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
};

exports.removeProductImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;
    const product = await Products.findByPk(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    let fileIds = product.file_ids ? product.file_ids.split(",") : [];
    if (!fileIds.includes(imageId.toString())) {
      return res.status(404).json({ error: "Image not found in this product" });
    }
    fileIds = fileIds.filter(fid => fid !== imageId.toString());
    let newFileId = product.file_id?.toString();
    if (newFileId === imageId.toString()) {
      newFileId = fileIds.length > 0 ? fileIds[0] : null;
    }
    const imageToDelete = await UploadImage.findByPk(imageId);
    if (imageToDelete && imageToDelete.file) {
      const filePath = path.join(__dirname, `../${imageToDelete.file}`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      await imageToDelete.destroy();
    }
    await product.update({
      file_id: newFileId,
      file_ids: fileIds.join(","),
    });
    res.json({ success: true, message: "Image removed successfully" });
  } catch (err) {
    console.error("Error removing image:", err);
    res.status(500).json({ error: "Failed to remove image" });
  }
};

exports.deleteProducts = async (req, res) => {
  try {
    const product = await Products.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.file_ids) {
      const fileIds = product.file_ids.split(',');
      for (const fileId of fileIds) {
        const uploadImage = await UploadImage.findByPk(fileId);
        if (uploadImage) {
          const oldImagePath = path.resolve(uploadImage.file);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
          await uploadImage.destroy();
        }
      }
    }
    await product.destroy();
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateProductsStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Deactive).' });
    }
    const products = await Products.findByPk(req.params.id);
    if (!products) return res.status(404).json({ message: 'Product not found' });
    products.status = status;
    await products.save();
    res.json({ message: 'Status updated', products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSelectedProducts = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of IDs to update.' });
    }
    const parsedIds = ids.map(id => parseInt(id, 10));
    const products = await Products.findAll({
      where: {
        id: {
          [Op.in]: parsedIds,
        },
        is_delete: 0
      }
    });
    if (products.length === 0) {
      return res.status(404).json({ message: 'No product found with the given IDs.' });
    }
    await Products.update(
      { is_delete: 1 },
      {
        where: {
          id: {
            [Op.in]: parsedIds,
          }
        }
      }
    );
    res.json({ message: `${products.length} product marked as deleted.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllCompanyInfo = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const page = req.query.page ? parseInt(req.query.page) : null;
    const offset = limit && page ? (page - 1) * limit : null;

    const {
      user_state,
      sort_by,
      title,
      category,
      sub_category,
      is_delete,
      is_seller,     // ✅ NEW
      is_trading     // ✅ NEW
    } = req.query;

    let order = [['id', 'ASC']];
    if (sort_by === 'newest') order = [['created_at', 'DESC']];
    else if (sort_by === 'a_to_z') order = [['organization_name', 'ASC']];
    else if (sort_by === 'z_to_a') order = [['organization_name', 'DESC']];

    const whereClause = {};

    if (typeof is_delete !== 'undefined') {
      whereClause.is_delete = parseInt(is_delete);
    }

    if (title) {
      whereClause.organization_name = { [Op.like]: `%${title}%` };
    }

    if (category) {
      const catIds = parseCsv(category).map(x => parseInt(x)).filter(x => !isNaN(x));
      if (catIds.length) {
        whereClause[Op.or] = catIds.map(id =>
          literal(`FIND_IN_SET(${id}, category_sell)`)
        );
      }
    }

    if (sub_category) {
      const subIds = parseCsv(sub_category).map(x => parseInt(x)).filter(x => !isNaN(x));
      if (subIds.length) {
        whereClause[Op.or] = subIds.map(id =>
          literal(`FIND_IN_SET(${id}, sub_category)`)
        );
      }
    }

    // ✅ Collect all user filters
    const userFilters = [`u.is_delete = 0`, `u.status = 1`];

    if (user_state) {
      const stateIds = parseCsv(user_state).map(x => parseInt(x)).filter(x => !isNaN(x));
      if (stateIds.length) {
        userFilters.push(`u.state IN (${stateIds.join(',')})`);
      }
    }

    if (typeof is_seller !== 'undefined') {
      userFilters.push(`u.is_seller = ${parseInt(is_seller)}`);
    }

    if (typeof is_trading !== 'undefined') {
      userFilters.push(`u.is_trading = ${parseInt(is_trading)}`);
    }

    // ✅ Add final user filter as EXISTS
    whereClause[Op.and] = whereClause[Op.and] || [];
    whereClause[Op.and].push(
      literal(`EXISTS (SELECT 1 FROM users u WHERE u.company_id = CompanyInfo.id AND ${userFilters.join(' AND ')})`)
    );

    // Total count
    const total = await CompanyInfo.count({ where: whereClause });

    // Fetch company list
    const companies = await CompanyInfo.findAll({
      where: whereClause,
      order,
      ...(limit && offset !== null ? { limit, offset } : {}),
      include: [
        { model: UploadImage, as: 'companyLogo', attributes: ['file'] },
        { model: CoreActivity, as: 'CoreActivity', attributes: ['name'] },
        { model: Activity, as: 'Activity', attributes: ['name'] }
      ]
    });

    const companyIds = companies.map(c => c.id);

    // ✅ Product counts
    const productCounts = await Products.findAll({
      attributes: ['company_id', [fn('COUNT', col('id')), 'count']],
      where: { company_id: { [Op.in]: companyIds }, is_delete: 0, is_approve: 1, status: 1 },
      group: ['company_id'],
      raw: true
    });

    // ✅ Count users by is_seller
    const sellerCounts = await Users.findAll({
      attributes: ['is_seller', [fn('COUNT', col('id')), 'count']],
      where: {
        company_id: { [Op.in]: companyIds },
        is_delete: 0,
        status: 1
      },
      group: ['is_seller'],
      raw: true
    });

    // ✅ Count users by is_trading
    const tradingCounts = await Users.findAll({
      attributes: ['is_trading', [fn('COUNT', col('id')), 'count']],
      where: {
        company_id: { [Op.in]: companyIds },
        is_delete: 0,
        status: 1
      },
      group: ['is_trading'],
      raw: true
    });

    const countMap = {};
    productCounts.forEach(item => {
      countMap[item.company_id] = parseInt(item.count);
    });

    const sellerMap = {};
    sellerCounts.forEach(item => {
      sellerMap[item.is_seller] = parseInt(item.count);
    });

    const tradingMap = {};
    tradingCounts.forEach(item => {
      tradingMap[item.is_trading] = parseInt(item.count);
    });

    const allCategoryIds = new Set();
    const allSubCategoryIds = new Set();
    companies.forEach(c => {
      const { category_sell, sub_category } = c;
      if (category_sell) {
        category_sell.split(',').forEach(id => {
          const parsed = parseInt(id);
          if (!isNaN(parsed)) allCategoryIds.add(parsed);
        });
      }
      if (sub_category) {
        sub_category.split(',').forEach(id => {
          const parsed = parseInt(id);
          if (!isNaN(parsed)) allSubCategoryIds.add(parsed);
        });
      }
    });

    const allProducts = await Products.findAll({
      where: {
        company_id: { [Op.in]: companyIds },
        is_delete: 0,
        is_approve: 1,
        status: 1
      },
      attributes: ['id', 'title', 'slug', 'company_id'],
      raw: true,
      nest: true
    });

    const productMap = {};
    allProducts.forEach(p => {
      const companyId = p.company_id;
      if (!productMap[companyId]) productMap[companyId] = [];
      productMap[companyId].push({
        id: p.id,
        title: p.title,
        slug: p.slug,
      });
    });

    const [categoriesList, subCategoriesList] = await Promise.all([
      Categories.findAll({
        where: { id: [...allCategoryIds] },
        attributes: ['id', 'name'],
        raw: true
      }),
      SubCategories.findAll({
        where: { id: [...allSubCategoryIds] },
        attributes: ['id', 'name'],
        raw: true
      })
    ]);

    const categoryMap = {};
    categoriesList.forEach(c => {
      categoryMap[c.id] = c.name;
    });

    const subCategoryMap = {};
    subCategoriesList.forEach(s => {
      subCategoryMap[s.id] = s.name;
    });

    const modified = companies.map(c => {
      const cd = c.toJSON();
      const file = cd.companyLogo?.file || null;
      const coreActivityName = cd.CoreActivity?.name || null;
      const activityName = cd.Activity?.name || null;
      const categoryNames = cd.category_sell
        ? cd.category_sell.split(',').map(id => categoryMap[parseInt(id)]).filter(Boolean).join(', ')
        : '';
      const subCategoryNames = cd.sub_category
        ? cd.sub_category.split(',').map(id => subCategoryMap[parseInt(id)]).filter(Boolean).join(', ')
        : '';
      delete cd.companyLogo;
      delete cd.CoreActivity;
      delete cd.Activity;
      return {
        ...cd,
        company_logo_file: file,
        product_count: countMap[cd.id] || 0,
        core_activity_name: coreActivityName,
        activity_name: activityName,
        category_name: categoryNames,
        sub_category_name: subCategoryNames,
        products: productMap[cd.id] || []
      };
    });

    res.json({
      total,
      companies: modified,
      counts_by_seller: sellerMap,
      counts_by_trading: tradingMap
    });

  } catch (err) {
    console.error('getAllCompanyInfo error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getCompanyInfoById = async (req, res) => {
  try {
    const identifier = req.params.id;

    // Check if identifier is numeric (ID) or a string slug
    const isNumeric = /^\d+$/.test(identifier);

    // Fetch company by ID or organization_slug
    const company = await CompanyInfo.findOne({
      where: isNumeric ? { id: identifier } : { organization_slug: identifier },
      include: [
        { model: CoreActivity, as: 'CoreActivity', attributes: ['name'] },
        { model: Activity, as: 'Activity', attributes: ['name'] },
        { model: UploadImage, as: 'companyLogo', attributes: ['file'] },
      ]
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const data = company.toJSON();
    data.company_logo_file = data.companyLogo?.file || null;

    // Get products belonging to the company
    const products = await Products.findAll({
      where: { company_id: company.id, is_delete: 0, status: 1, is_approve: 1 },
      attributes: ['id', 'title', 'slug'],
      include: [
        { model: UploadImage, as: 'file', attributes: ['file'] }
      ]
    });

    const productList = products.map(product => {
      const p = product.toJSON();
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        image: p.file?.file || null
      };
    });

    // Get category names from stored category IDs
    const categoryIdsStr = data.category_sell;
    let categoryNames = [];
    let allowedCategories = [];

    if (categoryIdsStr) {
      allowedCategories = categoryIdsStr.split(',').map(id => id.trim());
      const categoryIds = allowedCategories.map(id => parseInt(id)).filter(id => !isNaN(id));
      const categories = await Categories.findAll({
        where: { id: { [Op.in]: categoryIds } },
        attributes: ['name']
      });
      categoryNames = categories.map(cat => cat.name);
    }

    // Get sub-category names
    const subCategoryIdsStr = data.sub_category;
    let subCategoryNames = [];

    if (subCategoryIdsStr) {
      const subCategoryIds = subCategoryIdsStr.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      const subCategories = await SubCategories.findAll({
        where: { id: { [Op.in]: subCategoryIds } },
        attributes: ['name']
      });
      subCategoryNames = subCategories.map(cat => cat.name);
    }

    // Fetch other companies for recommendations
    const allCompanies = await CompanyInfo.findAll({
      where: {
        id: { [Op.ne]: company.id }
      },
      attributes: ['id', 'organization_name', 'category_sell', 'organization_slug'],
      include: [
        {
          model: UploadImage,
          as: 'companyLogo',
          attributes: ['file']
        }
      ]
    });

    const recommendedCompanies = allCompanies.filter(c => {
      if (!c.category_sell) return false;
      const companyCategories = c.category_sell.split(',').map(id => id.trim());
      return companyCategories.some(cat => allowedCategories.includes(cat));
    });

    const response = {
      ...data,
      coreactivity_name: data.CoreActivity?.name || null,
      activity_name: data.Activity?.name || null,
      category_name: categoryNames.join(', '),
      sub_category_name: subCategoryNames.join(', '),
      products: productList,
      recommended_companies: recommendedCompanies.map(c => ({
        id: c.id,
        organization_name: c.organization_name,
        category_sell: c.category_sell,
        company_logo_file: c.companyLogo?.file || null,
        organization_slug: c.organization_slug || null,
      }))
    };

    // Clean up included models
    delete response.CoreActivity;
    delete response.Activity;
    delete response.companyLogo;

    res.json(response);
  } catch (err) {
    console.error("Error fetching company info:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllProductsServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
      user_id,
      dateRange = '',
      startDate,
      endDate,
      category,
      sub_category,
      company,
      product_status,
      is_approve
    } = req.query;
    const validColumns = ['id', 'title', 'article_number', 'created_at', 'updated_at', 'category_name', 'subcategory_name'];
    const viewType = req.query.viewType || '';
    const sortDirection = (sort === 'DESC' || sort === 'ASC') ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);
    let order = [];
    if (sortBy === 'category_name') {
      order = [[{ model: Categories, as: 'Categories' }, 'name', sortDirection]];
    } else if (sortBy === 'subcategory_name') {
      order = [[{ model: SubCategories, as: 'SubCategories' }, 'name', sortDirection]];
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }
    const baseWhere = { is_delete: 0 };
    if (user_id) {
      baseWhere.user_id = user_id;
    }
    if (is_approve) {
      baseWhere.is_approve = is_approve;
    }
    if (req.query.getDeleted === 'true') {
      baseWhere.is_delete = 1;
    }
    let dateCondition = null;
    if (dateRange) {
      const range = dateRange.toString().toLowerCase().replace(/\s+/g, '');
      const today = moment().startOf('day');
      const now = moment();
      if (range === 'today') {
        dateCondition = {
          [Op.gte]: today.toDate(),
          [Op.lte]: now.toDate(),
        };
      } else if (range === 'yesterday') {
        dateCondition = {
          [Op.gte]: moment().subtract(1, 'day').startOf('day').toDate(),
          [Op.lte]: moment().subtract(1, 'day').endOf('day').toDate(),
        };
      } else if (range === 'last7days') {
        dateCondition = {
          [Op.gte]: moment().subtract(6, 'days').startOf('day').toDate(),
          [Op.lte]: now.toDate(),
        };
      } else if (range === 'last30days') {
        dateCondition = {
          [Op.gte]: moment().subtract(29, 'days').startOf('day').toDate(),
          [Op.lte]: now.toDate(),
        };
      } else if (range === 'thismonth') {
        dateCondition = {
          [Op.gte]: moment().startOf('month').toDate(),
          [Op.lte]: now.toDate(),
        };
      } else if (range === 'lastmonth') {
        dateCondition = {
          [Op.gte]: moment().subtract(1, 'month').startOf('month').toDate(),
          [Op.lte]: moment().subtract(1, 'month').endOf('month').toDate(),
        };
      } else if (range === 'customrange' && startDate && endDate) {
        dateCondition = {
          [Op.gte]: moment(startDate).startOf('day').toDate(),
          [Op.lte]: moment(endDate).endOf('day').toDate(),
        };
      } else if (!isNaN(range)) {
        const days = parseInt(range);
        dateCondition = {
          [Op.gte]: moment().subtract(days - 1, 'days').startOf('day').toDate(),
          [Op.lte]: now.toDate(),
        };
      }
    }
    if (dateCondition) {
      baseWhere.created_at = dateCondition;
    }
    if (category) {
      baseWhere.category = category;
    }
    if (sub_category) {
      baseWhere.sub_category = sub_category;
    }
    if (company) {
      baseWhere.company_id = company;
    }
    if (product_status) {
      baseWhere.status = product_status;
    }
    const totalRecords = await Products.count({
      where: { ...baseWhere },
    });
    if (search) {
      if (viewType === 'products') {
        baseWhere[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { '$Categories.name$': { [Op.like]: `%${search}%` } },
        ];
      } else {
        baseWhere[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { article_number: { [Op.like]: `%${search}%` } },
          { '$Categories.name$': { [Op.like]: `%${search}%` } },
          { '$SubCategories.name$': { [Op.like]: `%${search}%` } },
        ];
      }
    }
    const { count: filteredRecords, rows } = await Products.findAndCountAll({
      where: baseWhere,
      order,
      limit: limitValue,
      offset,
      include: [
        { model: Categories, attributes: ['name'], as: 'Categories' },
        { model: SubCategories, attributes: ['name'], as: 'SubCategories' },
        { model: UploadImage, attributes: ['file'], as: 'file' },
      ],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      title: row.title,
      article_number: row.article_number,
      category: row.category,
      category_name: row.Categories ? row.Categories.name : null,
      sub_category: row.sub_category,
      subcategory_name: row.SubCategories ? row.SubCategories.name : null,
      file_id: row.file_id,
      file_name: row.file ? row.file.file : null,
      status: row.status,
      is_delete: row.is_delete,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
    res.json({
      data: mappedRows,
      totalRecords,
      filteredRecords,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.companyReview = async (req, res) => {
  try {

    const { company_id, product_id = null, user_id, rating, review } = req.body;

    if (!review || review.trim() === "") {
      return res.status(400).json({ success: 0, message: "Review is required." });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: 0, message: "Rating must be between 1 and 5." });
    }

    const obj = await ReviewRating.create({
      company_id,
      product_id,
      user_id,
      rating,
      review,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return res.json({
      success: 1,
      message: "Review submitted successfully.",
      id: obj.id,
    });
  } catch (error) {
    console.error("Error submitting company review:", error);
    return res.status(500).json({
      success: 0,
      message: "Server error while submitting review.",
    });
  }
};