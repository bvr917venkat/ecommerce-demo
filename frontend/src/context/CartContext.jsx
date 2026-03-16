import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cart, setCart] = useState({})       // { [productId]: quantity }
  const [products, setProducts] = useState([])
  const [productsLoaded, setProductsLoaded] = useState(false)

  useEffect(() => {
    fetch('http://localhost:8080/api/products')
      .then(r => r.json())
      .then(data => {
        setProducts(data)
        setProductsLoaded(true)
      })
      .catch(console.error)
  }, [])

  const addToCart = (productId) =>
    setCart(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }))

  const removeFromCart = (productId) =>
    setCart(prev => {
      const updated = { ...prev }
      if (updated[productId] > 1) updated[productId]--
      else delete updated[productId]
      return updated
    })

  const setQuantity = (productId, qty) => {
    if (qty <= 0) {
      setCart(prev => { const u = { ...prev }; delete u[productId]; return u })
    } else {
      setCart(prev => ({ ...prev, [productId]: qty }))
    }
  }

  const clearCart = () => setCart({})

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0)

  const cartItems = Object.entries(cart)
    .map(([id, quantity]) => {
      const product = products.find(p => p.id === Number(id))
      return product ? { product, quantity } : null
    })
    .filter(Boolean)

  return (
    <CartContext.Provider value={{
      cart, products, productsLoaded,
      addToCart, removeFromCart, setQuantity, clearCart,
      cartCount, cartItems
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
