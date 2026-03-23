package com.demo.ecommerce.model;

public class Customer {
    private String customerId;
    private String name;
    private String email;
    private String phone;
    private String tier;           // STANDARD, SILVER, GOLD, VIP
    private String since;
    private int totalOrders;
    private double lifetimeValue;
    private boolean verified;

    public Customer(String customerId, String name, String email, String phone,
                    String tier, String since, int totalOrders, double lifetimeValue) {
        this.customerId = customerId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.tier = tier;
        this.since = since;
        this.totalOrders = totalOrders;
        this.lifetimeValue = lifetimeValue;
        this.verified = false;
    }

    public String getCustomerId() { return customerId; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getTier() { return tier; }
    public String getSince() { return since; }
    public int getTotalOrders() { return totalOrders; }
    public double getLifetimeValue() { return lifetimeValue; }
    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }
}
