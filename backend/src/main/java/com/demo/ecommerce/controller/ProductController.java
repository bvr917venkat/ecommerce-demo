package com.demo.ecommerce.controller;

import com.demo.ecommerce.model.Product;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:5173")
public class ProductController {

    public static final Map<Long, Product> PRODUCT_CATALOG = Map.of(
        1L, new Product(1L, "Wireless Headphones", "Electronics", 79.99,
            "Premium over-ear headphones with active noise cancellation, 30-hour battery life and Hi-Res Audio certification.", 50,
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop&auto=format"),
        2L, new Product(2L, "Running Shoes", "Footwear", 120.00,
            "Engineered mesh upper for breathability, responsive foam midsole, and durable rubber outsole for all-terrain running.", 30,
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop&auto=format"),
        3L, new Product(3L, "Coffee Maker", "Kitchen", 45.50,
            "12-cup programmable drip coffee maker with brew strength control, auto-pause, and keep-warm plate.", 20,
            "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=600&fit=crop&auto=format"),
        4L, new Product(4L, "Yoga Mat", "Sports", 25.00,
            "Eco-friendly TPE non-slip yoga mat, 6mm thick with alignment lines, carrying strap included.", 100,
            "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=600&fit=crop&auto=format"),
        5L, new Product(5L, "Backpack", "Accessories", 55.00,
            "Water-resistant 30L travel backpack with laptop compartment, USB charging port and ergonomic padded straps.", 40,
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop&auto=format"),
        6L, new Product(6L, "Sunglasses", "Accessories", 35.00,
            "Polarized UV400 sunglasses with lightweight TR90 frame, anti-reflective coating and scratch-resistant lenses.", 60,
            "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&h=600&fit=crop&auto=format"),
        7L, new Product(7L, "Desk Lamp", "Home Office", 40.00,
            "LED desk lamp with 5 color modes, 5 brightness levels, USB-A charging port and touch-sensitive controls.", 35,
            "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&h=600&fit=crop&auto=format"),
        8L, new Product(8L, "Water Bottle", "Sports", 18.00,
            "Vacuum-insulated stainless steel 750ml bottle. Keeps drinks cold 24h, hot 12h. BPA-free lid.", 80,
            "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&h=600&fit=crop&auto=format")
    );

    @GetMapping
    public List<Product> getAllProducts() {
        return PRODUCT_CATALOG.values().stream()
            .sorted(Comparator.comparing(Product::getId))
            .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public Product getProduct(@PathVariable Long id) {
        return PRODUCT_CATALOG.get(id);
    }
}
