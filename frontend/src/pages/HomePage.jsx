import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import ProductCard from '../components/ProductCard'

const CATEGORIES = [
  { name: 'Electronics', icon: '🎧', color: '#4f46e5' },
  { name: 'Footwear',    icon: '👟', color: '#0891b2' },
  { name: 'Sports',      icon: '🏃', color: '#16a34a' },
  { name: 'Kitchen',     icon: '☕', color: '#d97706' },
  { name: 'Accessories', icon: '🎒', color: '#db2777' },
  { name: 'Home Office', icon: '💡', color: '#7c3aed' },
]

export default function HomePage() {
  const { products, productsLoaded } = useCart()
  const featured = products.slice(0, 4)

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <p className="hero-eyebrow">New arrivals every week</p>
          <h1 className="hero-title">Discover Products<br />You'll Love</h1>
          <p className="hero-subtitle">
            From electronics to sportswear — quality picks at great prices,
            delivered straight to your door.
          </p>
          <div className="hero-actions">
            <Link to="/products" className="btn-primary">Shop Now</Link>
            <Link to="/products" className="btn-ghost">Browse All →</Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-img-grid">
            <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop&auto=format" alt="headphones" />
            <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop&auto=format" alt="shoes" />
            <img src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop&auto=format" alt="backpack" />
            <img src="https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=300&h=300&fit=crop&auto=format" alt="bottle" />
          </div>
        </div>
      </section>

      {/* USP bar */}
      <div className="usp-bar">
        <div className="usp-item"><span>🚚</span> Free shipping over $50</div>
        <div className="usp-item"><span>↩️</span> 30-day returns</div>
        <div className="usp-item"><span>🔒</span> Secure checkout</div>
        <div className="usp-item"><span>⭐</span> Top-rated products</div>
      </div>

      {/* Categories */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Shop by Category</h2>
          <Link to="/products" className="section-link">View all →</Link>
        </div>
        <div className="categories-grid">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.name}
              to={`/products?category=${cat.name}`}
              className="category-card"
              style={{ '--cat-color': cat.color }}
            >
              <span className="category-icon">{cat.icon}</span>
              <span className="category-name">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Featured Products</h2>
          <Link to="/products" className="section-link">See all products →</Link>
        </div>
        {!productsLoaded ? (
          <p className="loading-msg">Loading products...</p>
        ) : (
          <div className="product-grid">
            {featured.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Banner */}
      <section className="promo-banner">
        <div className="promo-banner-content">
          <h2>Up to 30% off with promo codes</h2>
          <p>Use <strong>SAVE10</strong>, <strong>SAVE20</strong>, or <strong>VIP30</strong> at checkout</p>
          <Link to="/products" className="btn-primary">Shop the Sale</Link>
        </div>
      </section>
    </div>
  )
}
