package com.demo.ecommerce.service;

import com.demo.ecommerce.model.Customer;
import io.sentry.Sentry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class CustomerService {

    private static final Logger log = LoggerFactory.getLogger(CustomerService.class);

    private static final Map<String, Customer> CUSTOMERS = new HashMap<>();

    static {
        CUSTOMERS.put("CUST-001", new Customer(
            "CUST-001", "Alice Johnson", "alice@example.com", "555-0101",
            "VIP", "2020-03-15", 47, 3842.50
        ));
        CUSTOMERS.put("CUST-002", new Customer(
            "CUST-002", "Bob Martinez", "bob@example.com", "555-0102",
            "GOLD", "2021-07-22", 23, 1547.00
        ));
        CUSTOMERS.put("CUST-003", new Customer(
            "CUST-003", "Carol White", "carol@example.com", "555-0103",
            "SILVER", "2022-11-08", 9, 621.75
        ));
        CUSTOMERS.put("CUST-004", new Customer(
            "CUST-004", "David Lee", "david@example.com", "555-0104",
            "STANDARD", "2024-01-30", 2, 89.99
        ));
        CUSTOMERS.put("CUST-005", new Customer(
            "CUST-005", "Emma Davis", "emma@example.com", "555-0105",
            "VIP", "2019-06-10", 112, 9215.40
        ));
    }

    public Customer getCustomer(String customerId) {
        Customer customer = CUSTOMERS.get(customerId);
        if (customer == null) {
            log.warn("Customer not found: customerId={}", customerId);
            Sentry.logger().warn("Customer not found: customerId=%s", customerId);
        } else {
            log.info("Customer retrieved: customerId={}, tier={}", customerId, customer.getTier());
            Sentry.logger().info("Customer retrieved: customerId=%s, tier=%s", customerId, customer.getTier());
        }
        return customer;
    }

    public Customer getCustomerByEmail(String email) {
        Customer customer = CUSTOMERS.values().stream()
            .filter(c -> c.getEmail().equalsIgnoreCase(email))
            .findFirst()
            .orElse(null);
        if (customer == null) {
            log.warn("Customer not found by email: email={}", email);
            Sentry.logger().warn("Customer not found by email: email=%s", email);
        } else {
            log.info("Customer retrieved by email: customerId={}, tier={}", customer.getCustomerId(), customer.getTier());
            Sentry.logger().info("Customer retrieved by email: customerId=%s, tier=%s", customer.getCustomerId(), customer.getTier());
        }
        return customer;
    }
}
