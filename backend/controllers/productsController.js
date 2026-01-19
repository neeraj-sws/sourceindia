const { Op, fn, col, literal, Sequelize } = require('sequelize');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const Products = require('../models/Products');
const Categories = require('../models/Categories');
const SubCategories = require('../models/SubCategories');
const UploadImage = require('../models/UploadImage');
const Users = require('../models/Users');
const CompanyInfo = require('../models/CompanyInfo');
const States = require('../models/States');
const Cities = require('../models/Cities');
const ReviewRating = require('../models/ReviewRating');
const CoreActivity = require('../models/CoreActivity');
const Activity = require('../models/Activity');
const SellerCategory = require('../models/SellerCategory');
const ItemCategory = require('../models/ItemCategory');
const ItemSubCategory = require('../models/ItemSubCategory');
const Items = require('../models/Items');
const getMulterUpload = require('../utils/upload');
const sequelize = require('../config/database');
const BuyerSourcingInterests = require('../models/BuyerSourcingInterests');
const parseCsv = (str) => str.split(',').map(s => s.trim()).filter(Boolean);
const parseCsv2 = (value) => value.split(',').map(item => item.trim());

async function createUniqueProductSlug(title) {
  if (!title) return '';
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  let uniqueSlug = baseSlug;
  let counter = 1;
  while (await Products.findOne({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }
  return uniqueSlug;
}

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


    /*if (!products || products.length === 0) {
      return res.status(404).json({ success: false, message: 'No products found for the given company', data: [] });
    }

    console.log('Products fetched:', products);
    res.status(200).json({ success: true, message: 'Products fetched successfully', data: products });*/
    res.status(200).json({
      success: true,
      message: products.length ? 'Products fetched successfully' : 'No products found',
      data: products
    });
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
      let {
        user_id, title, code, article_number, category, sub_category,
        item_category_id, item_subcategory_id, item_id,
        is_gold, is_featured, is_recommended, best_product, status,
        application, short_description, description, slug,
        core_activity, activity, segment, product_service
      } = req.body;

      // Inline clean for all values
      [
        user_id, category, sub_category, item_category_id,
        item_subcategory_id, item_id, application, core_activity,
        activity, segment, product_service
      ] = [
        user_id, category, sub_category, item_category_id,
        item_subcategory_id, item_id, application, core_activity,
        activity, segment, product_service
      ].map(v =>
        Array.isArray(v)
          ? v.map(x => String(x).trim().replace(/^,/, '')).filter(Boolean)
          : v != null
            ? String(v).trim().replace(/^,/, '')
            : v
      );
      /*if (!user_id || !title || !category || !status || !short_description || !req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'All fields (user_id, title, category, short_description, files) are required' });
      }*/
      const uploadImages = await Promise.all(req.files.map(async (file) => {
        return await UploadImage.create({
          file: `upload/products/${file.filename}`,
        });
      }));

      const fileIds = uploadImages.map(image => image.id).join(',');
      const user = await Users.findOne({ where: { id: user_id } });

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
        slug: await createUniqueProductSlug(title),
        core_activity: core_activity || 0,
        activity: activity || 0,
        segment: segment || 0,
        product_service: product_service || 0,
        file_id: uploadImages[0].id,
        file_ids: fileIds,
        item_category_id,
        item_subcategory_id,
        item_id,
        company_id: user.company_id,
      });

      let updateObj = {};
      if (user.is_product === 0) updateObj.is_product = 1;
      if (user.is_complete === 0) updateObj.is_complete = 1;
      if (Object.keys(updateObj).length > 0) {
        await user.update(updateObj);
      }

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
    const { user_state, sort_by, title, category, sub_category, company_id, is_delete, status, is_approve,
      item_category_id, item_subcategory_id, item_id } = req.query;
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
    if (item_category_id) {
      const arr = parseCsv(item_category_id);
      productWhereClause.item_category_id = { [Op.in]: arr };
    }
    if (item_subcategory_id) {
      const arr = parseCsv(item_subcategory_id);
      productWhereClause.item_subcategory_id = { [Op.in]: arr };
    }
    if (item_id) {
      const arr = parseCsv(item_id);
      productWhereClause.item_id = { [Op.in]: arr };
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
        { model: ItemCategory, as: 'ItemCategory', attributes: ['id', 'name'] },
        { model: ItemSubCategory, as: 'ItemSubCategory', attributes: ['id', 'name'] },
        { model: Items, as: 'Items', attributes: ['id', 'name'] },
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
      productsData.item_category_name = productsData.ItemCategory?.name || null;
      productsData.item_subcategory_name = productsData.ItemSubCategory?.name || null;
      productsData.item_name = productsData.Items?.name || null;
      productsData.color_name = null;
      productsData.company_name = productsData.company_info?.organization_name || null;
      productsData.file_name = productsData.file?.file || null;
      productsData.state_name = productsData.Users?.state_data?.name || null;
      productsData.user_full_name = productsData.Users ? `${productsData.Users.fname} ${productsData.Users.lname}` : null;
      delete productsData.Categories;
      delete productsData.SubCategories;
      delete productsData.ItemCategory;
      delete productsData.ItemSubCategory;
      delete productsData.Items;
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
        { model: ItemCategory, as: 'ItemCategory', attributes: ['id', 'name'] },
        { model: ItemSubCategory, as: 'ItemSubCategory', attributes: ['id', 'name'] },
        { model: Items, as: 'Items', attributes: ['id', 'name'] },
        {
          model: CompanyInfo,
          as: 'company_info',
          attributes: ['id', 'organization_name', 'company_logo', 'brief_company', 'company_location', 'activity', 'core_activity', 'organization_slug'],
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

    // Fetch seller categories based on user_id (company owner)
    const sellerCategories = await SellerCategory.findAll({
      where: { user_id: productData.company_info?.id },
      include: [
        { model: Categories, as: 'category', attributes: ['id', 'name'] },
        { model: SubCategories, as: 'subcategory', attributes: ['id', 'name'] },
      ]
    });

    const allowedCategoryIds = sellerCategories.map(sc => sc.category_id.toString());



    const avgRating = await ReviewRating.findOne({
      where: { product_id: productData.id },
      attributes: [
        [Sequelize.fn('AVG', Sequelize.col('rating')), 'averageRating']
      ],
      raw: true
    });

    const averageRating = avgRating.averageRating
      ? Number(avgRating.averageRating)
      : 0;


    // Fetch all other companies excluding current
    const allCompanies = await CompanyInfo.findAll({
      where: {
        id: { [Op.ne]: productData.company_info?.id }
      },
      attributes: ['id', 'organization_name', 'organization_slug'],
      include: [
        { model: UploadImage, as: 'companyLogo', attributes: ['file'] }
      ]
    });

    // Filter recommended companies based on seller_categories
    const recommendedCompanies = [];
    for (const company of allCompanies) {
      const companySellerCategories = await SellerCategory.findAll({
        where: { user_id: company.id }
      });
      const companyCategoryIds = companySellerCategories.map(sc => sc.category_id.toString());

      if (companyCategoryIds.some(catId => allowedCategoryIds.includes(catId))) {
        recommendedCompanies.push(company);
      }
    }

    const fileIds = productData.file_ids ? productData.file_ids.split(',') : [];

    const associatedImages = await UploadImage.findAll({
      where: { id: { [Op.in]: fileIds } },
      attributes: ['id', 'file'],
    });

    const reviews = await ReviewRating.findAll({
      where: { product_id: product.id },
      attributes: ['id', 'rating', 'review', 'created_at'],
      include: [{ model: Users, as: 'reviewer', attributes: ['id', 'fname', 'lname'] }]
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
      include: [{ model: UploadImage, as: 'file', attributes: ['file'] }],
    });

    const formattedSimilarProducts = similarProducts.map(p => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      file_name: p.file?.file || null,
    }));

    const response = {
      ...productData,
      category_name: productData.Categories?.name || null,
      sub_category_name: productData.SubCategories?.name || null,
      item_category_name: productData.ItemCategory?.name || null,
      item_subcategory_name: productData.ItemSubCategory?.name || null,
      item_name: productData.Items?.name || null,
      color_name:  null,
      company_name: productData.company_info?.organization_name || null,
      company_slug: productData.company_info?.organization_slug || null,
      company_logo: productData.company_info?.companyLogo?.file || null,
      brief_company: productData.company_info?.brief_company || null,
      company_location: productData.company_info?.company_location || null,
      activity_name: productData.company_info?.Activity?.name || null,
      core_activity_name: productData.company_info?.CoreActivity?.name || null,
      file_name: productData.file?.file || null,
      images: associatedImages.map(image => ({ id: image.id, file: image.file })),
      reviews: formattedReviews,
      averageRating: averageRating,
      similar_products: formattedSimilarProducts,
      recommended_companies: recommendedCompanies.map(c => ({
        id: c.id,
        organization_name: c.organization_name,
        organization_slug: c.organization_slug,
        company_logo_file: c.companyLogo?.file || null
      })),
      seller_categories: sellerCategories.map(sc => ({
        category_id: sc.category_id,
        category_name: sc.category?.name || null,
        subcategory_id: sc.subcategory_id,
        subcategory_name: sc.subcategory?.name || null
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
      item_category_id,
      item_subcategory_id,
      item_id,
    } = req.body;

    const product = await Products.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await product.update({
      user_id,
      title,
      slug: await createUniqueProductSlug(title),
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
      item_category_id,
      item_subcategory_id,
      item_id,
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
      core_activity,
      activity,
      item_category,
      item_subcategory,
      category,
      sub_category,
      is_delete,
      is_seller,
      is_trading,
      interest_sub_categories
    } = req.query;



    // ✅ Sorting
    let order = [['id', 'ASC']];
    if (sort_by === 'newest') order = [['created_at', 'DESC']];
    else if (sort_by === 'a_to_z') order = [['organization_name', 'ASC']];
    else if (sort_by === 'z_to_a') order = [['organization_name', 'DESC']];

    // ✅ Base where clause
    const whereClause = {};
    if (typeof is_delete !== 'undefined') whereClause.is_delete = parseInt(is_delete);
    if (title) whereClause.organization_name = { [Op.like]: `%${title}%` };

    // ✅ Category/Subcategory filter through SellerCategory relation
    if (category || sub_category) {
      const catIds = category ? parseCsv(category).map(x => parseInt(x)).filter(x => !isNaN(x)) : [];
      const subIds = sub_category ? parseCsv(sub_category).map(x => parseInt(x)).filter(x => !isNaN(x)) : [];

      let sellerWhere = [];


      if (catIds.length) sellerWhere.push(`sc.category_id IN (${catIds.join(',')})`);
      if (subIds.length) sellerWhere.push(`sc.subcategory_id IN (${subIds.join(',')})`);

      if (sellerWhere.length) {
        whereClause[Op.and] = whereClause[Op.and] || [];
        whereClause[Op.and].push(
          literal(`
            EXISTS (
              SELECT 1 FROM users u 
              INNER JOIN seller_categories sc ON sc.user_id = u.user_id
              WHERE u.company_id = CompanyInfo.company_id
              AND u.is_delete = 0 AND u.status = 1 AND u.is_approve = 1
              AND (${sellerWhere.join(' OR ')})
            )
          `)
        );
      }
    }
    const coreWhere = [];
    if (core_activity || activity) {
      if (core_activity) coreWhere.push(`CompanyInfo.core_activity = ${core_activity}`);
      if (activity) coreWhere.push(`CompanyInfo.activity = ${activity}`);
    }

    // ✅ User filters
    const userFilters = [`u.is_delete = 0`, `u.status = 1`, `u.is_approve = 1`];
    if (user_state) {
      const stateIds = parseCsv(user_state).map(x => parseInt(x)).filter(x => !isNaN(x));
      if (stateIds.length) userFilters.push(`u.state IN (${stateIds.join(',')})`);
    }
    if (typeof is_seller !== 'undefined') userFilters.push(`u.is_seller = ${parseInt(is_seller)}`);
    if (typeof is_trading !== 'undefined') userFilters.push(`u.is_trading = ${parseInt(is_trading)}`);

    let interestSubCatIds = [];
    if (interest_sub_categories) {
      interestSubCatIds = parseCsv(interest_sub_categories)
        .map(x => parseInt(x))
        .filter(x => !isNaN(x));
    }
    const interestConditions = [];

    if (item_category != null) {
      interestConditions.push(`bi.item_category_id = ${Number(item_category)}`);
    }

    let ItemSubCatIds = [];

    if (item_subcategory) {
      ItemSubCatIds = parseCsv(item_subcategory)
        .map(x => parseInt(x))
        .filter(x => !isNaN(x));
    }

    if (ItemSubCatIds?.length) {
      interestConditions.push(
        `bi.item_subcategory_id IN (${ItemSubCatIds.map(Number).join(',')})`
      );
    }

    if (interestConditions.length) {
      whereClause[Op.and] = whereClause[Op.and] || [];
      whereClause[Op.and].push(
        literal(`
      EXISTS (
        SELECT 1
        FROM users u2
        JOIN buyer_sourcing_interests bi ON bi.user_id = u2.user_id
        WHERE u2.company_id = CompanyInfo.company_id
          AND ${interestConditions.join(' AND ')}
          AND u2.status = 1
          AND u2.is_approve = 1
          AND u2.is_seller = 0
          AND u2.is_delete = 0
          AND CompanyInfo.is_delete = 0
      )
    `)
      );
    }


    // if (interestSubCatIds.length) {
    //   whereClause[Op.and] = whereClause[Op.and] || [];
    //   whereClause[Op.and].push(
    //     literal(`
    //       EXISTS (
    //         SELECT 1
    //         FROM users u2
    //         JOIN cities c ON u2.city = c.city_id
    //         JOIN states s ON u2.state = s.state_id
    //         JOIN countries co ON u2.country = co.country_id
    //         JOIN buyerinterests bi ON bi.buyer_id = u2.user_id
    //         WHERE u2.company_id = CompanyInfo.company_id
    //           AND bi.activity_id IN (${interestSubCatIds.join(',')})
    //           AND u2.status = 1
    //           AND u2.is_approve = 1
    //           AND u2.is_seller = 0
    //           AND u2.is_delete = 0
    //           AND CompanyInfo.is_delete = 0
    //       )
    //     `)
    //   );
    // }

    whereClause[Op.and] = whereClause[Op.and] || [];
    whereClause[Op.and].push(
      literal(`EXISTS (SELECT 1 FROM users u WHERE u.company_id = CompanyInfo.company_id AND ${userFilters.join(' AND ')})`)
    );
    if (coreWhere.length) {
      whereClause[Op.and].push(
        Sequelize.literal(coreWhere.join(' AND '))
      );
    }

    // ✅ Total count
    const total = await CompanyInfo.count({ where: whereClause });

    // ✅ Fetch company list
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
      attributes: ['company_id', [fn('COUNT', col('product_id')), 'count']],
      where: { company_id: { [Op.in]: companyIds }, is_delete: 0, is_approve: 1, status: 1 },
      group: ['company_id'],
      raw: true
    });

    const countMap = {};
    productCounts.forEach(item => (countMap[item.company_id] = parseInt(item.count)));

    // ✅ Product list
    const allProducts = await Products.findAll({
      where: { company_id: { [Op.in]: companyIds }, is_delete: 0, is_approve: 1, status: 1 },
      attributes: ['id', 'title', 'slug', 'company_id'],
      raw: true
    });

    const productMap = {};
    allProducts.forEach(p => {
      if (!productMap[p.company_id]) productMap[p.company_id] = [];
      productMap[p.company_id].push({ id: p.id, title: p.title, slug: p.slug });
    });

    // ✅ Fetch users (single user per company)
    const users = await Users.findAll({
      where: { company_id: { [Op.in]: companyIds }, is_delete: 0, status: 1, is_approve: 1 },
      order: [['id', 'ASC']], // to pick first user if multiple exist
      raw: true
    });

    const companyUsersMap = {};
    users.forEach(u => {
      if (!companyUsersMap[u.company_id]) companyUsersMap[u.company_id] = u;
    });

    // ✅ Fetch SellerCategory
    const sellerCats = await SellerCategory.findAll({
      attributes: ['user_id', 'category_id', 'subcategory_id'],
      raw: true
    });

    const userSellerMap = {};
    sellerCats.forEach(sc => {
      if (!userSellerMap[sc.user_id]) userSellerMap[sc.user_id] = [];
      userSellerMap[sc.user_id].push(sc);
    });

    // ✅ Gather unique category & subcategory IDs
    const allCategoryIds = new Set();
    const allSubCategoryIds = new Set();

    sellerCats.forEach(sc => {
      if (sc.category_id) allCategoryIds.add(sc.category_id);
      if (sc.subcategory_id) allSubCategoryIds.add(sc.subcategory_id);
    });

    // ✅ Fetch category/subcategory names
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

    const categoryMap = Object.fromEntries(categoriesList.map(c => [c.id, c.name]));
    const subCategoryMap = Object.fromEntries(subCategoriesList.map(s => [s.id, s.name]));


    // item type
    const buyerItemCates = await BuyerSourcingInterests.findAll({
      attributes: ['user_id', 'item_category_id', 'item_subcategory_id'],
      raw: true
    });

    const userBuyerMap = {};
    buyerItemCates.forEach(sc => {
      if (!userBuyerMap[sc.user_id]) userBuyerMap[sc.user_id] = [];
      userBuyerMap[sc.user_id].push(sc);
    });

    const allItemCategoryIds = new Set();
    const allItemSubCategoryIds = new Set();

    buyerItemCates.forEach(sc => {
      if (sc.item_category_id) allItemCategoryIds.add(sc.item_category_id);
      if (sc.item_subcategory_id) allItemSubCategoryIds.add(sc.item_subcategory_id);
    });

    // ✅ Fetch category/subcategory names
    const [itemCategoriesList, itemsubCategoriesList] = await Promise.all([
      ItemCategory.findAll({
        where: { id: [...allItemCategoryIds] },
        attributes: ['id', 'name'],
        raw: true
      }),
      ItemSubCategory.findAll({
        where: { id: [...allItemSubCategoryIds] },
        attributes: ['id', 'name'],
        raw: true
      })
    ]);

    const itemCategoryMap = Object.fromEntries(itemCategoriesList.map(c => [c.id, c.name]));
    const itemSubCategoryMap = Object.fromEntries(itemsubCategoriesList.map(s => [s.id, s.name]));






    // ✅ Final data formatting
    const modified = companies.map(c => {
      const cd = c.toJSON();
      const file = cd.companyLogo?.file || null;
      const coreActivityName = cd.CoreActivity?.name || null;
      const activityName = cd.Activity?.name || null;

      const companyUser = companyUsersMap[cd.id] || null;
      const userIds = companyUser ? [companyUser.id] : [];

      const catSet = new Set();
      const subSet = new Set();

      userIds.forEach(uid => {
        const entries = userSellerMap[uid] || [];
        entries.forEach(e => {
          if (e.category_id) catSet.add(e.category_id);
          if (e.subcategory_id) subSet.add(e.subcategory_id);
        });
      });


      const itemCatSet = new Set();
      const itemSubSet = new Set();

      userIds.forEach(uid => {
        const itementries = userBuyerMap[uid] || [];
        itementries.forEach(e => {
          if (e.item_category_id) itemCatSet.add(e.item_category_id);
          if (e.item_subcategory_id) itemSubSet.add(e.item_subcategory_id);
        });
      });



      const categoryNames = [...catSet].map(id => categoryMap[id]).filter(Boolean).join(', ');
      const subCategoryNames = [...subSet].map(id => subCategoryMap[id]).filter(Boolean).join(', ');

      const itemCategoryNames = [...itemCatSet].map(id => itemCategoryMap[id]).filter(Boolean).join(', ');
      const itemSubCategoryNames = [...itemSubSet].map(id => itemSubCategoryMap[id]).filter(Boolean).join(', ');

      delete cd.companyLogo;
      delete cd.CoreActivity;
      delete cd.Activity;

      return {
        ...cd,
        company_logo_file: file,
        core_activity_name: coreActivityName,
        activity_name: activityName,
        product_count: countMap[cd.id] || 0,
        category_name: categoryNames,
        sub_category_name: subCategoryNames,
        item_category_name: itemCategoryNames,
        item_subcategory_name: itemSubCategoryNames,
        products: productMap[cd.id] || [],
        user: companyUser // ✅ single user info
      };
    });

    // ✅ Final response
    res.json({
      total,
      companies: modified
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

    const user = await Users.findOne({
      where: {
        company_id: company.id,
        is_delete: 0,
        status: 1,
        is_approve: 1
      },
      attributes: ['id'],
      order: [['id', 'ASC']],
      raw: true
    });

    // 2️⃣ Get seller categories
    let categoryNames = [];
    let subCategoryNames = [];

    if (user) {
      const sellerCats = await SellerCategory.findAll({
        where: { user_id: user.id },
        attributes: ['category_id', 'subcategory_id'],
        raw: true
      });

      const categoryIds = [...new Set(
        sellerCats.map(sc => sc.category_id).filter(Boolean)
      )];

      const subCategoryIds = [...new Set(
        sellerCats.map(sc => sc.subcategory_id).filter(Boolean)
      )];

      if (categoryIds.length) {
        const categories = await Categories.findAll({
          where: { id: categoryIds },
          attributes: ['name'],
          raw: true
        });
        categoryNames = categories.map(c => c.name);
      }

      if (subCategoryIds.length) {
        const subCategories = await SubCategories.findAll({
          where: { id: subCategoryIds },
          attributes: ['name'],
          raw: true
        });
        subCategoryNames = subCategories.map(sc => sc.name);
      }
    }


    let itemcategoryNames = [];
    let itemsubCategoryNames = [];
    // console.log(user);
    if (user) {
      const buyerCats = await BuyerSourcingInterests.findAll({
        where: { user_id: user.id },
        attributes: ['item_category_id', 'item_subcategory_id'],
        raw: true
      });

      const itemcategoryIds = [...new Set(
        buyerCats.map(sc => sc.item_category_id).filter(Boolean)
      )];

      const itemsubCategoryIds = [...new Set(
        buyerCats.map(sc => sc.item_subcategory_id).filter(Boolean)
      )];

      if (itemcategoryIds.length) {
        const itemcategories = await ItemCategory.findAll({
          where: { id: itemcategoryIds },
          attributes: ['name'],
          raw: true
        });

        itemcategoryNames = itemcategories.map(c => c.name);
      }

      if (itemsubCategoryIds.length) {
        const itemsubCategories = await ItemSubCategory.findAll({
          where: { id: itemsubCategoryIds },
          attributes: ['name'],
          raw: true
        });
        itemsubCategoryNames = itemsubCategories.map(sc => sc.name);
      }
    }

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

    const allowedCategories = new Set();

    if (user) {
      const sellerCats = await SellerCategory.findAll({
        where: { user_id: user.id },
        attributes: ['category_id'],
        raw: true
      });

      sellerCats.forEach(sc => {
        if (sc.category_id) allowedCategories.add(String(sc.category_id));
      });
    }

    /*const recommendedCompanies = allCompanies.filter(c => {
      if (!c.category_sell) return false;
      const companyCategories = c.category_sell.split(',').map(id => id.trim());
      return companyCategories.some(cat => allowedCategories.has(cat));
    });*/
    let recommendedCompaniesFiltered = [];
if (user) {
  const allowedCategoryIds = [...allowedCategories]; // convert Set to array

  const recommendedCompaniesRaw = await sequelize.query(
    `
      SELECT c.company_id, c.organization_name, c.category_sell, c.organization_slug,
             ui.file AS company_logo_file,
             s.name AS state_name,
             ci.name AS city_name
      FROM company_info c
      LEFT JOIN upload_images ui ON ui.upload_image_id = c.company_logo
      LEFT JOIN users u ON u.company_id = c.company_id AND u.is_delete = 0 AND u.status = 1 AND u.is_approve = 1
      LEFT JOIN states s ON s.state_id = u.state
      LEFT JOIN cities ci ON ci.city_id = u.city
      WHERE c.company_id != :companyId
    `,
    {
      replacements: { companyId: company.id },
      type: sequelize.QueryTypes.SELECT
    }
  );

  recommendedCompaniesFiltered = recommendedCompaniesRaw.filter(c => {
    if (!c.category_sell) return false;
    const companyCategories = c.category_sell.split(',').map(id => id.trim());
    return companyCategories.some(catId => allowedCategoryIds.includes(catId));
  });
}

    const response = {
      ...data,
      coreactivity_name: data.CoreActivity?.name || null,
      activity_name: data.Activity?.name || null,
      category_name: categoryNames.join(', '),
      sub_category_name: subCategoryNames.join(', '),
      item_category_name: itemcategoryNames.join(', '),
      item_subcategory_name: itemsubCategoryNames.join(', '),
      products: productList,
      /*recommended_companies: recommendedCompanies.map(c => ({
        id: c.id,
        organization_name: c.organization_name,
        category_sell: c.category_sell,
        company_logo_file: c.companyLogo?.file || null,
        organization_slug: c.organization_slug || null,
      }))*/
      recommended_companies: recommendedCompaniesFiltered.map(c => ({
  id: c.id,
  organization_name: c.organization_name,
  organization_slug: c.organization_slug,
  category_sell: c.category_sell,
  company_logo_file: c.company_logo_file || null,
  state_name: c.state_name || null,
  city_name: c.city_name || null
})),
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
      item_category_id,
      item_subcategory_id,
      item_id,
      company,
      product_status,
      is_approve
    } = req.query;
    const validColumns = ['id', 'title', 'article_number', 'created_at', 'updated_at', 'category_name', 'subcategory_name', 'company_name', 'company_slug'];
    const viewType = req.query.viewType || '';
    const sortDirection = (sort === 'DESC' || sort === 'ASC') ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);
    let order = [];
    if (sortBy === 'category_name') {
      order = [[{ model: Categories, as: 'Categories' }, 'name', sortDirection]];
    } else if (sortBy === 'subcategory_name') {
      order = [[{ model: SubCategories, as: 'SubCategories' }, 'name', sortDirection]];
    } else if (sortBy === 'company_name') {
      order = [[{ model: CompanyInfo, as: 'company_info' }, 'organization_name', sortDirection]];
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }
    const baseWhere = { is_delete: 0 };
    if (user_id !== undefined && user_id !== "") {
      baseWhere.user_id = user_id;
    }
    if (is_approve !== undefined && is_approve !== "") {
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
    if (item_category_id) {
      baseWhere.item_category_id = item_category_id;
    }
    if (item_subcategory_id) {
      baseWhere.item_subcategory_id = item_subcategory_id;
    }
    if (item_id) {
      baseWhere.item_id = item_id;
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
          { '$company_info.organization_name$': { [Op.like]: `%${search}%` } },
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
        { model: ItemCategory, attributes: ['name'], as: 'ItemCategory' },
        { model: ItemSubCategory, attributes: ['name'], as: 'ItemSubCategory' },
        { model: Items, attributes: ['name'], as: 'Items' },
        { model: CompanyInfo, attributes: ['organization_name', 'organization_slug'], as: 'company_info' },
        { model: UploadImage, attributes: ['file'], as: 'file' },
      ],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      code: row.code,
      article_number: row.article_number,
      category: row.category,
      category_name: row.Categories ? row.Categories.name : null,
      sub_category: row.sub_category,
      subcategory_name: row.SubCategories ? row.SubCategories.name : null,
      item_category_id: row.item_category_id,
      item_category_name: row.ItemCategory ? row.ItemCategory.name : null,
      item_subcategory_id: row.item_subcategory_id,
      item_subcategory_name: row.ItemSubCategory ? row.ItemSubCategory.name : null,
      item_id: row.item_id,
      item_name: row.Items ? row.Items.name : null,
      color_name: null,
      company_id: row.company_id,
      company_name: row.company_info ? row.company_info.organization_name : null,
      company_slug: row.company_info ? row.company_info.organization_slug : null,
      file_id: row.file_id,
      file_name: row.file ? row.file.file : null,
      status: row.status,
      getStatus: row.status === 1 ? 'Public' : 'Draft',
      is_approve: row.is_approve,
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

exports.updateProductsDeleteStatus = async (req, res) => {
  try {
    const { is_delete } = req.body;
    if (is_delete !== 0 && is_delete !== 1) {
      return res.status(400).json({ message: 'Invalid delete status. Use 1 (Active) or 0 (Deactive).' });
    }
    const openEnquiries = await Products.findByPk(req.params.id);
    if (!openEnquiries) return res.status(404).json({ message: 'Products not found' });
    openEnquiries.is_delete = is_delete;
    await openEnquiries.save();
    res.json({ message: 'Products is removed', openEnquiries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/*exports.getItemHierarchy = async (req, res) => {
  try {
    const itemId = req.params.item_id;
    const product = await Products.findOne({
      where: { item_id: itemId },
      include: [
        { model: Categories, as: 'Categories', attributes: ['id', 'name'] },
        { model: SubCategories, as: 'SubCategories', attributes: ['id', 'name'] },
        { model: ItemCategory, as: 'ItemCategory', attributes: ['id', 'name'] },
        { model: ItemSubCategory, as: 'ItemSubCategory', attributes: ['id', 'name'] },
        { model: Items, as: 'Items', attributes: ['id', 'name'] },
      ]
    });
    const singleItem = await ItemSubCategory.findOne({
      where: { id: itemId }
    });


    res.json({
      category_id: product?.category_id ?? singleItem?.category_id ?? '',
      sub_category_id: product?.sub_category_id ?? singleItem?.subcategory_id ?? '',
      item_category_id: product?.item_category_id ?? singleItem?.item_category_id ?? '',
      item_subcategory_id: product?.item_subcategory_id ?? singleItem?.id ?? '',
      // item_id: product?.item_id ?? singleItem?.item_id ?? '',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};*/
exports.getItemHierarchy = async (req, res) => {
  try {
    const { type, item_id } = req.params;

    switch (type) {
      case 'category': {
        const c = await Categories.findByPk(item_id);
        if (!c) break;

        return res.json({
          category_id: c.id,
          sub_category_id: '',
          item_category_id: '',
          item_subcategory_id: '',
          item_id: ''
        });
      }

      case 'subcategory': {
        const sc = await SubCategories.findByPk(item_id);
        if (!sc) break;

        return res.json({
          category_id: sc.category_id,
          sub_category_id: sc.id,
          item_category_id: '',
          item_subcategory_id: '',
          item_id: ''
        });
      }

      case 'item_category': {
        const ic = await ItemCategory.findByPk(item_id);
        if (!ic) break;

        return res.json({
          category_id: ic.category_id,
          sub_category_id: ic.subcategory_id,
          item_category_id: ic.id,
          item_subcategory_id: '',
          item_id: ''
        });
      }

      case 'item_subcategory': {
        const isc = await ItemSubCategory.findByPk(item_id);
        if (!isc) break;

        return res.json({
          category_id: isc.category_id,
          sub_category_id: isc.subcategory_id,
          item_category_id: isc.item_category_id,
          item_subcategory_id: isc.id,
          item_id: ''
        });
      }

      case 'item': {
        const item = await Items.findByPk(item_id);
        if (!item) break;

        return res.json({
          category_id: item.category_id,
          sub_category_id: item.subcategory_id,
          item_category_id: item.item_category_id,
          item_subcategory_id: item.item_subcategory_id,
          item_id: item.id
        });
      }
    }

    return res.status(404).json({ message: 'Invalid type or not found' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFilteredCompanies = async (req, res) => {
  try {
    const {
      organization_name,
      company_location,
      contact_person,
      brief_company,
      company_phone,
      company_website,
      company_email,
      core_activity,
      activity,
      dateRange = '',
      startDate,
      endDate
    } = req.query;

    // Base where condition
    const where = {
      is_delete: 0,
    };

    if (organization_name) where.organization_name = { [Op.like]: `%${organization_name}%` };
    if (company_location) where.company_location = { [Op.like]: `%${company_location}%` };
    if (contact_person) where.contact_person = { [Op.like]: `%${contact_person}%` };
    if (brief_company) where.brief_company = { [Op.like]: `%${brief_company}%` };
    if (company_phone) where.company_phone = { [Op.like]: `%${company_phone}%` };
    if (company_website) where.company_website = { [Op.like]: `%${company_website}%` };
    if (company_email) where.company_email = { [Op.like]: `%${company_email}%` };
    if (core_activity) where.core_activity = core_activity;
    if (activity) where.activity = activity;

    // Date filter
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
      where.created_at = dateCondition;
    }

    // Fetch companies with associations
    const companies = await CompanyInfo.findAll({
      where,
      include: [
        { model: CoreActivity, as: 'CoreActivity', attributes: ['name'] },
        { model: Activity, as: 'Activity', attributes: ['name'] },
      ]
    });

    // Map the results
    const data = companies.map(company => {
      const s = company.toJSON();

      return {
        id: s.id,
        organization_name: s.organization_name,
        company_location: s.company_location,
        contact_person: s.contact_person,
        brief_company: s.brief_company,
        coreactivity_name: s.CoreActivity?.name || 'NA',
        activity_name: s.Activity?.name || 'NA',
        created_at: s.created_at
      };
    });

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getFilteredProducts = async (req, res) => {
  try {
    const {
      title,
      user_id,
      category,
      sub_category,
      company_id,
      code,
      article_number,
      product_service,
      is_gold,
      is_featured,
      is_recommended,
      best_product,
      dateRange = '',
      startDate,
      endDate
    } = req.query;

    // Base where condition
    const where = {
      is_delete: 0,
    };

    if (title) where.title = { [Op.like]: `%${title}%` };
    if (user_id) where.user_id = user_id;
    if (category) where.category = category;
    if (sub_category) where.sub_category = sub_category;
    if (company_id) where.company_id = company_id;
    if (code) where.code = { [Op.like]: `%${code}%` };
    if (article_number) where.article_number = { [Op.like]: `%${article_number}%` };
    if (product_service) where.product_service = product_service;
    if (is_gold) where.is_gold = is_gold;
    if (is_featured) where.is_featured = is_featured;
    if (is_recommended) where.is_recommended = is_recommended;
    if (best_product) where.best_product = best_product;

    // Date filter
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
      where.created_at = dateCondition;
    }

    // Fetch companies with associations
    const companies = await Products.findAll({
      where,
      include: [
        { model: Users, as: 'Users', attributes: ['fname', 'lname'] },
        { model: Categories, as: 'Categories', attributes: ['name'] },
        { model: SubCategories, as: 'SubCategories', attributes: ['name'] },
        { model: CompanyInfo, as: 'company_info', attributes: ['organization_name'] },
      ]
    });

    // Map the results
    const data = companies.map(company => {
      const s = company.toJSON();

      return {
        id: s.id,
        title: s.title,
        user_name: s.Users ? `${s.Users.fname} ${s.Users.lname}` : 'NA',
        category_name: s.Categories?.name || 'NA',
        subcategory_name: s.SubCategories?.name || 'NA',
        company_name: s.company_info?.organization_name || 'NA',
        code: s.code,
        article_number: s.article_number,
        product_service: '',
        product_service_name: '',
        is_gold: s.is_gold == 1 ? 'Yes' : 'No',
        is_featured: s.is_featured == 1 ? 'Yes' : 'No',
        is_recommended: s.is_recommended == 1 ? 'Yes' : 'No',
        best_product: s.best_product == 1 ? 'Yes' : 'No',
        created_at: s.created_at
      };
    });

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateAccountStatus = async (req, res) => {
  try {
    const { is_approve } = req.body;
    if (is_approve !== 0 && is_approve !== 1) {
      return res.status(400).json({ message: 'Invalid is_approve. Use 1 (Active) or 0 (Deactive).' });
    }
    const products = await Products.findByPk(req.params.id);
    if (!products) return res.status(404).json({ message: 'Product not found' });
    products.is_approve = is_approve;
    await products.save();
    res.json({ message: 'Product approved', products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};