import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function CartPage() {
  const { cartItems, addToCart, removeFromCart, setQuantity, clearCart } = useCart()
  const [promoCode, setPromoCode] = useState('')
  const [summary, setSummary] = useState(null)
  const [promoError, setPromoError] = useState('')
  const [calculating, setCalculating] = useState(false)
  const navigate = useNavigate()

  const localSubtotal = cartItems.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0)

  const handleApplyPromo = async () => {
    if (cartItems.length === 0) return
    setCalculating(true)
    setPromoError('')
    setSummary(null)

    const payload = {
      items: cartItems.map(({ product, quantity }) => ({ productId: product.id, quantity })),
      promoCode: promoCode.trim() || null
    }
    try {
      const res = await fetch('http://localhost:8080/api/cart/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      setSummary(data)
      if (promoCode && !data.promoCode) setPromoError('Invalid promo code')
    } catch {
      setPromoError('Could not reach server.')
    } finally {
      setCalculating(false)
    }
  }

  const handleCheckout = () => {
    // Pass summary (or recompute on checkout page)
    navigate('/checkout', { state: { promoCode: summary?.promoCode || promoCode } })
  }

  if (cartItems.length === 0) {
    return (
      <div className="page-center">
        <div className="empty-cart-page">
          <div className="empty-cart-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything yet.</p>
          <Link to="/products" className="btn-primary">Start Shopping</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <h1 className="page-title">Your Cart</h1>

      <div className="cart-layout">
        {/* Items */}
        <div className="cart-items-section">
          <div className="cart-items-header">
            <span>{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</span>
            <button className="clear-link" onClick={clearCart}>Clear cart</button>
          </div>

          {cartItems.map(({ product, quantity }) => (
            <div key={product.id} className="cart-row">
              <Link to={`/products/${product.id}`}>
                <img src={product.imageUrl} alt={product.name} className="cart-row-img" />
              </Link>
              <div className="cart-row-info">
                <Link to={`/products/${product.id}`} className="cart-row-name">{product.name}</Link>
                <span className="cart-row-cat">{product.category}</span>
                <span className="cart-row-unit">${product.price.toFixed(2)} each</span>
              </div>
              <div className="cart-row-right">
                <div className="qty-controls">
                  <button className="qty-btn" onClick={() => removeFromCart(product.id)}>−</button>
                  <input
                    type="number"
                    className="qty-input-sm"
                    value={quantity}
                    min="1"
                    onChange={e => setQuantity(product.id, Number(e.target.value))}
                  />
                  <button className="qty-btn" onClick={() => addToCart(product.id)}>+</button>
                </div>
                <span className="cart-row-total">${(product.price * quantity).toFixed(2)}</span>
                <button className="remove-btn" onClick={() => setQuantity(product.id, 0)}>✕</button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <aside className="cart-summary-box">
          <h2>Order Summary</h2>

          <div className="promo-row">
            <input
              type="text"
              className="promo-input"
              placeholder="Promo code"
              value={promoCode}
              onChange={e => { setPromoCode(e.target.value); setSummary(null) }}
            />
            <button className="promo-apply-btn" onClick={handleApplyPromo} disabled={calculating}>
              {calculating ? '...' : 'Apply'}
            </button>
          </div>
          {promoError && <p className="promo-error">{promoError}</p>}
          {summary?.promoCode && <p className="promo-success">✓ {summary.promoCode} applied!</p>}

          <div className="summary-lines">
            <div className="summary-line">
              <span>Subtotal</span>
              <span>${(summary?.subtotal ?? localSubtotal).toFixed(2)}</span>
            </div>
            {summary?.discountAmount > 0 && (
              <div className="summary-line discount">
                <span>Discount ({summary.promoCode})</span>
                <span>−${summary.discountAmount.toFixed(2)}</span>
              </div>
            )}
            {summary && (
              <div className="summary-line">
                <span>Tax (10%)</span>
                <span>${summary.tax.toFixed(2)}</span>
              </div>
            )}
            <div className="summary-line total">
              <span>Total</span>
              <span>${(summary?.total ?? localSubtotal).toFixed(2)}</span>
            </div>
          </div>

          {!summary && (
            <p className="promo-hint">Apply a promo code to see final total</p>
          )}

          <button className="btn-checkout" onClick={handleCheckout}>
            Proceed to Checkout →
          </button>
          <Link to="/products" className="continue-link">← Continue Shopping</Link>
        </aside>
      </div>
    </div>
  )
}
