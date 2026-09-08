const Product = require('../models/Product');

// GET /api/products - public catalogue with search, filter, sort
exports.getProducts = async (req, res, next) => {
  try {
    const { search, category, sort, availability } = req.query;
    const query = {};

    if (search) {
      query.$text = { $search: search };
    }
    if (category) {
      query.category = category;
    }
    if (availability === 'in_stock') {
      query.isAvailable = true;
      query.stockQuantity = { $gt: 0 };
    } else if (availability === 'out_of_stock') {
      query.stockQuantity = { $lte: 0 };
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'name') sortOption = { name: 1 };
    else if (sort === 'availability') sortOption = { stockQuantity: -1 };

    const products = await Product.find(query).sort(sortOption);
    res.json({ success: true, products });
  } catch (err) {
    next(err);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category');
    res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
};
