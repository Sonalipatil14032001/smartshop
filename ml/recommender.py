"""
SmartShop Graph-Based Recommendation Engine
============================================
Builds a bipartite graph of Users <-> Products.
- Nodes = users + products
- Edges = interactions (purchase, view, rating) with weights
- Uses Personalized PageRank to find relevant products for a user
"""

import networkx as nx
import numpy as np
import pandas as pd
from typing import List, Dict, Tuple


# ─────────────────────────────────────────────
# 1. SEED DATA (simulates a real DB)
# ─────────────────────────────────────────────

PRODUCTS = [
    {"id": "p1",  "name": "Wireless Noise-Cancelling Headphones", "category": "Electronics", "price": 299, "rating": 4.8},
    {"id": "p2",  "name": "Mechanical Keyboard RGB",              "category": "Electronics", "price": 149, "rating": 4.6},
    {"id": "p3",  "name": "4K Webcam Pro",                        "category": "Electronics", "price": 199, "rating": 4.5},
    {"id": "p4",  "name": "Standing Desk Converter",              "category": "Furniture",   "price": 249, "rating": 4.3},
    {"id": "p5",  "name": "Ergonomic Office Chair",               "category": "Furniture",   "price": 459, "rating": 4.7},
    {"id": "p6",  "name": "LED Desk Lamp Smart",                  "category": "Furniture",   "price": 79,  "rating": 4.4},
    {"id": "p7",  "name": "Running Shoes Ultraboost",             "category": "Sports",      "price": 180, "rating": 4.9},
    {"id": "p8",  "name": "Yoga Mat Premium",                     "category": "Sports",      "price": 65,  "rating": 4.6},
    {"id": "p9",  "name": "Resistance Bands Set",                 "category": "Sports",      "price": 29,  "rating": 4.3},
    {"id": "p10", "name": "Python Crash Course Book",             "category": "Books",       "price": 35,  "rating": 4.8},
    {"id": "p11", "name": "Clean Code Book",                      "category": "Books",       "price": 40,  "rating": 4.7},
    {"id": "p12", "name": "Instant Pot Duo",                      "category": "Kitchen",     "price": 89,  "rating": 4.7},
    {"id": "p13", "name": "Chef Knife Set",                       "category": "Kitchen",     "price": 120, "rating": 4.5},
    {"id": "p14", "name": "Air Fryer XL",                         "category": "Kitchen",     "price": 109, "rating": 4.6},
    {"id": "p15", "name": "Bluetooth Speaker Waterproof",         "category": "Electronics", "price": 59,  "rating": 4.4},
]

# Simulated user interactions: (user_id, product_id, interaction_type, weight)
# weight: purchase=5, add_to_cart=3, view=1
INTERACTIONS = [
    ("u1", "p1", "purchase", 5), ("u1", "p2", "purchase", 5), ("u1", "p3", "view", 1),
    ("u1", "p10", "purchase", 5), ("u1", "p15", "add_to_cart", 3),
    ("u2", "p1", "purchase", 5), ("u2", "p5", "purchase", 5), ("u2", "p4", "view", 1),
    ("u2", "p6", "add_to_cart", 3),
    ("u3", "p7", "purchase", 5), ("u3", "p8", "purchase", 5), ("u3", "p9", "purchase", 5),
    ("u3", "p1", "view", 1),
    ("u4", "p10", "purchase", 5), ("u4", "p11", "purchase", 5), ("u4", "p2", "view", 1),
    ("u4", "p3", "add_to_cart", 3),
    ("u5", "p12", "purchase", 5), ("u5", "p13", "purchase", 5), ("u5", "p14", "purchase", 5),
    ("u5", "p6", "view", 1),
    ("u6", "p1", "purchase", 5), ("u6", "p7", "purchase", 5), ("u6", "p15", "purchase", 5),
    ("u6", "p8", "add_to_cart", 3),
    ("u7", "p4", "purchase", 5), ("u7", "p5", "purchase", 5), ("u7", "p6", "purchase", 5),
    ("u7", "p12", "view", 1),
    ("u8", "p2", "purchase", 5), ("u8", "p3", "purchase", 5), ("u8", "p10", "purchase", 5),
    ("u8", "p11", "add_to_cart", 3),
]


# ─────────────────────────────────────────────
# 2. BUILD BIPARTITE GRAPH
# ─────────────────────────────────────────────

class SmartShopRecommender:
    """
    Graph-based recommender using Personalized PageRank
    on a bipartite user-product interaction graph.
    """

    def __init__(self):
        self.graph = nx.Graph()
        self.products = {p["id"]: p for p in PRODUCTS}
        self._build_graph()

    def _build_graph(self):
        """Build the bipartite user-product graph from interactions."""

        # Add product nodes
        for p in PRODUCTS:
            self.graph.add_node(p["id"], node_type="product", **p)

        # Add user nodes and edges
        for user_id, product_id, interaction, weight in INTERACTIONS:
            if not self.graph.has_node(user_id):
                self.graph.add_node(user_id, node_type="user")

            # If edge already exists, add weights (user might view then purchase)
            if self.graph.has_edge(user_id, product_id):
                self.graph[user_id][product_id]["weight"] += weight
            else:
                self.graph.add_edge(user_id, product_id, weight=weight, interaction=interaction)

        print(f"[✓] Graph built: {self.graph.number_of_nodes()} nodes, {self.graph.number_of_edges()} edges")

    def get_recommendations(self, user_id: str, top_k: int = 5) -> List[Dict]:
        """
        Get product recommendations for a user using Personalized PageRank.

        How it works:
        1. Start a random walk from the target user
        2. The walk follows edges (weighted by interaction strength)
        3. Products visited often = highly relevant
        4. Filter out products the user already interacted with
        """

        if user_id not in self.graph:
            # Cold start: return popular products
            return self._get_popular(top_k)

        # Personalized PageRank: personalization dict seeds the walk at our user
        personalization = {node: 0 for node in self.graph.nodes()}
        personalization[user_id] = 1.0

        pagerank_scores = nx.pagerank(
            self.graph,
            alpha=0.85,           # damping factor (probability of following an edge)
            personalization=personalization,
            weight="weight"       # use interaction weights
        )

        # Get products the user already interacted with
        already_seen = set(self.graph.neighbors(user_id))

        # Filter: only product nodes, exclude already seen
        recommendations = []
        for node, score in pagerank_scores.items():
            if node.startswith("p") and node not in already_seen:
                product = self.products[node].copy()
                product["score"] = round(score, 6)
                recommendations.append(product)

        # Sort by PageRank score descending
        recommendations.sort(key=lambda x: x["score"], reverse=True)

        return recommendations[:top_k]

    def get_similar_products(self, product_id: str, top_k: int = 5) -> List[Dict]:
        """
        Find similar products using collaborative filtering logic.

        Method: Products are similar if the same users interact with them.
        Uses Jaccard similarity on the set of users who interacted with each product.
        """

        if product_id not in self.graph:
            return []

        # Users who interacted with this product
        target_users = set(self.graph.neighbors(product_id))

        similarities = []
        for pid, pdata in self.products.items():
            if pid == product_id:
                continue

            if pid not in self.graph:
                continue

            # Users who interacted with this other product
            other_users = set(self.graph.neighbors(pid))

            # Jaccard similarity
            intersection = len(target_users & other_users)
            union = len(target_users | other_users)

            if union > 0:
                similarity = intersection / union
                product = pdata.copy()
                product["similarity"] = round(similarity, 4)
                similarities.append(product)

        similarities.sort(key=lambda x: x["similarity"], reverse=True)
        return similarities[:top_k]

    def _get_popular(self, top_k: int = 5) -> List[Dict]:
        """Fallback: return most popular products by number of interactions."""
        product_interactions = {}
        for node in self.graph.nodes():
            if node.startswith("p"):
                degree = self.graph.degree(node, weight="weight")
                product_interactions[node] = degree

        sorted_products = sorted(product_interactions.items(), key=lambda x: x[1], reverse=True)

        results = []
        for pid, score in sorted_products[:top_k]:
            product = self.products[pid].copy()
            product["score"] = score
            results.append(product)

        return results

    def get_all_products(self) -> List[Dict]:
        """Return all products."""
        return PRODUCTS

    def get_product(self, product_id: str) -> Dict:
        """Return a single product by ID."""
        return self.products.get(product_id)


# ─────────────────────────────────────────────
# 3. QUICK TEST
# ─────────────────────────────────────────────

if __name__ == "__main__":
    rec = SmartShopRecommender()

    print("\n--- Recommendations for u1 (electronics/books buyer) ---")
    for p in rec.get_recommendations("u1", top_k=5):
        print(f"  {p['name']:40s}  score={p['score']}")

    print("\n--- Similar to p1 (Headphones) ---")
    for p in rec.get_similar_products("p1", top_k=5):
        print(f"  {p['name']:40s}  similarity={p['similarity']}")

    print("\n--- Cold start (new user) ---")
    for p in rec.get_recommendations("u_new", top_k=3):
        print(f"  {p['name']:40s}  score={p['score']}")