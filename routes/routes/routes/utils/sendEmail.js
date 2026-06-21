const nodemailer = require('nodemailer');

// Send email function
const sendEmail = async (options) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `VELORA Store <${process.env.EMAIL_USER}>`,
            to: options.email,
            subject: options.subject,
            html: options.html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Email error:', error);
        return false;
    }
};

// Send order confirmation email
const sendOrderConfirmation = async (order, user) => {
    const orderItemsHtml = order.orderItems.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">$${item.price}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">$${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
    `).join('');

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
            <div style="background: #e91e63; padding: 20px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
                <h1 style="margin: 0;">⌚ VELORA</h1>
                <p style="margin: 5px 0 0;">Luxury Watches</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #333;">Order Confirmation</h2>
                <p style="color: #666;">Dear ${user.name},</p>
                <p style="color: #666;">Thank you for your order! Here are your order details:</p>
                
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                    <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                    <p><strong>Payment Method:</strong> ${order.paymentMethod.replace('_', ' ').toUpperCase()}</p>
                </div>
                
                <h3 style="color: #333;">Order Items</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    <thead>
                        <tr style="background: #e91e63; color: white;">
                            <th style="padding: 10px; text-align: left;">Product</th>
                            <th style="padding: 10px; text-align: center;">Qty</th>
                            <th style="padding: 10px; text-align: right;">Price</th>
                            <th style="padding: 10px; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orderItemsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" style="padding: 10px; text-align: right; border-top: 2px solid #333;"><strong>Subtotal</strong></td>
                            <td style="padding: 10px; text-align: right; border-top: 2px solid #333;"><strong>$${order.itemsPrice.toFixed(2)}</strong></td>
                        </tr>
                        <tr>
                            <td colspan="3" style="padding: 10px; text-align: right;"><strong>Shipping</strong></td>
                            <td style="padding: 10px; text-align: right;"><strong>$${order.shippingPrice.toFixed(2)}</strong></td>
                        </tr>
                        <tr>
                            <td colspan="3" style="padding: 10px; text-align: right;"><strong>Tax (14%)</strong></td>
                            <td style="padding: 10px; text-align: right;"><strong>$${order.taxPrice.toFixed(2)}</strong></td>
                        </tr>
                        <tr>
                            <td colspan="3" style="padding: 10px; text-align: right; font-size: 18px; border-top: 2px solid #e91e63;"><strong>Total</strong></td>
                            <td style="padding: 10px; text-align: right; font-size: 18px; color: #e91e63; border-top: 2px solid #e91e63;"><strong>$${order.totalPrice.toFixed(2)}</strong></td>
                        </tr>
                    </tfoot>
                </table>
                
                <div style="margin: 20px 0; padding: 15px; background: #f0f8ff; border-radius: 8px;">
                    <h4 style="margin: 0 0 10px;">Shipping Address</h4>
                    <p style="margin: 0; color: #666;">${order.shippingAddress.fullName}</p>
                    <p style="margin: 0; color: #666;">${order.shippingAddress.phone}</p>
                    <p style="margin: 0; color: #666;">${order.shippingAddress.street}</p>
                    <p style="margin: 0; color: #666;">${order.shippingAddress.city}, ${order.shippingAddress.country}</p>
                </div>
                
                <p style="color: #666; margin-top: 20px;">We will notify you when your order is shipped.</p>
                <p style="color: #666;">Thank you for shopping at VELORA! ⌚</p>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                <p>© 2026 VELORA. All rights reserved.</p>
                <p>Questions? Contact us at support@velora.com</p>
            </div>
        </div>
    `;

    return await sendEmail({
        email: user.email,
        subject: `Order Confirmation - ${order.orderNumber}`,
        html
    });
};

module.exports = { sendEmail, sendOrderConfirmation };