package com.demo.ecommerce.model;

import java.util.List;

public class CartResponse {
    private List<CartItemDetail> itemDetails;
    private double subtotal;
    private double discountAmount;
    private String promoCode;
    private double tax;
    private double total;

    public CartResponse(List<CartItemDetail> itemDetails, double subtotal,
                        double discountAmount, String promoCode, double tax, double total) {
        this.itemDetails = itemDetails;
        this.subtotal = subtotal;
        this.discountAmount = discountAmount;
        this.promoCode = promoCode;
        this.tax = tax;
        this.total = total;
    }

    public List<CartItemDetail> getItemDetails() { return itemDetails; }
    public double getSubtotal() { return subtotal; }
    public double getDiscountAmount() { return discountAmount; }
    public String getPromoCode() { return promoCode; }
    public double getTax() { return tax; }
    public double getTotal() { return total; }
}
