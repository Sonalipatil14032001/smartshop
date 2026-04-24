# SmartShop - Graph-based Product Recommender

Product recommendation engine that actually works. Built this to understand how recommendation systems work under the hood — not just calling an API, but building the graph, running the math, and seeing why one approach beats another.

**live demo:** https://smartshop-o63cyz8jh-sonalipatil14032001s-projects.vercel.app

## What It Does

An e-commerce app where you log in, browse products, and get personalized recommendations. The interesting part is the ML layer — I tried three different approaches and benchmarked them against each other to pick the best one.

The frontend is a clean storefront with auth, search, cart (persisted in PostgreSQL), and a product detail page that shows "customers also liked" suggestions.

## The Recommendation Engine

I didn't just pick one model and call it done. I wanted to understand the tradeoffs, so I built three:

**1. Personalized PageRank**
- builds a bipartite graph — users on one side, products on the other, edges are interactions (purchases weigh more than views)
- runs PageRank starting from the target user, so products visited often by similar users bubble up
- handles cold start well because it falls back to popularity
- downside: doesn't learn embeddings, can miss subtle patterns

**2. SVD (matrix factorization)**
- decomposes the user-product interaction matrix into latent factors
- basically finds hidden clusters like "tech enthusiasts" or "fitness people"
- better at catching non-obvious connections
- downside: completely fails on cold start — if you're a new user, it returns nothing

**3. Ensemble (what actually ships)**
- combines both using Reciprocal Rank Fusion (RRF)
- `score(item) = 1/(k + rank_pagerank) + 1/(k + rank_svd)`
- if both models rank something high, it gets boosted. if only one does, it still shows up but lower
- cold start users get PageRank-only fallback

### Benchmark Results

ran all 8 test users through both models:

| user | pagerank-svd overlap | notes |
|------|---------------------|-------|
| u1 (tech/books) | 60% | both agree on top 2 |
| u2 (electronics/furniture) | 100% | strong signal user |
| u3 (sports) | 40% | models disagree a lot — ensemble helps most here |
| u4 (books) | 20% | most ambiguous user |
| u5 (kitchen) | 60% | decent agreement |
| u6 (electronics/sports) | 80% | mostly aligned |
| u7 (furniture) | 40% | different perspectives |
| u8 (electronics/books) | 40% | similar to u4 |

**average overlap: 55%** — they agree on roughly half, which means each one is catching stuff the other misses. that's why the ensemble works better than either alone.

cold start: PageRank returns popular items, SVD returns empty. clear winner there.

## Tech Stack

```
frontend/     → React (Create React App, lucide-react for icons)
backend/      → Node.js + Express (proxies to ML, handles auth/cart/search)
ml/           → Python + FastAPI (the actual recommendation engine)
database      → PostgreSQL (users, products, interactions, cart)
```

### Tradeoffs

- **FastAPI over Flask** — async, auto-generates docs, type hints built in. for an ML service that might get multiple requests, async matters
- **Express as a proxy layer** — keeps the frontend from talking directly to the ML service. also handles auth and cart logic that doesn't belong in the Python layer
- **PostgreSQL over MongoDB** — the data is relational (users have carts, interactions link users to products). graph DBs would be overkill for this scale
- **NetworkX for the graph** — simple, well-documented, good enough for this dataset size. wouldn't use it for millions of users (would switch to PyG or DGL) but for a project that demonstrates the concept, it works

## Project Structure

```
smartshop/
├── ml/
│   ├── recommender.py          # PageRank on bipartite graph
│   ├── svd_recommender.py      # SVD collaborative filtering
│   ├── ensemble.py             # RRF fusion of both models
│   ├── benchmark.py            # model comparison script
│   ├── server.py               # FastAPI endpoints
│   └── requirements.txt
├── backend/
│   ├── index.js                # Express API — auth, cart, search, ML proxy
│   ├── db.js                   # PostgreSQL connection pool
│   └── package.json
└── frontend/
    └── src/
        ├── App.js              # main React app — store, cart drawer, auth
        ├── App.css             # all styles
        └── api.js              # API client functions
```

## Local Setup

you need: Node.js, Python 3.11, PostgreSQL

**1. database**
```bash
psql postgres -c "CREATE DATABASE smartshop;"
# then run the schema + seed data (see backend/schema.sql or the setup instructions)
```

**2. ML service**
```bash
cd ml
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

**3. backend**
```bash
cd backend
npm install
# create .env with DATABASE_URL and ML_SERVICE_URL
node index.js
```

**4. frontend**
```bash
cd frontend
npm install
npm start
```

app runs on localhost:3000. demo accounts: alex@example.com / pass123 (tech buyer), sam@example.com / pass123 (sports buyer), morgan@example.com / pass123 (kitchen buyer).

## Things I'd Improve 

- [ ] Add Node2Vec as a third model in the ensemble — random walk embeddings would capture structural patterns better than PageRank alone
- [ ] Swap seed data for a real dataset (Amazon product reviews or MovieLens adapted to products)
- [ ] Add proper JWT auth instead of the simple token system
- [ ] Track interactions in real-time and retrain the model periodically
- [ ] Add product images (right now it's text-only cards)
- [ ] Deploy with Docker Compose so the whole thing spins up in one command

## Takeways

The biggest takeaway was that **no single model is best for everything**. PageRank is great for graph structure but can't learn latent patterns. SVD learns patterns but dies on cold start. the ensemble with RRF was simple to implement and gave better results than either one alone. that's why real recommendation systems at companies like Netflix or Amazon use ensembles — it's not about finding the perfect model, it's about combining imperfect ones.

also learned that the gap between "I understand the theory" and "I can build it end-to-end" is bigger than I expected. connecting the ML service to a backend to a frontend to a database — each layer has its own quirks and failure modes. that's the part you don't get from reading papers.
