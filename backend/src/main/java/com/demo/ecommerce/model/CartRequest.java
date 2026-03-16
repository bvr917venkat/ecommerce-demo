package com.demo.ecommerce.model;

import java.util.List;

public class CartRequest {
    private List<CartItem> items;
    private String promoCode;

    public CartRequest() {}

    public List<CartItem> getItems() { return items; }
    public void setItems(List<CartItem> items) { this.items = items; }
    public String getPromoCode() { return promoCode; }
    public void setPromoCode(String promoCode) { this.promoCode = promoCode; }
}
