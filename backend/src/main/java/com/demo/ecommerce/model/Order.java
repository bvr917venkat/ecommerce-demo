package com.demo.ecommerce.model;

import java.util.List;

public class Order {
    private String orderId;
    private List<CartItemDetail> itemDetails;
    private ShippingAddress shippingAddress;
    private double subtotal;
    private double discountAmount;
    private String promoCode;
    private double tax;
    private double total;
    private String status;
    private String createdAt;
    private String cardLast4;

    public Order(String orderId, List<CartItemDetail> itemDetails, ShippingAddress shippingAddress,
                 double subtotal, double discountAmount, String promoCode,
                 double tax, double total, String status, String createdAt, String cardLast4) {
        this.orderId = orderId;
        this.itemDetails = itemDetails;
        this.shippingAddress = shippingAddress;
        this.subtotal = subtotal;
        this.discountAmount = discountAmount;
        this.promoCode = promoCode;
        this.tax = tax;
        this.total = total;
        this.status = status;
        this.createdAt = createdAt;
        this.cardLast4 = cardLast4;
    }

    public String getOrderId() { return orderId; }
    public List<CartItemDetail> getItemDetails() { return itemDetails; }
    public ShippingAddress getShippingAddress() { return shippingAddress; }
    public double getSubtotal() { return subtotal; }
    public double getDiscountAmount() { return discountAmount; }
    public String getPromoCode() { return promoCode; }
    public double getTax() { return tax; }
    public double getTotal() { return total; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreatedAt() { return createdAt; }
    public String getCardLast4() { return cardLast4; }
}
