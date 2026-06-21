// ========================================
// VELORA - BACKEND SERVER
// Luxury Watches Store API
// ========================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./auth');
const productRoutes = require('./routes/routes/products');
const orderRoutes = require('./routes/routes/orders');
const cartRoutes = require('./routes/routes/cart');

// Initialize app
const app = express();

// ========== MIDDLEWARE ==========
app.use(cors({
    origin: ['http://localhost:27017', 'http://127.0.0.1:5500'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========== DATABASE CONNECTION ==========
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch(err => console.error('❌ MongoDB Connection Error:', err.message));

// ========== ROUTES ==========
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);

// ========== HEALTH CHECK ==========
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'VELORA API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// ========== 404 HANDLER ==========
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// ========== ERROR HANDLING ==========
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 VELORA Server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
});