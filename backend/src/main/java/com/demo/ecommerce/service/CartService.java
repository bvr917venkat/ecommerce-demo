package com.demo.ecommerce.service;

import com.demo.ecommerce.model.*;
import io.sentry.Sentry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class CartService {

    private static final Logger log = LoggerFactory.getLogger(CartService.class);

    private static final double TAX_RATE = 0.10; // 10% tax

    // Promo codes: code -> discount percentage (0-100)
    private static final Map<String, Double> PROMO_CODES = Map.of(
        "SAVE10", 10.0,
        "SAVE20", 20.0,
        "VIP30",  30.0
    );

    public CartResponse calculateTotal(CartRequest request, Map<Long, Product> productCatalog) {
        log.info("Calculating cart total: {} items, promoCode={}",
            request.getItems() != null ? request.getItems().size() : 0,
            request.getPromoCode());
        Sentry.logger().info("Calculating cart total: %d items, promoCode=%s",
            request.getItems() != null ? request.getItems().size() : 0,
            request.getPromoCode());

        List<CartItemDetail> itemDetails = new ArrayList<>();
        double subtotal = 0.0;

        for (CartItem item : request.getItems()) {
            Product product = productCatalog.get(item.getProductId());
            if (product == null) {
                log.warn("Product not found in catalog: productId={}", item.getProductId());
                Sentry.logger().warn("Product not found in catalog: productId=%d", item.getProductId());
                continue;
            }

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
                log.info("Promo code applied: code={}, discount={}%", code, discountPercent);
                Sentry.logger().info("Promo code applied: code=%s, discount=%.0f%%", code, discountPercent);
            } else {
                log.warn("Invalid promo code attempted: code={}", code);
                Sentry.logger().warn("Invalid promo code attempted: code=%s", code);
            }
        }

        double discountAmount = subtotal * (discountPercent / 100.0);
        double discountedSubtotal = subtotal - discountAmount;

        // Tax is applied on the discounted amount
        double tax = subtotal * TAX_RATE;
        double total = discountedSubtotal + tax;

        log.info("Cart calculated: subtotal={}, discount={}, tax={}, total={}", round(subtotal), round(discountAmount), round(tax), round(total));
        Sentry.logger().info("Cart calculated: subtotal=%.2f, discount=%.2f, tax=%.2f, total=%.2f", round(subtotal), round(discountAmount), round(tax), round(total));

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
