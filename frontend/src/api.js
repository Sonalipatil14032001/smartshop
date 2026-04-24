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