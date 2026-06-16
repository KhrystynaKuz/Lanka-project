package com.lanka.models;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO окремого елемента звіту.
 */
public class ReportItemDTO {
    private String name;
    private int qty;
    private BigDecimal price;
    private BigDecimal transportCost;
    private LocalDate date;

    // Getters
    public String getName() { return name; }
    public int getQty() { return qty; }
    public BigDecimal getPrice() { return price; }
    public BigDecimal getTransportCost() { return transportCost; }
    public LocalDate getDate() { return date; }

    // Setters
    public void setName(String name) { this.name = name; }
    public void setQty(int qty) { this.qty = qty; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public void setTransportCost(BigDecimal transportCost) { this.transportCost = transportCost; }
    public void setDate(LocalDate date) { this.date = date; }
}