const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// ========== CREATE ORDER ==========
router.post('/', protect, async (req, res) => {
    try {
        const {
            shippingAddress,
            paymentMethod,
            notes
        } = req.body;
        
        // Get user's cart
        const cart = await Cart.findOne({ user: req.user.id });
        
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }
        
        // Populate product details
        const populatedCart = await cart.populate('items.product');
        
        // Check stock
        for (const item of populatedCart.items) {
            if (item.product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Not enough stock for ${item.product.name}. Available: ${item.product.stock}`
                });
            }
        }
        
        // Create order items
        const orderItems = populatedCart.items.map(item => ({
            product: item.product._id,
            name: item.product.name,
            quantity: item.quantity,
            image: item.product.images[0]?.url || '',
            price: item.product.price,
            size: item.size,
            color: item.color
        }));
        
        // Calculate prices
        const itemsPrice = cart.totalPrice;
        const shippingPrice = itemsPrice > 100 ? 0 : 10;
        const taxPrice = itemsPrice * 0.14; // 14% VAT
        const totalPrice = itemsPrice + shippingPrice + taxPrice;
        
        // Create order
        const order = await Order.create({
            user: req.user.id,
            orderItems,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            shippingPrice,
            taxPrice,
            totalPrice,
            notes,
            isPaid: paymentMethod !== 'cash_on_delivery',
            paidAt: paymentMethod !== 'cash_on_delivery' ? new Date() : null
        });
        
        // Update stock
        for (const item of populatedCart.items) {
            const product = await Product.findById(item.product._id);
            product.stock -= item.quantity;
            await product.save();
        }
        
        // Clear cart
        await Cart.findOneAndDelete({ user: req.user.id });
        
        res.status(201).json({
            success: true,
            order
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ========== GET USER ORDERS ==========
router.get('/my-orders', protect, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .populate('orderItems.product', 'name images');
        
        res.json({
            success: true,
            orders
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ========== GET SINGLE ORDER ==========
router.get('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email phone')
            .populate('orderItems.product', 'name images');
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        // Check if user owns this order or is admin
        if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this order'
            });
        }
        
        res.json({
            success: true,
            order
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ========== UPDATE ORDER STATUS (Admin Only) ==========
router.put('/:id/status', protect, async (req, res) => {
    try {
        const { status, trackingNumber } = req.body;
        
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        order.status = status;
        if (trackingNumber) order.trackingNumber = trackingNumber;
        
        if (status === 'delivered') {
            order.isDelivered = true;
            order.deliveredAt = new Date();
        }
        
        await order.save();
        
        res.json({
            success: true,
            order
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ========== CANCEL ORDER ==========
router.put('/:id/cancel', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        // Check if user owns this order
        if (order.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }
        
        if (order.status === 'delivered' || order.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Order cannot be cancelled'
            });
        }
        
        order.status = 'cancelled';
        await order.save();
        
        // Restore stock
        for (const item of order.orderItems) {
            const product = await Product.findById(item.product);
            if (product) {
                product.stock += item.quantity;
                await product.save();
            }
        }
        
        res.json({
            success: true,
            message: 'Order cancelled successfully'
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