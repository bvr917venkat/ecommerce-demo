import { useState } from 'react'

export default function Cart({ cart, products, onAdd, onRemove, onClear }) {
  const [promoCode, setPromoCode] = useState('')
  const [orderSummary, setOrderSummary] = useState(null)
  const [calcError, setCalcError] = useState(null)
  const [calculating, setCalculating] = useState(false)

  const cartItems = Object.entries(cart).map(([productId, quantity]) => {
    const product = products.find(p => p.id === Number(productId))
    return product ? { product, quantity } : null
  }).filter(Boolean)

  const localSubtotal = cartItems.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0)

  const handleCalculate = async () => {
    if (cartItems.length === 0) return
    setCalculating(true)
    setCalcError(null)
    setOrderSummary(null)

    const payload = {
      items: cartItems.map(({ product, quantity }) => ({
        productId: product.id,
        quantity
      })),
      promoCode: promoCode.trim() || null
    }

    try {
      const res = await fetch('http://localhost:8080/api/cart/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      setOrderSummary(data)
    } catch {
      setCalcError('Could not calculate order total. Is the backend running?')
    } finally {
      setCalculating(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <aside className="cart">
        <h2>Cart</h2>
        <p className="empty-cart">Your cart is empty.</p>
      </aside>
    )
  }

  return (
    <aside className="cart">
      <h2>Cart</h2>

      <ul className="cart-items">
        {cartItems.map(({ product, quantity }) => (
          <li key={product.id} className="cart-item">
            <div className="cart-item-info">
              <span className="cart-item-name">{product.name}</span>
              <span className="cart-item-price">${(product.price * quantity).toFixed(2)}</span>
            </div>
            <div className="cart-item-controls">
              <button className="qty-btn small" onClick={() => onRemove(product.id)}>−</button>
              <span>{quantity}</span>
              <button className="qty-btn small" onClick={() => onAdd(product.id)}>+</button>
            </div>
          </li>
        ))}
      </ul>

      <div className="cart-subtotal">
        Subtotal: <strong>${localSubtotal.toFixed(2)}</strong>
      </div>

      <div className="promo-section">
        <input
          type="text"
          placeholder="Promo code (SAVE10, SAVE20, VIP30)"
          value={promoCode}
          onChange={e => setPromoCode(e.target.value)}
          className="promo-input"
        />
      </div>

      <div className="cart-actions">
        <button className="checkout-btn" onClick={handleCalculate} disabled={calculating}>
          {calculating ? 'Calculating...' : 'Calculate Order Total'}
        </button>
        <button className="clear-btn" onClick={() => { onClear(); setOrderSummary(null) }}>
          Clear Cart
        </button>
      </div>

      {calcError && <p className="calc-error">{calcError}</p>}

      {orderSummary && (
        <div className="order-summary">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>${orderSummary.subtotal.toFixed(2)}</span>
          </div>
          {orderSummary.discountAmount > 0 && (
            <div className="summary-row discount">
              <span>Discount ({orderSummary.promoCode})</span>
              <span>−${orderSummary.discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="summary-row">
            <span>Tax (10%)</span>
            <span>${orderSummary.tax.toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>${orderSummary.total.toFixed(2)}</span>
          </div>
        </div>
      )}
    </aside>
  )
}
