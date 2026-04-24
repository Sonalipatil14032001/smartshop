"""
SmartShop ML API
================
FastAPI wrapper around the ensemble recommendation engine.
Endpoints:
  GET /recommendations/{user_id}  → personalized recs (ensemble)
  GET /similar/{product_id}       → similar products
  GET /products                   → all products
  GET /products/{product_id}      → single product
  GET /popular                    → popular products (cold start)
"""

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from ensemble import EnsembleRecommender

app = FastAPI(title="SmartShop ML API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ensemble recommender on startup
recommender = EnsembleRecommender()


@app.get("/")
def health():
    return {"status": "ok", "service": "smartshop-ml", "model": "ensemble (PageRank + SVD)"}


@app.get("/recommendations/{user_id}")
def get_recommendations(user_id: str, top_k: int = Query(default=5, le=20)):
    """Get personalized recommendations using ensemble model."""
    results = recommender.get_recommendations(user_id, top_k=top_k)
    return {"user_id": user_id, "model": "ensemble", "recommendations": results}


@app.get("/similar/{product_id}")
def get_similar(product_id: str, top_k: int = Query(default=5, le=20)):
    """Get similar products based on collaborative filtering."""
    results = recommender.get_similar_products(product_id, top_k=top_k)
    return {"product_id": product_id, "similar_products": results}


@app.get("/products")
def get_products():
    """Get all products."""
    return {"products": recommender.get_all_products()}


@app.get("/products/{product_id}")
def get_product(product_id: str):
    """Get a single product."""
    product = recommender.get_product(product_id)
    if not product:
        return {"error": "Product not found"}, 404
    return {"product": product}


@app.get("/popular")
def get_popular(top_k: int = Query(default=5, le=20)):
    """Get popular products (cold start fallback)."""
    results = recommender.pagerank._get_popular(top_k=top_k)
    return {"popular": results}