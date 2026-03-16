package com.demo.ecommerce.service;

import com.demo.ecommerce.model.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class OrderService {

    private final Map<String, Order> orders = new ConcurrentHashMap<>();
    private final AtomicLong orderCounter = new AtomicLong(1000);
    private final CartService cartService;

    public OrderService(CartService cartService) {
        this.cartService = cartService;
    }

    public Order createOrder(OrderRequest request, Map<Long, Product> productCatalog) {
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
        return order;
    }

    public Order getOrder(String orderId) {
        return orders.get(orderId);
    }
}
