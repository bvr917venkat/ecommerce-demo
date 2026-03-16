import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function ProductCard({ product }) {
  const { cart, addToCart, removeFromCart } = useCart()
  const qty = cart[product.id] || 0

  return (
    <div className="product-card">
      <Link to={`/products/${product.id}`} className="product-card-img-link">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="product-card-img"
          loading="lazy"
        />
      </Link>
      <div className="product-card-body">
        <span className="product-category-tag">{product.category}</span>
        <Link to={`/products/${product.id}`} className="product-card-name-link">
          <h3 className="product-card-name">{product.name}</h3>
        </Link>
        <p className="product-card-desc">{product.description}</p>
        <div className="product-card-footer">
          <span className="product-card-price">${product.price.toFixed(2)}</span>
          <div className="qty-controls">
            {qty > 0 ? (
              <>
                <button className="qty-btn" onClick={() => removeFromCart(product.id)}>−</button>
                <span className="qty-num">{qty}</span>
                <button className="qty-btn" onClick={() => addToCart(product.id)}>+</button>
              </>
            ) : (
              <button className="add-btn" onClick={() => addToCart(product.id)}>Add to Cart</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
