package com.demo.ecommerce.controller;

import com.demo.ecommerce.model.*;
import com.demo.ecommerce.service.CustomerService;
import com.demo.ecommerce.service.OrderService;
import io.sentry.Sentry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class CustomerController {

    private static final Logger log = LoggerFactory.getLogger(CustomerController.class);

    private final CustomerService customerService;
    private final OrderService orderService;
    private final AtomicLong refundCounter = new AtomicLong(5000);

    public CustomerController(CustomerService customerService, OrderService orderService) {
        this.customerService = customerService;
        this.orderService = orderService;
    }

    // ── Customer lookup by ID ─────────────────────────────────────────────────
    @GetMapping("/customers/{customerId}")
    public ResponseEntity<Customer> getCustomer(@PathVariable String customerId) {
        log.info("GET /api/customers/{}", customerId);
        Sentry.logger().info("GET /api/customers/%s", customerId);
        Customer customer = customerService.getCustomer(customerId);
        if (customer == null) {
            log.warn("Customer lookup returned 404: customerId={}", customerId);
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(customer);
    }

    // ── Customer lookup by email ──────────────────────────────────────────────
    @GetMapping("/customers")
    public ResponseEntity<Customer> getCustomerByEmail(@RequestParam String email) {
        log.info("GET /api/customers?email={}", email);
        Sentry.logger().info("GET /api/customers?email=%s", email);
        Customer customer = customerService.getCustomerByEmail(email);
        if (customer == null) {
            log.warn("Customer email lookup returned 404: email={}", email);
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(customer);
    }

    // ── Process refund ────────────────────────────────────────────────────────
    @PostMapping("/orders/{orderId}/refund")
    public ResponseEntity<RefundResponse> processRefund(
            @PathVariable String orderId,
            @RequestBody RefundRequest request) {

        Order order = orderService.getOrder(orderId);

        log.info("POST /api/orders/{}/refund: reason={}", orderId, request.getReason());
        Sentry.logger().info("POST /api/orders/%s/refund: reason=%s", orderId, request.getReason());

        if (order == null) {
            log.warn("Refund failed - order not found: orderId={}", orderId);
            return ResponseEntity.ok(RefundResponse.error(
                "Order " + orderId + " not found.",
                "ORDER_NOT_FOUND",
                false
            ));
        }

        if ("REFUNDED".equals(order.getStatus())) {
            log.warn("Refund failed - already refunded: orderId={}", orderId);
            return ResponseEntity.ok(RefundResponse.error(
                "Order " + orderId + " has already been refunded.",
                "ALREADY_REFUNDED",
                false
            ));
        }

        if (!"CONFIRMED".equals(order.getStatus()) && !"SHIPPED".equals(order.getStatus())) {
            log.warn("Refund failed - ineligible status: orderId={}, status={}", orderId, order.getStatus());
            return ResponseEntity.ok(RefundResponse.error(
                "Order " + orderId + " is not eligible for refund (status: " + order.getStatus() + ").",
                "INELIGIBLE_STATUS",
                false
            ));
        }

        // Mark order as refunded
        orderService.markRefunded(orderId);

        String refundId = "REF-" + refundCounter.incrementAndGet();
        log.info("Refund processed successfully: refundId={}, orderId={}, amount={}", refundId, orderId, order.getTotal());
        Sentry.logger().info("Refund processed successfully: refundId=%s, orderId=%s, amount=%.2f", refundId, orderId, order.getTotal());
        return ResponseEntity.ok(RefundResponse.ok(refundId, order.getTotal(), orderId));
    }

    // ── Escalation log ────────────────────────────────────────────────────────
    @PostMapping("/support/escalate")
    public ResponseEntity<String> escalate(@RequestBody java.util.Map<String, String> body) {
        String ticketId = "ESC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Sentry.logger().warn("Support escalation created: ticketId=%s, customerId=%s, orderId=%s, reason=%s",
            ticketId,
            body.getOrDefault("customerId", "unknown"),
            body.getOrDefault("orderId", "unknown"),
            body.getOrDefault("reason", "no reason given"));
        log.warn("Support escalation created: ticketId={}, customerId={}, orderId={}, reason={}",
            ticketId,
            body.getOrDefault("customerId", "unknown"),
            body.getOrDefault("orderId", "unknown"),
            body.getOrDefault("reason", "no reason given"));
        return ResponseEntity.ok("{\"ticketId\":\"" + ticketId + "\",\"message\":\"Escalated to human agent. Ticket: " + ticketId + "\"}");
    }
}
