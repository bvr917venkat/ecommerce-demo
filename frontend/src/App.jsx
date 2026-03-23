import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import ProductListPage from './pages/ProductListPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import SupportChat from './components/SupportChat'
import './App.css'

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Navbar />
        <div className="page-wrapper">
          <Routes>
            <Route path="/"                          element={<HomePage />} />
            <Route path="/products"                  element={<ProductListPage />} />
            <Route path="/products/:id"              element={<ProductDetailPage />} />
            <Route path="/cart"                      element={<CartPage />} />
            <Route path="/checkout"                  element={<CheckoutPage />} />
            <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
          </Routes>
        </div>
        <SupportChat />
      </BrowserRouter>
    </CartProvider>
  )
}

export default App
