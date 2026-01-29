// ========================================
// FILE: server.js - Enhanced Commerce Service
// ========================================
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const axios = require('axios');

const app = express();
const PORT = 8082;

// VULN: Allow all origins
app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://scaler_admin:VulnerablePassword123!@postgres:5432/scaler_db'
});

// ENDPOINT 1: Get All Products
// VULN: No pagination limit
app.get('/api/v1/products', async (req, res) => {
  const { category, search, limit = 1000 } = req.query;
  
  try {
    let query = 'SELECT * FROM products WHERE 1=1';
    
    if (search) {
      // VULN: SQL Injection
      query += ` AND name LIKE '%${search}%'`;
    }
    
    query += ` LIMIT ${limit}`; // VULN: No max limit
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    // VULN: Exposing detailed error
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// ENDPOINT 2: Get Single Product
// VULN: SQL Injection
app.get('/api/v1/products/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // VULN: SQL Injection
    const query = `SELECT * FROM products WHERE id = ${id}`;
    const result = await pool.query(query);
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT 3: Create Product
// VULN: BFLA - No admin check
app.post('/api/v1/products', async (req, res) => {
  const { name, description, price, stock } = req.body;
  
  // VULN: No authentication/authorization
  // VULN: No input validation
  
  try {
    const result = await pool.query(
      'INSERT INTO products (name, description, price, stock) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, price, stock]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT 4: Update Product
// VULN: BFLA - No admin check, Price manipulation
app.put('/api/v1/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock } = req.body;
  
  // VULN: Can manipulate product price
  try {
    const result = await pool.query(
      'UPDATE products SET name = $1, description = $2, price = $3, stock = $4 WHERE id = $5 RETURNING *',
      [name, description, price, stock, id]
    );
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT 5: Delete Product
// VULN: BFLA - No admin check
app.delete('/api/v1/products/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT 6: Create Order
// VULN: Price manipulation, No payment verification
app.post('/api/v1/orders', async (req, res) => {
  const { user_id, items } = req.body;
  
  // VULN: No authentication
  // VULN: Accepting price from client
  
  try {
    let totalAmount = 0;
    
    // VULN: Using client-provided prices instead of fetching from DB
    for (const item of items) {
      totalAmount += item.price * item.quantity;
    }
    
    const orderResult = await pool.query(
      'INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING id',
      [user_id, totalAmount, 'pending']
    );
    
    const orderId = orderResult.rows[0].id;
    
    for (const item of items) {
      await pool.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderId, item.product_id, item.quantity, item.price]
      );
    }
    
    res.status(201).json({
      order_id: orderId,
      total_amount: totalAmount,
      status: 'pending',
      message: 'Order created successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT 7: Get Order
// VULN: BOLA - Can view any order
app.get('/api/v1/orders/:id', async (req, res) => {
  const { id } = req.params;
  
  // VULN: No authorization check
  try {
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderResult.rows[0];
    
    const itemsResult = await pool.query(
      'SELECT oi.*, p.name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1',
      [id]
    );
    
    res.json({
      ...order,
      items: itemsResult.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT 8: Update Order Price
// VULN: BFLA - No admin check, Price manipulation
app.put('/api/v1/orders/:id/price', async (req, res) => {
  const { id } = req.params;
  const { total_amount } = req.body;
  
  // VULN: Anyone can update order price
  try {
    await pool.query(
      'UPDATE orders SET total_amount = $1 WHERE id = $2',
      [total_amount, id]
    );
    
    res.json({ 
      message: 'Price updated successfully',
      order_id: id,
      new_amount: total_amount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT 9: Apply Coupon
// VULN: No rate limiting, Predictable coupons
app.post('/api/v1/orders/:id/coupon', async (req, res) => {
  const { id } = req.params;
  const { coupon_code } = req.body;
  
  // VULN: No rate limiting - can try unlimited coupons
  try {
    const orderResult = await pool.query(
      'SELECT total_amount FROM orders WHERE id = $1',
      [id]
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    let discount = 0;
    
    // VULN: Predictable coupon codes
    if (coupon_code === 'SAVE10') {
      discount = 0.10;
    } else if (coupon_code === 'SAVE20') {
      discount = 0.20;
    } else if (coupon_code === 'SAVE50') {
      discount = 0.50;
    } else if (coupon_code === 'ADMIN100') {
      discount = 1.0; // VULN: Free order
    } else {
      return res.status(400).json({ error: 'Invalid coupon code' });
    }
    
    const currentAmount = parseFloat(orderResult.rows[0].total_amount);
    const newAmount = currentAmount * (1 - discount);
    
    await pool.query(
      'UPDATE orders SET total_amount = $1 WHERE id = $2',
      [newAmount, id]
    );
    
    res.json({
      original_amount: currentAmount,
      discount_applied: (discount * 100) + '%',
      new_amount: newAmount,
      savings: currentAmount - newAmount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT 10: Process Payment
// VULN: No proper payment validation, Logging sensitive data
app.post('/api/v1/payments/process', async (req, res) => {
  const { order_id, amount, card_number, cvv, expiry } = req.body;
  
  // VULN: No payment gateway integration
  // VULN: Logging sensitive payment data
  console.log('Payment processing:', { 
    order_id, 
    amount, 
    card_number,  // VULN: Logging credit card
    cvv,          // VULN: Logging CVV
    expiry 
  });
  
  try {
    // VULN: No actual payment verification
    await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2',
      ['paid', order_id]
    );
    
    // Store credit card (VULN: Storing sensitive payment data)
    await pool.query(
      'UPDATE users SET credit_card = $1 WHERE id = (SELECT user_id FROM orders WHERE id = $2)',
      [card_number, order_id]
    );
    
    res.json({
      success: true,
      transaction_id: Math.random().toString(36).substr(2, 9),
      message: 'Payment processed successfully',
      order_id: order_id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT 11: Get User Orders
// VULN: BOLA - Can view any user's orders
app.get('/api/v1/users/:user_id/orders', async (req, res) => {
  const { user_id } = req.params;
  const { limit = 100 } = req.query;  // VULN: No max limit
  
  // VULN: No authorization check
  try {
    // VULN: SQL Injection
    const result = await pool.query(
      `SELECT * FROM orders WHERE user_id = ${user_id} LIMIT ${limit}`
    );
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// ENDPOINT 12: Cancel Order
// VULN: BOLA - Can cancel anyone's order
app.put('/api/v1/orders/:id/cancel', async (req, res) => {
  const { id } = req.params;
  
  // VULN: No authorization check
  try {
    await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2',
      ['cancelled', id]
    );
    
    res.json({ message: 'Order cancelled successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT 13: Get All Orders (Admin)
// VULN: BFLA - No admin check
app.get('/api/v1/admin/orders', async (req, res) => {
  const { status, limit = 1000 } = req.query;
  
  // VULN: No admin authorization
  try {
    let query = 'SELECT o.*, u.username, u.email FROM orders o JOIN users u ON o.user_id = u.id';
    
    if (status) {
      query += ` WHERE o.status = '${status}'`; // VULN: SQL Injection
    }
    
    query += ` ORDER BY o.created_at DESC LIMIT ${limit}`;
    
    const result = await pool.query(query);
    
    // VULN: Exposing user email and details
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT 14: Update Order Status
// VULN: BFLA - No admin check
app.put('/api/v1/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  // VULN: Anyone can change order status
  try {
    await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2',
      [status, id]
    );
    
    res.json({ 
      message: 'Order status updated',
      order_id: id,
      new_status: status
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT 15: Get Order Statistics
// VULN: Information disclosure
app.get('/api/v1/admin/stats', async (req, res) => {
  // VULN: No admin check
  try {
    const totalOrders = await pool.query('SELECT COUNT(*) as count FROM orders');
    const totalRevenue = await pool.query('SELECT SUM(total_amount) as revenue FROM orders WHERE status = $1', ['paid']);
    const pendingOrders = await pool.query('SELECT COUNT(*) as count FROM orders WHERE status = $1', ['pending']);
    
    res.json({
      total_orders: totalOrders.rows[0].count,
      total_revenue: totalRevenue.rows[0].revenue || 0,
      pending_orders: pendingOrders.rows[0].count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT 16: Bulk Order Creation
// VULN: No rate limiting
app.post('/api/v1/orders/bulk', async (req, res) => {
  const { orders } = req.body;
  
  // VULN: No rate limiting - can create unlimited orders
  const created = [];
  
  try {
    for (const order of orders) {
      const result = await pool.query(
        'INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING id',
        [order.user_id, order.total_amount, 'pending']
      );
      created.push(result.rows[0].id);
    }
    
    res.status(201).json({
      message: `${created.length} orders created`,
      order_ids: created
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'commerce' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Commerce Service running on port ${PORT}`);
});
