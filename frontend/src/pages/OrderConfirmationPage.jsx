import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

export default function OrderConfirmationPage() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`http://localhost:8080/api/orders/${orderId}`)
      .then(r => r.json())
      .then(data => { setOrder(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [orderId])

  if (loading) return <div className="page-center"><p>Loading order...</p></div>
  if (!order)  return <div className="page-center"><p>Order not found.</p></div>

  return (
    <div className="confirmation-page">
      <div className="confirmation-card">
        <div className="confirmation-icon">✓</div>
        <h1>Order Confirmed!</h1>
        <p className="confirmation-sub">
          Thank you, <strong>{order.shippingAddress.fullName}</strong>!
          Your order has been placed successfully.
        </p>

        <div className="confirmation-meta">
          <div className="meta-row">
            <span>Order ID</span>
            <strong>{order.orderId}</strong>
          </div>
          <div className="meta-row">
            <span>Status</span>
            <span className="status-badge">{order.status}</span>
          </div>
          <div className="meta-row">
            <span>Placed</span>
            <span>{order.createdAt}</span>
          </div>
          <div className="meta-row">
            <span>Payment</span>
            <span>Card ending in {order.cardLast4}</span>
          </div>
        </div>

        <div className="confirmation-section">
          <h2>Items Ordered</h2>
          {order.itemDetails.map(item => (
            <div key={item.productId} className="conf-item">
              <span className="conf-item-name">{item.productName}</span>
              <span className="conf-item-qty">× {item.quantity}</span>
              <span className="conf-item-price">${item.lineTotal.toFixed(2)}</span>
            </div>
          ))}

          <div className="conf-totals">
            <div className="conf-total-row"><span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
            {order.discountAmount > 0 && (
              <div className="conf-total-row discount">
                <span>Discount ({order.promoCode})</span>
                <span>−${order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="conf-total-row"><span>Tax</span><span>${order.tax.toFixed(2)}</span></div>
            <div className="conf-total-row total"><span>Total Charged</span><span>${order.total.toFixed(2)}</span></div>
          </div>
        </div>

        <div className="confirmation-section">
          <h2>Shipping To</h2>
          <address className="conf-address">
            <strong>{order.shippingAddress.fullName}</strong><br />
            {order.shippingAddress.street}<br />
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
            {order.shippingAddress.country}<br />
            <span>{order.shippingAddress.email}</span>
          </address>
        </div>

        <div className="confirmation-actions">
          <Link to="/products" className="btn-primary">Continue Shopping</Link>
          <Link to="/" className="btn-ghost">Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
