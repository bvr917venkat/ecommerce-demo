import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useCart } from '../context/CartContext'

export default function ProductDetailPage() {
  const { id } = useParams()
  const { products, productsLoaded, cart, addToCart, removeFromCart, setQuantity } = useCart()
  const navigate = useNavigate()
  const [added, setAdded] = useState(false)

  const product = products.find(p => p.id === Number(id))
  const qty = cart[product?.id] || 0

  const handleAddToCart = () => {
    addToCart(product.id)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  if (!productsLoaded) return <div className="page-center"><p>Loading...</p></div>
  if (!product) return (
    <div className="page-center">
      <p>Product not found.</p>
      <Link to="/products" className="btn-primary" style={{ marginTop: '1rem' }}>Back to Products</Link>
    </div>
  )

  return (
    <div className="pdp-page">
      <Link to="/products" className="back-link">← Back to Products</Link>

      <div className="pdp-layout">
        {/* Image */}
        <div className="pdp-img-wrap">
          <img src={product.imageUrl} alt={product.name} className="pdp-img" />
        </div>

        {/* Details */}
        <div className="pdp-details">
          <span className="product-category-tag">{product.category}</span>
          <h1 className="pdp-name">{product.name}</h1>
          <p className="pdp-price">${product.price.toFixed(2)}</p>

          <p className="pdp-description">{product.description}</p>

          <div className="pdp-stock">
            <span className={product.stock > 10 ? 'in-stock' : 'low-stock'}>
              {product.stock > 10 ? `✓ In Stock (${product.stock} available)` : `⚠ Only ${product.stock} left`}
            </span>
          </div>

          <div className="pdp-actions">
            {qty === 0 ? (
              <button className="btn-add-to-cart" onClick={handleAddToCart}>
                {added ? '✓ Added!' : 'Add to Cart'}
              </button>
            ) : (
              <div className="pdp-qty-row">
                <div className="qty-controls large">
                  <button className="qty-btn" onClick={() => removeFromCart(product.id)}>−</button>
                  <input
                    type="number"
                    className="qty-input"
                    value={qty}
                    min="1"
                    max={product.stock}
                    onChange={e => setQuantity(product.id, Number(e.target.value))}
                  />
                  <button className="qty-btn" onClick={() => addToCart(product.id)}>+</button>
                </div>
                <button className="btn-go-cart" onClick={() => navigate('/cart')}>
                  View Cart →
                </button>
              </div>
            )}
          </div>

          <div className="pdp-meta">
            <div className="meta-item"><span>🚚</span> Free shipping on orders over $50</div>
            <div className="meta-item"><span>↩️</span> Free 30-day returns</div>
            <div className="meta-item"><span>🔒</span> Secure &amp; encrypted checkout</div>
          </div>
        </div>
      </div>
    </div>
  )
}
