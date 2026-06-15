package com.lanka.models;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public class User {
    public enum UserRole {
        CUSTOMER, VOLUNTEER, COORDINATOR, HEAD
    }

    private UUID id;
    private String email;
    private String first_name;
    private String last_name;
    private String patronymic;
    private LocalDate dob;
    private UserRole role;
    private String phone_number;
    private OffsetDateTime created_at;
    private Boolean is_verified;

    public User() {}

    public User(UUID id, String email, String first_name, String last_name, String patronymic, LocalDate dob, UserRole role, String phone_number, OffsetDateTime created_at, boolean is_verified) {
        this.id = id;
        this.email = email;
        this.first_name = first_name;
        this.last_name = last_name;
        this.patronymic = patronymic;
        this.dob = dob;
        this.role = role;
        this.phone_number = phone_number;
        this.created_at = created_at;
        this.is_verified = is_verified;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFirst_name() {
        return first_name;
    }

    public void setFirst_name(String first_name) {
        this.first_name = first_name;
    }

    public String getLast_name() {
        return last_name;
    }

    public void setLast_name(String last_name) {
        this.last_name = last_name;
    }

    public String getPatronymic() {
        return patronymic;
    }

    public void setPatronymic(String patronymic) {
        this.patronymic = patronymic;
    }

    public LocalDate getDob() {
        return dob;
    }

    public void setDob(LocalDate dob) {
        this.dob = dob;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public String getPhone_number() {
        return phone_number;
    }

    public void setPhone_number(String phone_number) {
        this.phone_number = phone_number;
    }

    public OffsetDateTime getCreated_at() {
        return created_at;
    }

    public void setCreated_at(OffsetDateTime created_at) {
        this.created_at = created_at;
    }

    public Boolean isIs_verified() {
        return is_verified;
    }

    public void setIs_verified(Boolean is_verified) {
        this.is_verified = is_verified;
    }
}