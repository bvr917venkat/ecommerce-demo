package com.demo.ecommerce.controller;

import com.demo.ecommerce.model.CartRequest;
import com.demo.ecommerce.model.CartResponse;
import com.demo.ecommerce.service.CartService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "http://localhost:5173")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @PostMapping("/calculate")
    public CartResponse calculateCart(@RequestBody CartRequest request) {
        return cartService.calculateTotal(request, ProductController.PRODUCT_CATALOG);
    }
}
