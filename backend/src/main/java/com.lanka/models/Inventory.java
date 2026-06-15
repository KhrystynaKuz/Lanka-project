package com.lanka.models;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public class Inventory {
    private UUID id;
    private String item_name;
    private int quantity;
    private String unit_of_measure;
    private BigDecimal unit_price;
    private UUID last_updated_by;
    private OffsetDateTime updated_at;

    public Inventory() {}

    public Inventory(UUID id, String item_name, int quantity, String unit_of_measure, BigDecimal unit_price, UUID last_updated_by, OffsetDateTime updated_at) {
        this.id = id;
        this.item_name = item_name;
        this.quantity = quantity;
        this.unit_of_measure = unit_of_measure;
        this.unit_price = unit_price;
        this.last_updated_by = last_updated_by;
        this.updated_at = updated_at;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getItem_name() { return item_name; }
    public void setItem_name(String item_name) { this.item_name = item_name; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public String getUnit_of_measure() { return unit_of_measure; }
    public void setUnit_of_measure(String unit_of_measure) { this.unit_of_measure = unit_of_measure; }

    public BigDecimal getUnit_price() { return unit_price; }
    public void setUnit_price(BigDecimal unit_price) { this.unit_price = unit_price; }

    public UUID getLast_updated_by() { return last_updated_by; }
    public void setLast_updated_by(UUID last_updated_by) { this.last_updated_by = last_updated_by; }

    public OffsetDateTime getUpdated_at() { return updated_at; }
    public void setUpdated_at(OffsetDateTime updated_at) { this.updated_at = updated_at; }
}