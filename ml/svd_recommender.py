"""
SmartShop SVD Collaborative Filtering
======================================
Second approach: Matrix factorization using Truncated SVD
on the user-product interaction matrix.

Why SVD?
- Decomposes the sparse interaction matrix into latent factors
- Captures hidden patterns (e.g., "tech enthusiasts" cluster)
- Better at finding non-obvious connections than PageRank
- Weakness: struggles with cold start (no interactions = no signal)
"""

import numpy as np
from scipy.sparse import csr_matrix
from scipy.sparse.linalg import svds
from typing import List, Dict
from recommender import PRODUCTS, INTERACTIONS


class SVDRecommender:
    """
    Collaborative filtering using Truncated SVD.
    Decomposes the user-item interaction matrix into latent factors.
    """

    def __init__(self, n_factors: int = 5):
        self.n_factors = n_factors
        self.products = {p["id"]: p for p in PRODUCTS}

        # Build mappings: string IDs → matrix indices
        self.user_ids = sorted(set(uid for uid, _, _, _ in INTERACTIONS))
        self.product_ids = [p["id"] for p in PRODUCTS]
        self.user_to_idx = {uid: i for i, uid in enumerate(self.user_ids)}
        self.product_to_idx = {pid: i for i, pid in enumerate(self.product_ids)}

        # Build and decompose the interaction matrix
        self.interaction_matrix = self._build_matrix()
        self.user_factors, self.sigma, self.product_factors = self._decompose()

        print(f"[✓] SVD fitted: {len(self.user_ids)} users × {len(self.product_ids)} products, {self.n_factors} factors")

    def _build_matrix(self) -> np.ndarray:
        """Build the user-product interaction matrix."""
        matrix = np.zeros((len(self.user_ids), len(self.product_ids)))

        for user_id, product_id, interaction, weight in INTERACTIONS:
            u_idx = self.user_to_idx[user_id]
            p_idx = self.product_to_idx[product_id]
            matrix[u_idx][p_idx] += weight

        return matrix

    def _decompose(self):
        """
        Apply Truncated SVD to the interaction matrix.

        M ≈ U × Σ × V^T
        - U = user factors (what users like)
        - Σ = importance of each factor
        - V^T = product factors (what products represent)
        """
        sparse_matrix = csr_matrix(self.interaction_matrix)
        k = min(self.n_factors, min(sparse_matrix.shape) - 1)
        U, sigma, Vt = svds(sparse_matrix, k=k)
        return U, sigma, Vt

    def get_recommendations(self, user_id: str, top_k: int = 5) -> List[Dict]:
        """
        Predict scores for all products and return top-k unseen ones.

        Score = U[user] × Σ × V^T → predicted interaction strength
        """
        if user_id not in self.user_to_idx:
            return []  # Can't predict for unknown users

        u_idx = self.user_to_idx[user_id]

        # Reconstruct predicted scores for this user
        predicted_scores = self.user_factors[u_idx] @ np.diag(self.sigma) @ self.product_factors

        # Get products user already interacted with
        already_seen = set()
        for uid, pid, _, _ in INTERACTIONS:
            if uid == user_id:
                already_seen.add(pid)

        # Rank unseen products by predicted score
        recommendations = []
        for pid, p_idx in self.product_to_idx.items():
            if pid not in already_seen:
                product = self.products[pid].copy()
                product["score"] = round(float(predicted_scores[p_idx]), 4)
                recommendations.append(product)

        recommendations.sort(key=lambda x: x["score"], reverse=True)
        return recommendations[:top_k]


# ─────────────────────────────────────────────
# QUICK TEST
# ─────────────────────────────────────────────

if __name__ == "__main__":
    svd = SVDRecommender(n_factors=5)

    print("\n--- SVD Recommendations for u1 ---")
    for p in svd.get_recommendations("u1", top_k=5):
        print(f"  {p['name']:40s}  score={p['score']}")

    print("\n--- SVD Recommendations for u3 (sports buyer) ---")
    for p in svd.get_recommendations("u3", top_k=5):
        print(f"  {p['name']:40s}  score={p['score']}")