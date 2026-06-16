package com.lanka.models;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Звіт волонтера про виконану роботу або використання ресурсів.
 */
public class Report {
    private UUID id;
    private UUID task_id;
    private UUID author_id;
    private String content;
    private String[] attached_files_urls;
    private OffsetDateTime created_at;

    public Report() {}

    public Report(UUID id, UUID task_id, UUID author_id, String content, String[] attached_files_urls, OffsetDateTime created_at) {
        this.id = id;
        this.task_id = task_id;
        this.author_id = author_id;
        this.content = content;
        this.attached_files_urls = attached_files_urls;
        this.created_at = created_at;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getTask_id() {
        return task_id;
    }

    public void setTask_id(UUID task_id) {
        this.task_id = task_id;
    }

    public UUID getAuthor_id() {
        return author_id;
    }

    public void setAuthor_id(UUID author_id) {
        this.author_id = author_id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String[] getAttached_files_urls() {
        return attached_files_urls;
    }

    public void setAttached_files_urls(String[] attached_files_urls) {
        this.attached_files_urls = attached_files_urls;
    }

    public OffsetDateTime getCreated_at() {
        return created_at;
    }

    public void setCreated_at(OffsetDateTime created_at) {
        this.created_at = created_at;
    }
}