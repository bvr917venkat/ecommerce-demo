package com.demo.ecommerce.model;

public class CartItemDetail {
    private Long productId;
    private String productName;
    private double unitPrice;
    private int quantity;
    private double lineTotal;

    public CartItemDetail(Long productId, String productName, double unitPrice, int quantity) {
        this.productId = productId;
        this.productName = productName;
        this.unitPrice = unitPrice;
        this.quantity = quantity;
        this.lineTotal = unitPrice * quantity;
    }

    public Long getProductId() { return productId; }
    public String getProductName() { return productName; }
    public double getUnitPrice() { return unitPrice; }
    public int getQuantity() { return quantity; }
    public double getLineTotal() { return lineTotal; }
}
