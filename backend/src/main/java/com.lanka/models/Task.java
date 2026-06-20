package com.lanka.models;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Модель завдання, що походить від запиту на допомогу.
 * Завдання — це атомарна одиниця роботи, яку виконує волонтер.
 */
public class Task {
    public enum TaskStatus {
        /**
         * Статуси виконання завдання.
         */
        ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
    }

    private UUID id;
    private UUID request_id;
    private UUID department_id;
    private UUID assigned_volunteer_id;
    private UUID coordinator_id;
    private String title;
    private String description;
    private TaskStatus status;
    private OffsetDateTime created_at;
    private OffsetDateTime completed_at;
    private String requestTitle;
    private String reportUrls;

    public Task() {}

    public Task(UUID id, UUID request_id, UUID department_id, UUID assigned_volunteer_id, UUID coordinator_id, String title, String description, TaskStatus status, OffsetDateTime created_at, OffsetDateTime completed_at) {
        this.id = id;
        this.request_id = request_id;
        this.department_id = department_id;
        this.assigned_volunteer_id = assigned_volunteer_id;
        this.coordinator_id = coordinator_id;
        this.title = title;
        this.description = description;
        this.status = status;
        this.created_at = created_at;
        this.completed_at = completed_at;
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

    public UUID getDepartment_id() {
        return department_id;
    }

    public void setDepartment_id(UUID department_id) {
        this.department_id = department_id;
    }

    public UUID getAssigned_volunteer_id() {
        return assigned_volunteer_id;
    }

    public void setAssigned_volunteer_id(UUID assigned_volunteer_id) {
        this.assigned_volunteer_id = assigned_volunteer_id;
    }

    public UUID getCoordinator_id() {
        return coordinator_id;
    }

    public void setCoordinator_id(UUID coordinator_id) {
        this.coordinator_id = coordinator_id;
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

    public TaskStatus getStatus() {
        return status;
    }

    public void setStatus(TaskStatus status) {
        this.status = status;
    }

    public OffsetDateTime getCreated_at() {
        return created_at;
    }

    public void setCreated_at(OffsetDateTime created_at) {
        this.created_at = created_at;
    }

    public OffsetDateTime getCompleted_at() {
        return completed_at;
    }

    public void setCompleted_at(OffsetDateTime completed_at) {
        this.completed_at = completed_at;
    }
    public String getRequestTitle() { return requestTitle; }
    public void setRequestTitle(String requestTitle) { this.requestTitle = requestTitle; }

    public String getReportUrls() {
        return reportUrls;
    }
    public void setReportUrls(String reportUrls) {
        this.reportUrls = reportUrls;
    }
}