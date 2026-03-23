package com.demo.ecommerce.controller;

import com.demo.ecommerce.model.Order;
import com.demo.ecommerce.model.OrderRequest;
import com.demo.ecommerce.service.OrderService;
import io.sentry.Sentry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:5173")
public class OrderController {

    private static final Logger log = LoggerFactory.getLogger(OrderController.class);

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public Order createOrder(@RequestBody OrderRequest request) {
        log.info("POST /api/orders: placing order with {} items", request.getItems().size());
        Sentry.logger().info("POST /api/orders: placing order with %d items", request.getItems().size());
        Order order = orderService.createOrder(request, ProductController.PRODUCT_CATALOG);
        log.info("Order placed successfully: orderId={}", order.getOrderId());
        Sentry.logger().info("Order placed successfully: orderId=%s", order.getOrderId());
        return order;
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<Order> getOrder(@PathVariable String orderId) {
        log.info("GET /api/orders/{}", orderId);
        Sentry.logger().info("GET /api/orders/%s", orderId);
        Order order = orderService.getOrder(orderId);
        if (order == null) {
            log.warn("Order lookup returned 404: orderId={}", orderId);
            Sentry.logger().warn("Order lookup returned 404: orderId=%s", orderId);
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(order);
    }
}
