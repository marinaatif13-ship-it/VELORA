const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// ========== GET CART ==========
router.get('/', protect, async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user.id })
            .populate('items.product', 'name price images stock');
        
        if (!cart) {
            cart = await Cart.create({
                user: req.user.id,
                items: [],
                totalPrice: 0,
                totalItems: 0
            });
        }
        
        res.json({
            success: true,
            cart
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ========== ADD ITEM TO CART ==========
router.post('/add', protect, async (req, res) => {
    try {
        const { productId, quantity = 1, size, color } = req.body;
        
        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: `Not enough stock. Available: ${product.stock}`
            });
        }
        
        let cart = await Cart.findOne({ user: req.user.id });
        
        if (!cart) {
            cart = await Cart.create({
                user: req.user.id,
                items: []
            });
        }
        
        // Check if item already exists in cart
        const existingItem = cart.items.find(
            item => item.product.toString() === productId
        );
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({
                product: productId,
                name: product.name,
                image: product.images[0]?.url || '',
                price: product.price,
                quantity,
                size,
                color
            });
        }
        
        await cart.save();
        
        res.json({
            success: true,
            cart
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ========== UPDATE CART ITEM QUANTITY ==========
router.put('/update/:productId', protect, async (req, res) => {
    try {
        const { quantity } = req.body;
        const { productId } = req.params;
        
        const cart = await Cart.findOne({ user: req.user.id });
        
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }
        
        const item = cart.items.find(
            item => item.product.toString() === productId
        );
        
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }
        
        const product = await Product.findById(productId);
        if (product && product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: `Not enough stock. Available: ${product.stock}`
            });
        }
        
        if (quantity <= 0) {
            cart.items = cart.items.filter(
                item => item.product.toString() !== productId
            );
        } else {
            item.quantity = quantity;
        }
        
        await cart.save();
        
        res.json({
            success: true,
            cart
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ========== REMOVE ITEM FROM CART ==========
router.delete('/remove/:productId', protect, async (req, res) => {
    try {
        const { productId } = req.params;
        
        const cart = await Cart.findOne({ user: req.user.id });
        
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }
        
        cart.items = cart.items.filter(
            item => item.product.toString() !== productId
        );
        
        await cart.save();
        
        res.json({
            success: true,
            cart
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ========== CLEAR CART ==========
router.delete('/clear', protect, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });
        
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }
        
        cart.items = [];
        await cart.save();
        
        res.json({
            success: true,
            message: 'Cart cleared successfully'
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