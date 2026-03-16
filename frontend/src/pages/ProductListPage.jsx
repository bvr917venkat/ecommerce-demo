import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import ProductCard from '../components/ProductCard'

const ALL = 'All'

export default function ProductListPage() {
  const { products, productsLoaded } = useCart()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')

  const activeCategory = searchParams.get('category') || ALL

  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category))].sort()
    return [ALL, ...cats]
  }, [products])

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchCat = activeCategory === ALL || p.category === activeCategory
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.category.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [products, activeCategory, search])

  const setCategory = (cat) => {
    if (cat === ALL) setSearchParams({})
    else setSearchParams({ category: cat })
  }

  return (
    <div className="plp-page">
      <div className="plp-header">
        <div>
          <h1 className="plp-title">All Products</h1>
          <p className="plp-count">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <input
          className="search-input"
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="category-filters">
        {categories.map(cat => (
          <button
            key={cat}
            className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {!productsLoaded ? (
        <p className="loading-msg">Loading products...</p>
      ) : filtered.length === 0 ? (
        <p className="loading-msg">No products found.</p>
      ) : (
        <div className="product-grid plp-grid">
          {filtered.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
