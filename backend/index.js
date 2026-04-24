const express = require("express");
const cors = require("cors");
const axios = require("axios");
const pool = require("./db");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
// Auth endpoints (now using PostgreSQL)
// ─────────────────────────────────────────────

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT user_code, name, email FROM users WHERE email = $1 AND password = $2",
      [email, password]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const user = result.rows[0];
    res.json({
      user: { id: user.user_code, name: user.name, email: user.email },
      token: `token_${user.user_code}`,
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // Check if email exists
    const exists = await pool.query("SELECT 1 FROM users WHERE email = $1", [email]);
    if (exists.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Get next user code
    const countResult = await pool.query("SELECT COUNT(*) FROM users");
    const userCode = `u${parseInt(countResult.rows[0].count) + 1}`;

    await pool.query(
      "INSERT INTO users (user_code, name, email, password) VALUES ($1, $2, $3, $4)",
      [userCode, name, email, password]
    );

    res.json({
      user: { id: userCode, name, email },
      token: `token_${userCode}`,
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ─────────────────────────────────────────────
// Cart endpoints (PostgreSQL backed)
// ─────────────────────────────────────────────

app.get("/api/cart/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT c.product_code, c.quantity, p.name, p.category, p.price, p.rating
       FROM cart_items c
       JOIN products p ON c.product_code = p.product_code
       WHERE c.user_code = $1
       ORDER BY c.added_at DESC`,
      [userId]
    );
    const items = result.rows.map((r) => ({
      id: r.product_code,
      name: r.name,
      category: r.category,
      price: parseFloat(r.price),
      rating: parseFloat(r.rating),
      quantity: r.quantity,
    }));
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    res.json({ items, total: Math.round(total * 100) / 100 });
  } catch (err) {
    console.error("Cart fetch error:", err.message);
    res.status(500).json({ error: "Failed to get cart" });
  }
});

app.post("/api/cart/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId } = req.body;
    await pool.query(
      `INSERT INTO cart_items (user_code, product_code, quantity)
       VALUES ($1, $2, 1)
       ON CONFLICT (user_code, product_code)
       DO UPDATE SET quantity = cart_items.quantity + 1`,
      [userId, productId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Cart add error:", err.message);
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

app.delete("/api/cart/:userId/:productId", async (req, res) => {
  try {
    const { userId, productId } = req.params;
    await pool.query(
      "DELETE FROM cart_items WHERE user_code = $1 AND product_code = $2",
      [userId, productId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Cart remove error:", err.message);
    res.status(500).json({ error: "Failed to remove from cart" });
  }
});

// ─────────────────────────────────────────────
// Record interaction (for ML graph updates)
// ─────────────────────────────────────────────

app.post("/api/interact", async (req, res) => {
  try {
    const { userId, productId, type } = req.body;
    const weights = { purchase: 5, add_to_cart: 3, view: 1 };
    const weight = weights[type] || 1;

    await pool.query(
      `INSERT INTO interactions (user_code, product_code, interaction_type, weight)
       VALUES ($1, $2, $3, $4)`,
      [userId, productId, type, weight]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Interaction error:", err.message);
    res.status(500).json({ error: "Failed to record interaction" });
  }
});

// ─────────────────────────────────────────────
// Proxy to ML service
// ─────────────────────────────────────────────

app.get("/api/recommendations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const topK = req.query.top_k || 5;
    const response = await axios.get(
      `${ML_SERVICE_URL}/recommendations/${userId}?top_k=${topK}`
    );
    res.json(response.data);
  } catch (err) {
    console.error("ML service error:", err.message);
    res.status(500).json({ error: "Failed to get recommendations" });
  }
});

app.get("/api/similar/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const topK = req.query.top_k || 5;
    const response = await axios.get(
      `${ML_SERVICE_URL}/similar/${productId}?top_k=${topK}`
    );
    res.json(response.data);
  } catch (err) {
    console.error("ML service error:", err.message);
    res.status(500).json({ error: "Failed to get similar products" });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT product_code as id, name, category, price, rating FROM products ORDER BY name"
    );
    const products = result.rows.map((r) => ({
      ...r,
      price: parseFloat(r.price),
      rating: parseFloat(r.rating),
    }));
    res.json({ products });
  } catch (err) {
    console.error("Products error:", err.message);
    res.status(500).json({ error: "Failed to get products" });
  }
});

app.get("/api/products/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await pool.query(
      "SELECT product_code as id, name, category, price, rating FROM products WHERE product_code = $1",
      [productId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    const product = result.rows[0];
    product.price = parseFloat(product.price);
    product.rating = parseFloat(product.rating);
    res.json({ product });
  } catch (err) {
    console.error("Product error:", err.message);
    res.status(500).json({ error: "Failed to get product" });
  }
});

app.get("/api/search", async (req, res) => {
  try {
    const query = req.query.q || "";
    const result = await pool.query(
      `SELECT product_code as id, name, category, price, rating
       FROM products
       WHERE LOWER(name) LIKE $1 OR LOWER(category) LIKE $1
       ORDER BY name`,
      [`%${query.toLowerCase()}%`]
    );
    const results = result.rows.map((r) => ({
      ...r,
      price: parseFloat(r.price),
      rating: parseFloat(r.rating),
    }));
    res.json({ query, results });
  } catch (err) {
    console.error("Search error:", err.message);
    res.status(500).json({ error: "Search failed" });
  }
});

app.get("/api/popular", async (req, res) => {
  try {
    const topK = req.query.top_k || 5;
    const response = await axios.get(
      `${ML_SERVICE_URL}/popular?top_k=${topK}`
    );
    res.json(response.data);
  } catch (err) {
    console.error("ML service error:", err.message);
    res.status(500).json({ error: "Failed to get popular products" });
  }
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", service: "smartshop-backend", database: "connected" });
  } catch {
    res.json({ status: "degraded", service: "smartshop-backend", database: "disconnected" });
  }
});

app.listen(PORT, () => {
  console.log(`[✓] SmartShop backend running on http://localhost:${PORT}`);
});