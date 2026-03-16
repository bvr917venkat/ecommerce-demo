import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

const EMPTY_ADDRESS = {
  fullName: '', email: '', phone: '',
  street: '', city: '', state: '', zipCode: '', country: 'US'
}

const EMPTY_PAYMENT = {
  cardHolder: '', cardNumber: '', expiryDate: '', cvv: ''
}

export default function CheckoutPage() {
  const { cartItems, clearCart } = useCart()
  const navigate = useNavigate()
  const location = useLocation()

  const [address, setAddress] = useState(EMPTY_ADDRESS)
  const [payment, setPayment] = useState(EMPTY_PAYMENT)
  const [summary, setSummary] = useState(null)
  const [errors, setErrors] = useState({})
  const [placing, setPlacing] = useState(false)

  const promoCode = location.state?.promoCode || ''

  useEffect(() => {
    if (cartItems.length === 0) return
    const payload = {
      items: cartItems.map(({ product, quantity }) => ({ productId: product.id, quantity })),
      promoCode: promoCode || null
    }
    fetch('http://localhost:8080/api/cart/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(r => r.json())
      .then(setSummary)
      .catch(console.error)
  }, [cartItems.length])

  if (cartItems.length === 0) {
    return (
      <div className="page-center">
        <p>Your cart is empty. <Link to="/products">Go shopping</Link></p>
      </div>
    )
  }

  const setAddr = (field, value) => setAddress(prev => ({ ...prev, [field]: value }))
  const setPay  = (field, value) => setPayment(prev => ({ ...prev, [field]: value }))

  const formatCardNumber = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(.{4})/g, '$1 ').trim()
  }

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4)
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2)
    return digits
  }

  const validate = () => {
    const e = {}
    if (!address.fullName.trim()) e.fullName = 'Required'
    if (!address.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email required'
    if (!address.street.trim()) e.street = 'Required'
    if (!address.city.trim()) e.city = 'Required'
    if (!address.state.trim()) e.state = 'Required'
    if (!address.zipCode.trim()) e.zipCode = 'Required'
    if (!payment.cardHolder.trim()) e.cardHolder = 'Required'
    if (payment.cardNumber.replace(/\s/g, '').length < 16) e.cardNumber = 'Enter 16-digit card number'
    if (!payment.expiryDate.match(/^\d{2}\/\d{2}$/)) e.expiryDate = 'MM/YY format required'
    if (payment.cvv.length < 3) e.cvv = '3-4 digits required'
    return e
  }

  const handlePlaceOrder = async () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setErrors({})
    setPlacing(true)

    const payload = {
      items: cartItems.map(({ product, quantity }) => ({ productId: product.id, quantity })),
      promoCode: promoCode || null,
      shippingAddress: address,
      cardNumber: payment.cardNumber.replace(/\s/g, ''),
      cardHolder: payment.cardHolder,
      expiryDate: payment.expiryDate
    }

    try {
      const res = await fetch('http://localhost:8080/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const order = await res.json()
      clearCart()
      navigate(`/order-confirmation/${order.orderId}`)
    } catch {
      setErrors({ submit: 'Failed to place order. Please try again.' })
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="checkout-page">
      <h1 className="page-title">Checkout</h1>

      <div className="checkout-layout">
        {/* Left: Forms */}
        <div className="checkout-forms">

          {/* Shipping */}
          <div className="form-section">
            <h2 className="form-section-title">
              <span className="step-num">1</span> Shipping Address
            </h2>
            <div className="form-grid">
              <div className="form-field full">
                <label>Full Name</label>
                <input value={address.fullName} onChange={e => setAddr('fullName', e.target.value)} placeholder="Jane Smith" />
                {errors.fullName && <span className="field-error">{errors.fullName}</span>}
              </div>
              <div className="form-field">
                <label>Email</label>
                <input type="email" value={address.email} onChange={e => setAddr('email', e.target.value)} placeholder="jane@example.com" />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>
              <div className="form-field">
                <label>Phone</label>
                <input type="tel" value={address.phone} onChange={e => setAddr('phone', e.target.value)} placeholder="+1 555 000 0000" />
              </div>
              <div className="form-field full">
                <label>Street Address</label>
                <input value={address.street} onChange={e => setAddr('street', e.target.value)} placeholder="123 Main St, Apt 4B" />
                {errors.street && <span className="field-error">{errors.street}</span>}
              </div>
              <div className="form-field">
                <label>City</label>
                <input value={address.city} onChange={e => setAddr('city', e.target.value)} placeholder="New York" />
                {errors.city && <span className="field-error">{errors.city}</span>}
              </div>
              <div className="form-field">
                <label>State / Province</label>
                <input value={address.state} onChange={e => setAddr('state', e.target.value)} placeholder="NY" />
                {errors.state && <span className="field-error">{errors.state}</span>}
              </div>
              <div className="form-field">
                <label>ZIP / Postal Code</label>
                <input value={address.zipCode} onChange={e => setAddr('zipCode', e.target.value)} placeholder="10001" />
                {errors.zipCode && <span className="field-error">{errors.zipCode}</span>}
              </div>
              <div className="form-field">
                <label>Country</label>
                <select value={address.country} onChange={e => setAddr('country', e.target.value)}>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="IN">India</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="form-section">
            <h2 className="form-section-title">
              <span className="step-num">2</span> Payment Details
            </h2>
            <div className="payment-icons">
              <span className="payment-icon">💳 Visa</span>
              <span className="payment-icon">💳 Mastercard</span>
              <span className="payment-icon">💳 Amex</span>
            </div>
            <div className="form-grid">
              <div className="form-field full">
                <label>Cardholder Name</label>
                <input value={payment.cardHolder} onChange={e => setPay('cardHolder', e.target.value)} placeholder="Jane Smith" />
                {errors.cardHolder && <span className="field-error">{errors.cardHolder}</span>}
              </div>
              <div className="form-field full">
                <label>Card Number</label>
                <input
                  value={payment.cardNumber}
                  onChange={e => setPay('cardNumber', formatCardNumber(e.target.value))}
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                />
                {errors.cardNumber && <span className="field-error">{errors.cardNumber}</span>}
              </div>
              <div className="form-field">
                <label>Expiry Date</label>
                <input
                  value={payment.expiryDate}
                  onChange={e => setPay('expiryDate', formatExpiry(e.target.value))}
                  placeholder="MM/YY"
                  maxLength="5"
                />
                {errors.expiryDate && <span className="field-error">{errors.expiryDate}</span>}
              </div>
              <div className="form-field">
                <label>CVV</label>
                <input
                  type="password"
                  value={payment.cvv}
                  onChange={e => setPay('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="•••"
                  maxLength="4"
                />
                {errors.cvv && <span className="field-error">{errors.cvv}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <aside className="checkout-summary">
          <h2>Order Summary</h2>
          <div className="checkout-items">
            {cartItems.map(({ product, quantity }) => (
              <div key={product.id} className="checkout-item">
                <img src={product.imageUrl} alt={product.name} className="checkout-item-img" />
                <div className="checkout-item-info">
                  <span className="checkout-item-name">{product.name}</span>
                  <span className="checkout-item-qty">Qty: {quantity}</span>
                </div>
                <span className="checkout-item-price">${(product.price * quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {summary ? (
            <div className="summary-lines">
              <div className="summary-line"><span>Subtotal</span><span>${summary.subtotal.toFixed(2)}</span></div>
              {summary.discountAmount > 0 && (
                <div className="summary-line discount">
                  <span>Discount ({summary.promoCode})</span>
                  <span>−${summary.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="summary-line"><span>Tax (10%)</span><span>${summary.tax.toFixed(2)}</span></div>
              <div className="summary-line total"><span>Total</span><span>${summary.total.toFixed(2)}</span></div>
            </div>
          ) : (
            <p className="loading-msg">Calculating...</p>
          )}

          {errors.submit && <p className="field-error" style={{ marginBottom: '0.75rem' }}>{errors.submit}</p>}

          <button className="btn-place-order" onClick={handlePlaceOrder} disabled={placing}>
            {placing ? 'Placing Order...' : `Place Order${summary ? ' · $' + summary.total.toFixed(2) : ''}`}
          </button>
          <p className="secure-note">🔒 Your payment information is encrypted and secure</p>
        </aside>
      </div>
    </div>
  )
}
