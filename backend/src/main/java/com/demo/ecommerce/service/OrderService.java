package com.demo.ecommerce.service;

import com.demo.ecommerce.model.*;
import io.sentry.Sentry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final Map<String, Order> orders = new ConcurrentHashMap<>();
    private final AtomicLong orderCounter = new AtomicLong(1000);
    private final CartService cartService;

    public OrderService(CartService cartService) {
        this.cartService = cartService;
    }

    public Order createOrder(OrderRequest request, Map<Long, Product> productCatalog) {
        log.info("Creating order: {} items, promoCode={}", request.getItems().size(), request.getPromoCode());
        Sentry.logger().info("Creating order: %d items, promoCode=%s", request.getItems().size(), request.getPromoCode());
        // Reuse cart calculation logic
        CartRequest cartRequest = new CartRequest();
        cartRequest.setItems(request.getItems());
        cartRequest.setPromoCode(request.getPromoCode());
        CartResponse cart = cartService.calculateTotal(cartRequest, productCatalog);

        // Derive last 4 digits only; discard full card number
        String raw = request.getCardNumber() != null ? request.getCardNumber().replaceAll("\\s", "") : "";
        String cardLast4 = raw.length() >= 4 ? raw.substring(raw.length() - 4) : "****";

        String orderId = "ORD-" + orderCounter.incrementAndGet();
        String createdAt = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        Order order = new Order(
            orderId,
            cart.getItemDetails(),
            request.getShippingAddress(),
            cart.getSubtotal(),
            cart.getDiscountAmount(),
            cart.getPromoCode(),
            cart.getTax(),
            cart.getTotal(),
            "CONFIRMED",
            createdAt,
            cardLast4
        );

        orders.put(orderId, order);
        log.info("Order created: orderId={}, total={}, status={}", orderId, cart.getTotal(), order.getStatus());
        Sentry.logger().info("Order created: orderId=%s, total=%.2f, status=%s", orderId, cart.getTotal(), order.getStatus());
        return order;
    }

    public Order getOrder(String orderId) {
        Order order = orders.get(orderId);
        if (order == null) {
            log.warn("Order not found: orderId={}", orderId);
            Sentry.logger().warn("Order not found: orderId=%s", orderId);
        } else {
            log.info("Order retrieved: orderId={}, status={}", orderId, order.getStatus());
            Sentry.logger().info("Order retrieved: orderId=%s, status=%s", orderId, order.getStatus());
        }
        return order;
    }

    public void markRefunded(String orderId) {
        Order order = orders.get(orderId);
        if (order != null) {
            order.setStatus("REFUNDED");
            log.info("Order refunded: orderId={}", orderId);
            Sentry.logger().info("Order refunded: orderId=%s", orderId);
        } else {
            log.warn("Refund attempted on non-existent order: orderId={}", orderId);
            Sentry.logger().warn("Refund attempted on non-existent order: orderId=%s", orderId);
        }
    }
}
