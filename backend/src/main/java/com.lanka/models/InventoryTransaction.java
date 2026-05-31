package com.lanka.models;

import java.time.OffsetDateTime;
import java.util.UUID;

public class InventoryTransaction {
    private UUID id;
    private UUID inventory_id;
    private UUID request_id;
    private UUID user_id;
    private int quantity_changed;
    private OffsetDateTime transaction_date;

    public InventoryTransaction() {}

    public InventoryTransaction(UUID id, UUID inventory_id, UUID request_id, UUID user_id, int quantity_changed, OffsetDateTime transaction_date) {
        this.id = id;
        this.inventory_id = inventory_id;
        this.request_id = request_id;
        this.user_id = user_id;
        this.quantity_changed = quantity_changed;
        this.transaction_date = transaction_date;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getRequest_id() {
        return request_id;
    }

    public void setRequest_id(UUID request_id) {
        this.request_id = request_id;
    }

    public UUID getInventory_id() {
        return inventory_id;
    }

    public void setInventory_id(UUID inventory_id) {
        this.inventory_id = inventory_id;
    }

    public UUID getUser_id() {
        return user_id;
    }

    public void setUser_id(UUID user_id) {
        this.user_id = user_id;
    }

    public int getQuantity_changed() {
        return quantity_changed;
    }

    public void setQuantity_changed(int quantity_changed) {
        this.quantity_changed = quantity_changed;
    }

    public OffsetDateTime getTransaction_date() {
        return transaction_date;
    }

    public void setTransaction_date(OffsetDateTime transaction_date) {
        this.transaction_date = transaction_date;
    }
}