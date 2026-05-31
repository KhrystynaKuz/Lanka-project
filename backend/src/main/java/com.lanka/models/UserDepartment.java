package com.lanka.models;

import java.util.UUID;

public class UserDepartment {
    private UUID user_id;
    private UUID department_id;

    public UserDepartment() {}

    public UserDepartment(UUID user_id, UUID department_id) {
        this.user_id = user_id;
        this.department_id = department_id;
    }

    public UUID getUser_id() {
        return user_id;
    }

    public void setUser_id(UUID user_id) {
        this.user_id = user_id;
    }

    public UUID getDepartment_id() {
        return department_id;
    }

    public void setDepartment_id(UUID department_id) {
        this.department_id = department_id;
    }
}