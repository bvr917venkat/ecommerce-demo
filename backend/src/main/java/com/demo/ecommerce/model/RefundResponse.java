package com.demo.ecommerce.model;

public class RefundResponse {
    private boolean success;
    private String refundId;
    private double refundAmount;
    private String orderId;
    private String message;
    private String errorCategory;
    private boolean retryable;

    public RefundResponse(boolean success, String refundId, double refundAmount,
                          String orderId, String message, String errorCategory, boolean retryable) {
        this.success = success;
        this.refundId = refundId;
        this.refundAmount = refundAmount;
        this.orderId = orderId;
        this.message = message;
        this.errorCategory = errorCategory;
        this.retryable = retryable;
    }

    public static RefundResponse ok(String refundId, double amount, String orderId) {
        return new RefundResponse(true, refundId, amount, orderId,
            "Refund of $" + String.format("%.2f", amount) + " processed successfully.", null, false);
    }

    public static RefundResponse error(String message, String errorCategory, boolean retryable) {
        return new RefundResponse(false, null, 0, null, message, errorCategory, retryable);
    }

    public boolean isSuccess() { return success; }
    public String getRefundId() { return refundId; }
    public double getRefundAmount() { return refundAmount; }
    public String getOrderId() { return orderId; }
    public String getMessage() { return message; }
    public String getErrorCategory() { return errorCategory; }
    public boolean isRetryable() { return retryable; }
}
