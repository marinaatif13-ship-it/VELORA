const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/auth');

// ========== GET ALL PRODUCTS ==========
router.get('/', async (req, res) => {
    try {
        const { 
            category, 
            gender,
            brand, 
            search, 
            minPrice, 
            maxPrice, 
            sort, 
            featured, 
            new: isNew,
            limit = 20, 
            page = 1 
        } = req.query;
        
        let query = {};
        
        // Search filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (category) query.category = category;
        if (gender) query.gender = gender;
        if (brand) query.brand = brand;
        if (featured === 'true') query.isFeatured = true;
        if (isNew === 'true') query.isNew = true;
        
        // Price range
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }
        
        // Sorting
        let sortOption = {};
        if (sort) {
            switch(sort) {
                case 'price-asc': sortOption = { price: 1 }; break;
                case 'price-desc': sortOption = { price: -1 }; break;
                case 'rating': sortOption = { rating: -1 }; break;
                case 'newest': sortOption = { createdAt: -1 }; break;
                case 'popular': sortOption = { numReviews: -1 }; break;
                default: sortOption = { createdAt: -1 };
            }
        } else {
            sortOption = { createdAt: -1 };
        }
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const products = await Product.find(query)
            .sort(sortOption)
            .limit(parseInt(limit))
            .skip(skip);
        
        const total = await Product.countDocuments(query);
        
        res.json({
            success: true,
            products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ========== GET SINGLE PRODUCT ==========
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        res.json({
            success: true,
            product
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ========== GET PRODUCT BY SLUG ==========
router.get('/slug/:slug', async (req, res) => {
    try {
        const product = await Product.findOne({ slug: req.params.slug });
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        res.json({
            success: true,
            product
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ========== CREATE PRODUCT (Admin Only) ==========
router.post('/', [protect, admin], async (req, res) => {
    try {
        const product = await Product.create(req.body);
        
        res.status(201).json({
            success: true,
            product
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
});

// ========== UPDATE PRODUCT (Admin Only) ==========
router.put('/:id', [protect, admin], async (req, res) => {
    try {
        let product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        
        res.json({
            success: true,
            product
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ========== DELETE PRODUCT (Admin Only) ==========
router.delete('/:id', [protect, admin], async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        await product.deleteOne();
        
        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ========== ADD REVIEW ==========
router.post('/:id/reviews', protect, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        const alreadyReviewed = product.reviews.find(
            review => review.user.toString() === req.user.id.toString()
        );
        
        if (alreadyReviewed) {
            return res.status(400).json({
                success: false,
                message: 'Product already reviewed'
            });
        }
        
        const review = {
            user: req.user.id,
            name: req.user.name,
            rating: Number(rating),
            comment
        };
        
        product.reviews.push(review);
        product.numReviews = product.reviews.length;
        product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;
        
        await product.save();
        
        res.status(201).json({
            success: true,
            message: 'Review added successfully'
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ========== GET PRODUCT CATEGORIES ==========
router.get('/categories/all', async (req, res) => {
    try {
        const categories = await Product.distinct('category');
        const brands = await Product.distinct('brand');
        const genders = await Product.distinct('gender');
        
        res.json({
            success: true,
            categories,
            brands,
            genders
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;