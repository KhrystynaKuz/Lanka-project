package com.lanka.models;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Модель збору коштів для сайту.
 * Зберігає інформацію про цілі та способи переказу грошей.
 */
public class Fundraiser {
    private UUID id;
    private String title;
    private String description;
    private String link;
    private String qr_code_url;
    private boolean is_hidden;
    private OffsetDateTime created_at;

    public Fundraiser() {}

    public Fundraiser(UUID id, String title, String description, String link, String qr_code_url, boolean is_hidden, OffsetDateTime created_at) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.link = link;
        this.qr_code_url = qr_code_url;
        this.is_hidden = is_hidden;
        this.created_at = created_at;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
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

    public String getLink() {
        return link;
    }

    public void setLink(String link) {
        this.link = link;
    }

    public String getQr_code_url() {
        return qr_code_url;
    }

    public void setQr_code_url(String qr_code_url) {
        this.qr_code_url = qr_code_url;
    }

    public boolean isIs_hidden() {
        return is_hidden;
    }

    public void setIs_hidden(boolean is_hidden) {
        this.is_hidden = is_hidden;
    }

    public OffsetDateTime getCreated_at() {
        return created_at;
    }

    public void setCreated_at(OffsetDateTime created_at) {
        this.created_at = created_at;
    }
}
