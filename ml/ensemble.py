"""
SmartShop Ensemble Recommender
==============================
Combines PageRank + SVD scores using weighted rank fusion.

Why ensemble?
- PageRank captures graph structure and handles cold start
- SVD captures latent preference patterns
- Combined: covers both strengths, reduces individual weaknesses

Method: Reciprocal Rank Fusion (RRF)
  score(item) = Σ  1 / (k + rank_in_model)
  Simple, effective, no tuning needed.
"""

from typing import List, Dict
from recommender import SmartShopRecommender
from svd_recommender import SVDRecommender


class EnsembleRecommender:
    """
    Combines PageRank and SVD using Reciprocal Rank Fusion.
    Falls back to PageRank-only for cold start users.
    """

    def __init__(self, k: int = 60):
        self.pagerank = SmartShopRecommender()
        self.svd = SVDRecommender(n_factors=5)
        self.k = k  # RRF constant (standard default is 60)

    def get_recommendations(self, user_id: str, top_k: int = 5) -> List[Dict]:
        """
        Get ensemble recommendations using Reciprocal Rank Fusion.

        RRF score = 1/(k + rank_pagerank) + 1/(k + rank_svd)
        Higher score = recommended by both models at high ranks.
        """
        pr_recs = self.pagerank.get_recommendations(user_id, top_k=20)
        svd_recs = self.svd.get_recommendations(user_id, top_k=20)

        # If SVD can't predict (cold start), fall back to PageRank
        if not svd_recs:
            for i, p in enumerate(pr_recs):
                p["ensemble_score"] = round(1 / (self.k + i + 1), 6)
                p["source"] = "pagerank_only (cold start)"
            return pr_recs[:top_k]

        # Build rank maps
        pr_ranks = {p["id"]: rank for rank, p in enumerate(pr_recs)}
        svd_ranks = {p["id"]: rank for rank, p in enumerate(svd_recs)}

        # All candidate product IDs
        all_ids = set(pr_ranks.keys()) | set(svd_ranks.keys())

        # Compute RRF scores
        scored = []
        for pid in all_ids:
            rrf_score = 0
            sources = []

            if pid in pr_ranks:
                rrf_score += 1 / (self.k + pr_ranks[pid] + 1)
                sources.append(f"pr_rank={pr_ranks[pid]+1}")

            if pid in svd_ranks:
                rrf_score += 1 / (self.k + svd_ranks[pid] + 1)
                sources.append(f"svd_rank={svd_ranks[pid]+1}")

            # Get product info from either model's results
            product = None
            for p in pr_recs + svd_recs:
                if p["id"] == pid:
                    product = {
                        "id": p["id"],
                        "name": p["name"],
                        "category": p["category"],
                        "price": p["price"],
                        "rating": p["rating"],
                    }
                    break

            if product:
                product["ensemble_score"] = round(rrf_score, 6)
                product["source"] = " + ".join(sources)
                scored.append(product)

        scored.sort(key=lambda x: x["ensemble_score"], reverse=True)
        return scored[:top_k]

    def get_similar_products(self, product_id: str, top_k: int = 5) -> List[Dict]:
        """Delegates to PageRank's collaborative filtering."""
        return self.pagerank.get_similar_products(product_id, top_k)

    def get_all_products(self) -> List[Dict]:
        return self.pagerank.get_all_products()

    def get_product(self, product_id: str) -> Dict:
        return self.pagerank.get_product(product_id)


# ─────────────────────────────────────────────
# TEST
# ─────────────────────────────────────────────

if __name__ == "__main__":
    ens = EnsembleRecommender()

    print("\n--- Ensemble Recommendations for u1 ---")
    for p in ens.get_recommendations("u1", top_k=5):
        print(f"  {p['name']:40s}  rrf={p['ensemble_score']}  ({p['source']})")

    print("\n--- Ensemble Recommendations for u4 (low overlap user) ---")
    for p in ens.get_recommendations("u4", top_k=5):
        print(f"  {p['name']:40s}  rrf={p['ensemble_score']}  ({p['source']})")

    print("\n--- Cold Start (new user) ---")
    for p in ens.get_recommendations("u_new", top_k=3):
        print(f"  {p['name']:40s}  rrf={p['ensemble_score']}  ({p['source']})")