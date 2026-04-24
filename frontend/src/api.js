/*
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

export async function login(email, password) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function register(name, email, password) {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return res.json();
}

export async function getRecommendations(userId, topK = 5) {
  const res = await fetch(`${API_URL}/recommendations/${userId}?top_k=${topK}`);
  return res.json();
}

export async function getSimilarProducts(productId, topK = 5) {
  const res = await fetch(`${API_URL}/similar/${productId}?top_k=${topK}`);
  return res.json();
}

export async function getProducts() {
  const res = await fetch(`${API_URL}/products`);
  return res.json();
}

export async function getProduct(productId) {
  const res = await fetch(`${API_URL}/products/${productId}`);
  return res.json();
}

export async function searchProducts(query) {
  const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
  return res.json();
}

export async function getPopular(topK = 5) {
  const res = await fetch(`${API_URL}/popular?top_k=${topK}`);
  return res.json();
}

export async function getCart(userId) {
  const res = await fetch(`${API_URL}/cart/${userId}`);
  return res.json();
}

export async function addToCart(userId, productId) {
  const res = await fetch(`${API_URL}/cart/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId }),
  });
  return res.json();
}

export async function removeFromCart(userId, productId) {
  const res = await fetch(`${API_URL}/cart/${userId}/${productId}`, {
    method: "DELETE",
  });
  return res.json();
}

export async function recordInteraction(userId, productId, type) {
  const res = await fetch(`${API_URL}/interact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, productId, type }),
  });
  return res.json();
}
*/

// Static demo data — no backend needed for deployment
// In development, this connects to the live backend

const DEMO_MODE = !process.env.REACT_APP_API_URL;
const API_URL = process.env.REACT_APP_API_URL || "";

const PRODUCTS = [
  { id: "p1",  name: "Wireless Noise-Cancelling Headphones", category: "Electronics", price: 299, rating: 4.8 },
  { id: "p2",  name: "Mechanical Keyboard RGB",              category: "Electronics", price: 149, rating: 4.6 },
  { id: "p3",  name: "4K Webcam Pro",                        category: "Electronics", price: 199, rating: 4.5 },
  { id: "p4",  name: "Standing Desk Converter",              category: "Furniture",   price: 249, rating: 4.3 },
  { id: "p5",  name: "Ergonomic Office Chair",               category: "Furniture",   price: 459, rating: 4.7 },
  { id: "p6",  name: "LED Desk Lamp Smart",                  category: "Furniture",   price: 79,  rating: 4.4 },
  { id: "p7",  name: "Running Shoes Ultraboost",             category: "Sports",      price: 180, rating: 4.9 },
  { id: "p8",  name: "Yoga Mat Premium",                     category: "Sports",      price: 65,  rating: 4.6 },
  { id: "p9",  name: "Resistance Bands Set",                 category: "Sports",      price: 29,  rating: 4.3 },
  { id: "p10", name: "Python Crash Course Book",             category: "Books",       price: 35,  rating: 4.8 },
  { id: "p11", name: "Clean Code Book",                      category: "Books",       price: 40,  rating: 4.7 },
  { id: "p12", name: "Instant Pot Duo",                      category: "Kitchen",     price: 89,  rating: 4.7 },
  { id: "p13", name: "Chef Knife Set",                       category: "Kitchen",     price: 120, rating: 4.5 },
  { id: "p14", name: "Air Fryer XL",                         category: "Kitchen",     price: 109, rating: 4.6 },
  { id: "p15", name: "Bluetooth Speaker Waterproof",         category: "Electronics", price: 59,  rating: 4.4 },
];

// Real ensemble results from our benchmark
const RECOMMENDATIONS = {
  u1: [
    { ...PRODUCTS[10], ensemble_score: 0.032787, source: "pr_rank=1 + svd_rank=1" },
    { ...PRODUCTS[6],  ensemble_score: 0.032258, source: "pr_rank=2 + svd_rank=2" },
    { ...PRODUCTS[4],  ensemble_score: 0.031498, source: "pr_rank=4 + svd_rank=3" },
    { ...PRODUCTS[7],  ensemble_score: 0.030579, source: "pr_rank=3 + svd_rank=8" },
    { ...PRODUCTS[5],  ensemble_score: 0.030536, source: "pr_rank=5 + svd_rank=6" },
    { ...PRODUCTS[12], ensemble_score: 0.029845, source: "pr_rank=9 + svd_rank=4" },
    { ...PRODUCTS[13], ensemble_score: 0.029632, source: "pr_rank=10 + svd_rank=5" },
    { ...PRODUCTS[11], ensemble_score: 0.029100, source: "pr_rank=6 + svd_rank=9" },
  ],
  u3: [
    { ...PRODUCTS[14], ensemble_score: 0.032500, source: "pr_rank=1 + svd_rank=1" },
    { ...PRODUCTS[9],  ensemble_score: 0.031800, source: "pr_rank=2 + svd_rank=2" },
    { ...PRODUCTS[1],  ensemble_score: 0.031200, source: "pr_rank=3 + svd_rank=5" },
    { ...PRODUCTS[4],  ensemble_score: 0.030700, source: "pr_rank=4 + svd_rank=3" },
    { ...PRODUCTS[5],  ensemble_score: 0.030100, source: "pr_rank=5 + svd_rank=4" },
    { ...PRODUCTS[3],  ensemble_score: 0.029500, source: "pr_rank=7 + svd_rank=4" },
    { ...PRODUCTS[10], ensemble_score: 0.029000, source: "pr_rank=8 + svd_rank=2" },
    { ...PRODUCTS[2],  ensemble_score: 0.028500, source: "pr_rank=6 + svd_rank=3" },
  ],
  u5: [
    { ...PRODUCTS[4],  ensemble_score: 0.032100, source: "pr_rank=1 + svd_rank=2" },
    { ...PRODUCTS[3],  ensemble_score: 0.031600, source: "pr_rank=2 + svd_rank=1" },
    { ...PRODUCTS[0],  ensemble_score: 0.031000, source: "pr_rank=3 + svd_rank=4" },
    { ...PRODUCTS[14], ensemble_score: 0.030400, source: "pr_rank=5 + svd_rank=2" },
    { ...PRODUCTS[6],  ensemble_score: 0.030000, source: "pr_rank=4 + svd_rank=5" },
    { ...PRODUCTS[1],  ensemble_score: 0.029400, source: "pr_rank=6 + svd_rank=3" },
    { ...PRODUCTS[9],  ensemble_score: 0.029000, source: "pr_rank=7 + svd_rank=5" },
    { ...PRODUCTS[7],  ensemble_score: 0.028600, source: "pr_rank=8 + svd_rank=6" },
  ],
};

const SIMILAR = {
  p1: [
    { ...PRODUCTS[6],  similarity: 0.5 },
    { ...PRODUCTS[7],  similarity: 0.5 },
    { ...PRODUCTS[14], similarity: 0.5 },
    { ...PRODUCTS[8],  similarity: 0.25 },
  ],
};

const DEMO_USERS = {
  "alex@example.com":   { id: "u1", name: "Alex Chen", email: "alex@example.com" },
  "sam@example.com":     { id: "u3", name: "Sam Rivera", email: "sam@example.com" },
  "morgan@example.com":  { id: "u5", name: "Morgan Patel", email: "morgan@example.com" },
};

let demoCart = { items: [], total: 0 };

// ─── API functions (demo or live) ───

export async function login(email, password) {
  if (DEMO_MODE) {
    const user = DEMO_USERS[email];
    if (user && password === "pass123") {
      demoCart = { items: [], total: 0 };
      return { user, token: `token_${user.id}` };
    }
    return { error: "Invalid email or password" };
  }
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function register(name, email, password) {
  if (DEMO_MODE) {
    return { error: "Registration disabled in demo mode. Use a demo account." };
  }
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return res.json();
}

export async function getRecommendations(userId, topK = 5) {
  if (DEMO_MODE) {
    const recs = RECOMMENDATIONS[userId] || RECOMMENDATIONS.u1;
    return { user_id: userId, model: "ensemble", recommendations: recs.slice(0, topK) };
  }
  const res = await fetch(`${API_URL}/recommendations/${userId}?top_k=${topK}`);
  return res.json();
}

export async function getSimilarProducts(productId, topK = 5) {
  if (DEMO_MODE) {
    const similar = SIMILAR[productId] || Object.values(SIMILAR)[0] || [];
    return { product_id: productId, similar_products: similar.slice(0, topK) };
  }
  const res = await fetch(`${API_URL}/similar/${productId}?top_k=${topK}`);
  return res.json();
}

export async function getProducts() {
  if (DEMO_MODE) {
    return { products: PRODUCTS };
  }
  const res = await fetch(`${API_URL}/products`);
  return res.json();
}

export async function getProduct(productId) {
  if (DEMO_MODE) {
    const product = PRODUCTS.find((p) => p.id === productId);
    return { product: product || null };
  }
  const res = await fetch(`${API_URL}/products/${productId}`);
  return res.json();
}

export async function searchProducts(query) {
  if (DEMO_MODE) {
    const q = query.toLowerCase();
    const results = PRODUCTS.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
    return { query, results };
  }
  const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
  return res.json();
}

export async function getPopular(topK = 5) {
  if (DEMO_MODE) {
    return { popular: PRODUCTS.slice(0, topK) };
  }
  const res = await fetch(`${API_URL}/popular?top_k=${topK}`);
  return res.json();
}

export async function getCart(userId) {
  if (DEMO_MODE) {
    return demoCart;
  }
  const res = await fetch(`${API_URL}/cart/${userId}`);
  return res.json();
}

export async function addToCart(userId, productId) {
  if (DEMO_MODE) {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) return { success: false };
    const existing = demoCart.items.find((i) => i.id === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      demoCart.items.push({ ...product, quantity: 1 });
    }
    demoCart.total = demoCart.items.reduce((s, i) => s + i.price * i.quantity, 0);
    return { success: true };
  }
  const res = await fetch(`${API_URL}/cart/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId }),
  });
  return res.json();
}

export async function removeFromCart(userId, productId) {
  if (DEMO_MODE) {
    demoCart.items = demoCart.items.filter((i) => i.id !== productId);
    demoCart.total = demoCart.items.reduce((s, i) => s + i.price * i.quantity, 0);
    return { success: true };
  }
  const res = await fetch(`${API_URL}/cart/${userId}/${productId}`, {
    method: "DELETE",
  });
  return res.json();
}

export async function recordInteraction(userId, productId, type) {
  if (DEMO_MODE) return { success: true };
  const res = await fetch(`${API_URL}/interact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, productId, type }),
  });
  return res.json();
}

