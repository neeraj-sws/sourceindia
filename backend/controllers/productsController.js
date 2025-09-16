const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const Products = require('../models/Products');
const Categories = require('../models/Categories');
const SubCategories = require('../models/SubCategories');
const UploadImage = require('../models/UploadImage');
const Users = require('../models/Users');
const getMulterUpload = require('../utils/upload');
const sequelize = require('../config/database');

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
    const products = await Products.findAll({ order: [['id', 'ASC']] });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProductsById = async (req, res) => {
  try {
    const product = await Products.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const fileIds = product.file_ids ? product.file_ids.split(',') : [];
    const associatedImages = await UploadImage.findAll({
      where: {
        id: {
          [Op.in]: fileIds,
        },
      },
      attributes: ['id', 'file'],
    });

    const response = {
      ...product.toJSON(),
      images: associatedImages.map(image => ({
        id: image.id,
        file: image.file,
      })),
    };

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
      Products.count(),
      Products.count({ where: { status: 1 } }),
      Products.count({ where: { status: 0 } }),
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

      // If no main image set → use the first one
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

    // remove from list
    fileIds = fileIds.filter(fid => fid !== imageId.toString());

    // update file_id (main image) if it was removed
    let newFileId = product.file_id?.toString();
    if (newFileId === imageId.toString()) {
      newFileId = fileIds.length > 0 ? fileIds[0] : null;
    }

    // delete file record + physical file
    const imageToDelete = await UploadImage.findByPk(imageId);
    if (imageToDelete && imageToDelete.file) {
      const filePath = path.join(__dirname, `../${imageToDelete.file}`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      await imageToDelete.destroy();
    }

    // update product
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

    // Handle deletion for single or multiple images (file_ids)
    if (product.file_ids) {
      const fileIds = product.file_ids.split(',');  // Split the comma-separated list of file_ids
      for (const fileId of fileIds) {
        const uploadImage = await UploadImage.findByPk(fileId);
        if (uploadImage) {
          const oldImagePath = path.resolve(uploadImage.file);  // Resolve the full path of the image
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);  // Delete the image file from the filesystem
          }
          await uploadImage.destroy();  // Delete the image record from the UploadImage table
        }
      }
    }

    // Now delete the product
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

exports.getAllProductsServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
    } = req.query;
    const validColumns = ['id', 'title', 'created_at', 'updated_at', 'category_name'];
    const sortDirection = (sort === 'DESC' || sort === 'ASC') ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);
    let order = [];
    if (sortBy === 'category_name') {
      order = [[{ model: Categories, as: 'Categories' }, 'name', sortDirection]];
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }
    const where = {};
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { '$Categories.name$': { [Op.like]: `%${search}%` } }
      ];
    }
    const totalRecords = await Products.count();
    const { count: filteredRecords, rows } = await Products.findAndCountAll({
      where,
      order,
      limit: limitValue,
      offset,
      include: [
        { model: Categories, attributes: ['name'], as: 'Categories' },
        { model: UploadImage, attributes: ['file'], as: 'file' },
      ],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      title: row.title,
      category: row.category,
      category_name: row.Categories ? row.Categories.name : null,
      file_id: row.file_id,
      file_name: row.file ? row.file.file : null,
      status: row.status,
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
