import React, { useState, useEffect } from "react";
import {
  login, register, getRecommendations, getProducts,
  searchProducts, getSimilarProducts, getCart, addToCart,
  removeFromCart, recordInteraction
} from "./api";
import "./App.css";
import {
  Search, ShoppingCart, Star, LogOut, User, Sparkles,
  TrendingUp, ArrowLeft, Trash2, X
} from "lucide-react";

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // eslint-disable-line no-unused-vars
  const [products, setProducts] = useState([]);
  const [recommendations, setRecs] = useState([]);
  const [similarProducts, setSimilar] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    getProducts().then((data) => setProducts(data.products || []));
  }, []);

  useEffect(() => {
    if (user) {
      getRecommendations(user.id, 8).then((data) =>
        setRecs(data.recommendations || [])
      );
      loadCart();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (selectedProduct) {
      getSimilarProducts(selectedProduct.id, 4).then((data) =>
        setSimilar(data.similar_products || [])
      );
      if (user) {
        recordInteraction(user.id, selectedProduct.id, "view");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct]);

  const loadCart = async () => {
    if (!user) return;
    const data = await getCart(user.id);
    setCart(data);
  };

  const handleAddToCart = async (product) => {
    if (!user) return;
    await addToCart(user.id, product.id);
    await recordInteraction(user.id, product.id, "add_to_cart");
    await loadCart();
  };

  const handleRemoveFromCart = async (productId) => {
    if (!user) return;
    await removeFromCart(user.id, productId);
    await loadCart();
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");
    try {
      let data;
      if (authMode === "login") {
        data = await login(authForm.email, authForm.password);
      } else {
        data = await register(authForm.name, authForm.email, authForm.password);
      }
      if (data.error) {
        setAuthError(data.error);
      } else {
        setUser(data.user);
        setToken(data.token);
      }
    } catch {
      setAuthError("Connection failed. Is the backend running?");
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const data = await searchProducts(searchQuery);
    setSearchResults(data.results || []);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setRecs([]);
    setCart({ items: [], total: 0 });
    setSelectedProduct(null);
    setSearchResults(null);
    setSearchQuery("");
    setShowCart(false);
    setAuthForm({ name: "", email: "", password: "" });
  };

  // ─── Cart Drawer ───
  const CartDrawer = () => (
    <div className={`cart-overlay ${showCart ? "open" : ""}`} onClick={() => setShowCart(false)}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h3>Your Cart ({cart.items.length})</h3>
          <button className="close-cart" onClick={() => setShowCart(false)}>
            <X size={20} />
          </button>
        </div>

        {cart.items.length === 0 ? (
          <p className="cart-empty">Your cart is empty</p>
        ) : (
          <>
            <div className="cart-items">
              {cart.items.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-info">
                    <p className="cart-item-name">{item.name}</p>
                    <p className="cart-item-meta">{item.category} · Qty: {item.quantity}</p>
                  </div>
                  <div className="cart-item-right">
                    <p className="cart-item-price">${(item.price * item.quantity).toFixed(2)}</p>
                    <button
                      className="cart-remove-btn"
                      onClick={() => handleRemoveFromCart(item.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-footer">
              <div className="cart-total">
                <span>Total</span>
                <span className="cart-total-amount">${cart.total.toFixed(2)}</span>
              </div>
              <button className="checkout-btn">Checkout</button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ─── Product Detail View ───
  if (selectedProduct) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-inner">
            <h1 className="logo" onClick={() => setSelectedProduct(null)}>SmartShop</h1>
            <div className="header-actions">
              <div className="cart-icon" onClick={() => setShowCart(true)}>
                <ShoppingCart size={20} />
                {cart.items.length > 0 && <span className="cart-badge">{cart.items.length}</span>}
              </div>
            </div>
          </div>
        </header>
        <main className="main">
          <button className="back-btn" onClick={() => setSelectedProduct(null)}>
            <ArrowLeft size={18} /> Back to store
          </button>
          <div className="product-detail">
            <div className="product-detail-info">
              <span className="product-category-tag">{selectedProduct.category}</span>
              <h2>{selectedProduct.name}</h2>
              <div className="product-rating">
                <Star size={16} fill="#f59e0b" stroke="#f59e0b" />
                <span>{selectedProduct.rating}</span>
              </div>
              <p className="product-price">${selectedProduct.price}</p>
              <button className="add-cart-btn" onClick={() => handleAddToCart(selectedProduct)}>
                <ShoppingCart size={16} /> Add to Cart
              </button>
            </div>
          </div>

          {similarProducts.length > 0 && (
            <section className="section">
              <h3 className="section-title">
                <TrendingUp size={20} /> Customers Also Liked
              </h3>
              <div className="product-grid">
                {similarProducts.map((p) => (
                  <ProductCard key={p.id} product={p} onClick={() => setSelectedProduct(p)} onAdd={() => handleAddToCart(p)} />
                ))}
              </div>
            </section>
          )}
        </main>
        <CartDrawer />
      </div>
    );
  }

  // ─── Auth Screen ───
  if (!user) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-inner">
            <h1 className="logo">SmartShop</h1>
          </div>
        </header>
        <main className="auth-container">
          <div className="auth-box">
            <h2>{authMode === "login" ? "Welcome back" : "Create account"}</h2>
            <p className="auth-subtitle">
              {authMode === "login"
                ? "Sign in to get personalized recommendations"
                : "Join to discover products you'll love"}
            </p>
            {authError && <p className="auth-error">{authError}</p>}
            <form onSubmit={handleAuth}>
              {authMode === "register" && (
                <input
                  type="text"
                  placeholder="Full name"
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  required
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                required
              />
              <button type="submit" className="auth-btn">
                {authMode === "login" ? "Sign In" : "Sign Up"}
              </button>
            </form>
            <p className="auth-switch">
              {authMode === "login" ? "No account? " : "Have an account? "}
              <span onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(""); }}>
                {authMode === "login" ? "Sign up" : "Sign in"}
              </span>
            </p>
            <div className="demo-accounts">
              <p>Demo accounts:</p>
              <span onClick={() => setAuthForm({ ...authForm, email: "alex@example.com", password: "pass123" })}>Alex (tech buyer)</span>
              <span onClick={() => setAuthForm({ ...authForm, email: "sam@example.com", password: "pass123" })}>Sam (sports buyer)</span>
              <span onClick={() => setAuthForm({ ...authForm, email: "morgan@example.com", password: "pass123" })}>Morgan (kitchen buyer)</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── Main Store View ───
  const displayProducts = searchResults !== null ? searchResults : products;

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <h1 className="logo">SmartShop</h1>
          <form className="search-bar" onSubmit={handleSearch}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value.trim()) setSearchResults(null);
              }}
            />
          </form>
          <div className="header-actions">
            <div className="cart-icon" onClick={() => setShowCart(true)}>
              <ShoppingCart size={20} />
              {cart.items.length > 0 && <span className="cart-badge">{cart.items.length}</span>}
            </div>
            <div className="user-info">
              <User size={16} />
              <span>{user.name}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        {searchResults === null && recommendations.length > 0 && (
          <section className="section recs-section">
            <h3 className="section-title">
              <Sparkles size={20} /> Recommended for you
            </h3>
            <p className="section-subtitle">
              Powered by PageRank + SVD ensemble model
            </p>
            <div className="product-grid">
              {recommendations.map((p) => (
                <ProductCard key={p.id} product={p} onClick={() => setSelectedProduct(p)} onAdd={() => handleAddToCart(p)} showScore />
              ))}
            </div>
          </section>
        )}

        <section className="section">
          <h3 className="section-title">
            {searchResults !== null
              ? `Search results for "${searchQuery}" (${searchResults.length})`
              : "All Products"}
          </h3>
          {displayProducts.length === 0 ? (
            <p className="empty-state">No products found.</p>
          ) : (
            <div className="product-grid">
              {displayProducts.map((p) => (
                <ProductCard key={p.id} product={p} onClick={() => setSelectedProduct(p)} onAdd={() => handleAddToCart(p)} />
              ))}
            </div>
          )}
        </section>
      </main>

      <CartDrawer />
    </div>
  );
}

function ProductCard({ product, onClick, onAdd, showScore }) {
  return (
    <div className="product-card" onClick={onClick}>
      <div className="product-card-top">
        <span className="product-category-tag">{product.category}</span>
      </div>
      <h4 className="product-name">{product.name}</h4>
      <div className="product-meta">
        <span className="product-rating-sm">
          <Star size={13} fill="#f59e0b" stroke="#f59e0b" /> {product.rating}
        </span>
        <span className="product-price-sm">${product.price}</span>
      </div>
      {showScore && product.source && (
        <p className="rec-source">{product.source}</p>
      )}
      <button
        className="add-cart-sm"
        onClick={(e) => { e.stopPropagation(); onAdd(); }}
      >
        <ShoppingCart size={14} /> Add
      </button>
    </div>
  );
}

export default App;