export default function ProductList({ products, cart, onAddToCart, onRemoveFromCart }) {
  return (
    <section className="product-section">
      <h2>Products</h2>
      <div className="product-grid">
        {products.map(product => {
          const qty = cart[product.id] || 0
          return (
            <div key={product.id} className="product-card">
              <div className="product-category">{product.category}</div>
              <h3 className="product-name">{product.name}</h3>
              <p className="product-description">{product.description}</p>
              <div className="product-footer">
                <span className="product-price">${product.price.toFixed(2)}</span>
                <div className="quantity-controls">
                  {qty > 0 ? (
                    <>
                      <button className="qty-btn" onClick={() => onRemoveFromCart(product.id)}>−</button>
                      <span className="qty-display">{qty}</span>
                      <button className="qty-btn" onClick={() => onAddToCart(product.id)}>+</button>
                    </>
                  ) : (
                    <button className="add-btn" onClick={() => onAddToCart(product.id)}>
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
