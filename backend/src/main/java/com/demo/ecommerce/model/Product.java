package com.demo.ecommerce.model;

public class Product {
    private Long id;
    private String name;
    private String category;
    private double price;
    private String description;
    private int stock;
    private String imageUrl;

    public Product(Long id, String name, String category, double price, String description, int stock, String imageUrl) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.price = price;
        this.description = description;
        this.stock = stock;
        this.imageUrl = imageUrl;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCategory() { return category; }
    public double getPrice() { return price; }
    public String getDescription() { return description; }
    public int getStock() { return stock; }
    public String getImageUrl() { return imageUrl; }
}
