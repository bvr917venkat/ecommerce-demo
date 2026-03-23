package com.demo.ecommerce.model;

public class RefundRequest {
    private String reason;
    private String agentId;

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getAgentId() { return agentId; }
    public void setAgentId(String agentId) { this.agentId = agentId; }
}
