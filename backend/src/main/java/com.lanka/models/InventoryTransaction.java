package com.lanka.models;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public class InventoryTransaction {
    private UUID id;
    private UUID inventory_id;
    private UUID request_id;
    private UUID user_id;
    private String user_full_name;
    private int quantity_changed;
    private OffsetDateTime transaction_date;
    private String type;
    private BigDecimal transportation_cost;

    public InventoryTransaction() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getInventory_id() { return inventory_id; }
    public void setInventory_id(UUID inventory_id) { this.inventory_id = inventory_id; }

    public UUID getRequest_id() { return request_id; }
    public void setRequest_id(UUID request_id) { this.request_id = request_id; }

    public UUID getUser_id() { return user_id; }
    public void setUser_id(UUID user_id) { this.user_id = user_id; }

    public String getUser_full_name() { return user_full_name; }
    public void setUser_full_name(String user_full_name) { this.user_full_name = user_full_name; }

    public int getQuantity_changed() { return quantity_changed; }
    public void setQuantity_changed(int quantity_changed) { this.quantity_changed = quantity_changed; }

    public OffsetDateTime getTransaction_date() { return transaction_date; }
    public void setTransaction_date(OffsetDateTime transaction_date) { this.transaction_date = transaction_date; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public BigDecimal getTransportation_cost() { return transportation_cost; }
    public void setTransportation_cost(BigDecimal transportation_cost) { this.transportation_cost = transportation_cost; }
}