const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a product name'],
        trim: true,
        maxlength: [100, 'Name cannot be more than 100 characters']
    },
    slug: {
        type: String,
        unique: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    price: {
        type: Number,
        required: [true, 'Please add a price'],
        min: [0, 'Price must be greater than 0']
    },
    originalPrice: {
        type: Number,
        default: null
    },
    category: {
        type: String,
        required: [true, 'Please add a category'],
        enum: ['men', 'women', 'luxury', 'sport', 'classic', 'automatic', 'quartz']
    },
    gender: {
        type: String,
        enum: ['men', 'women', 'unisex'],
        default: 'unisex'
    },
    brand: {
        type: String,
        required: [true, 'Please add a brand']
    },
    images: [{
        url: {
            type: String,
            required: true
        },
        publicId: String,
        alt: String
    }],
    colors: [String],
    materials: {
        case: String,
        strap: String,
        glass: String
    },
    movement: {
        type: String,
        enum: ['automatic', 'quartz', 'mechanical', 'solar']
    },
    features: [String],
    stock: {
        type: Number,
        required: [true, 'Please add stock quantity'],
        min: [0, 'Stock cannot be negative'],
        default: 0
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    numReviews: {
        type: Number,
        default: 0
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isNew: {
        type: Boolean,
        default: false
    },
    isOnSale: {
        type: Boolean,
        default: false
    },
    discountPercent: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    tags: [String],
    reviews: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        name: String,
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Create slug from name
ProductSchema.pre('save', function(next) {
    if (this.isModified('name')) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }
    next();
});

// Calculate discount price
ProductSchema.virtual('discountPrice').get(function() {
    if (this.discountPercent > 0) {
        return this.price * (1 - this.discountPercent / 100);
    }
    return this.price;
});

// Ensure virtuals are included in JSON
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', ProductSchema);