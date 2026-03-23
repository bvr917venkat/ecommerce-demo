package com.demo.ecommerce.controller;

import com.demo.ecommerce.model.CartRequest;
import com.demo.ecommerce.model.CartResponse;
import com.demo.ecommerce.service.CartService;
import io.sentry.Sentry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "http://localhost:5173")
public class CartController {

    private static final Logger log = LoggerFactory.getLogger(CartController.class);

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @PostMapping("/calculate")
    public CartResponse calculateCart(@RequestBody CartRequest request) {
        log.info("POST /api/cart/calculate: {} items", request.getItems() != null ? request.getItems().size() : 0);
        Sentry.logger().info("POST /api/cart/calculate: %d items", request.getItems() != null ? request.getItems().size() : 0);
        return cartService.calculateTotal(request, ProductController.PRODUCT_CATALOG);
    }
}
