package com.demo.ecommerce.service;

import com.demo.ecommerce.model.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class CartService {

    private static final double TAX_RATE = 0.10; // 10% tax

    // Promo codes: code -> discount percentage (0-100)
    private static final Map<String, Double> PROMO_CODES = Map.of(
        "SAVE10", 10.0,
        "SAVE20", 20.0,
        "VIP30",  30.0
    );

    public CartResponse calculateTotal(CartRequest request, Map<Long, Product> productCatalog) {
        List<CartItemDetail> itemDetails = new ArrayList<>();
        double subtotal = 0.0;

        for (CartItem item : request.getItems()) {
            Product product = productCatalog.get(item.getProductId());
            if (product == null) continue;

            CartItemDetail detail = new CartItemDetail(
                product.getId(),
                product.getName(),
                product.getPrice(),
                item.getQuantity()
            );
            itemDetails.add(detail);
            subtotal += detail.getLineTotal();
        }

        // Apply promo code discount
        double discountPercent = 0.0;
        String appliedPromo = null;
        if (request.getPromoCode() != null && !request.getPromoCode().isBlank()) {
            String code = request.getPromoCode().toUpperCase();
            if (PROMO_CODES.containsKey(code)) {
                discountPercent = PROMO_CODES.get(code);
                appliedPromo = code;
            }
        }

        double discountAmount = subtotal * (discountPercent / 100.0);
        double discountedSubtotal = subtotal - discountAmount;

        // Tax is applied on the discounted amount
        double tax = discountedSubtotal * TAX_RATE;
        double total = discountedSubtotal + tax;

        return new CartResponse(
            itemDetails,
            round(subtotal),
            round(discountAmount),
            appliedPromo,
            round(tax),
            round(total)
        );
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
