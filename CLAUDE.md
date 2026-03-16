# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack e-commerce demo with a React frontend and Spring Boot backend.

## Commands

### Frontend (`/frontend`)
```bash
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Production build
npm run lint      # ESLint check
npm run preview   # Preview production build
```

### Backend (`/backend`)
```bash
mvn spring-boot:run          # Start server at http://localhost:8080
mvn clean package            # Build JAR
mvn test                     # Run tests
mvn test -Dtest=ClassName    # Run a single test class
```

## Architecture

### Data Flow
1. On app load, frontend fetches products from `GET /api/products`
2. Products and cart state are managed globally via `CartContext` (React Context)
3. On cart page, promo codes are applied by calling `POST /api/cart/calculate`
4. Checkout POSTs an `OrderRequest` to `POST /api/orders`; backend strips card number and stores only last 4 digits
5. Backend stores orders in-memory (`ConcurrentHashMap`) — data is lost on restart

### Frontend Structure
- **`src/context/CartContext.jsx`** — single source of truth for cart items and product list; consumed by all pages
- **`src/App.jsx`** — router setup wrapping all routes in `CartProvider`
- **`src/pages/`** — one file per route; pages call backend API directly (no separate API layer)
- **`src/components/`** — `Navbar` (cart badge) and `ProductCard` (reusable)

### Backend Structure (`com.demo.ecommerce`)
- **Controllers** — thin REST layer with CORS configured for `http://localhost:5173`
- **Services** — `CartService` handles discount/tax calculation (10% tax on discounted subtotal); `OrderService` manages order lifecycle
- **No database** — products are a hardcoded `Map` in `ProductService`; orders use an in-memory `ConcurrentHashMap`

### API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/products` | All products |
| GET | `/api/products/{id}` | Single product |
| POST | `/api/cart/calculate` | Compute subtotal, discount, tax, total |
| POST | `/api/orders` | Place order |
| GET | `/api/orders/{orderId}` | Retrieve order |

### Promo Codes
- `SAVE10` — 10% off
- `SAVE20` — 20% off
- `VIP30` — 30% off
