package com.lanka.models;

import java.time.OffsetDateTime;
import java.util.UUID;

public class Request {
    public enum RequestStatus {
        PENDING, APPROVED, REJECTED, IN_PROGRESS, COMPLETED
    }

    private UUID id;
    private UUID customer_id;
    private String title;
    private String description;
    private RequestStatus status;
    private int priority;
    private OffsetDateTime created_at;
    private OffsetDateTime updated_at;
    private UUID manager_id;

    public Request() {}

    public Request(UUID id, UUID customer_id, String title, String description, RequestStatus status, int priority, OffsetDateTime created_at, OffsetDateTime updated_at, UUID manager_id) {
        this.id = id;
        this.customer_id = customer_id;
        this.title = title;
        this.description = description;
        this.status = status;
        this.priority = priority;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.manager_id = manager_id;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getCustomer_id() {
        return customer_id;
    }

    public void setCustomer_id(UUID customer_id) {
        this.customer_id = customer_id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public RequestStatus getStatus() {
        return status;
    }

    public void setStatus(RequestStatus status) {
        this.status = status;
    }

    public int getPriority() {
        return priority;
    }

    public void setPriority(int priority) {
        this.priority = priority;
    }

    public OffsetDateTime getCreated_at() {
        return created_at;
    }

    public void setCreated_at(OffsetDateTime created_at) {
        this.created_at = created_at;
    }

    public OffsetDateTime getUpdated_at() {
        return updated_at;
    }

    public void setUpdated_at(OffsetDateTime updated_at) {
        this.updated_at = updated_at;
    }

    public UUID getManager_id() {
        return manager_id;
    }

    public void setManager_id(UUID manager_id) {
        this.manager_id = manager_id;
    }

}