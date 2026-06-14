package com.lanka.dao;

import com.lanka.database.DatabaseConfig;
import com.lanka.models.UserDepartment;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class UserDepartmentDAO {

    public void addUserToDepartment(UserDepartment userDepartment) throws SQLException {
        String sql = "INSERT INTO user_departments (user_id, department_id) VALUES (?, ?)";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, userDepartment.getUser_id());
            ps.setObject(2, userDepartment.getDepartment_id());

            ps.executeUpdate();
        }
    }

    public void removeUserFromDepartment(UUID userId, UUID departmentId) throws SQLException {
        String sql = "DELETE FROM user_departments WHERE user_id = ? AND department_id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, userId);
            ps.setObject(2, departmentId);

            ps.executeUpdate();
        }
    }

    public List<UserDepartment> getDepartmentsByUserId(UUID userId) throws SQLException {
        String sql = "SELECT user_id, department_id FROM user_departments WHERE user_id = ?";
        List<UserDepartment> list = new ArrayList<>();

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, userId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRowToUserDepartment(rs));
                }
            }
        }
        return list;
    }

    public List<UserDepartment> getUsersByDepartmentId(UUID departmentId) throws SQLException {
        String sql = "SELECT user_id, department_id FROM user_departments WHERE department_id = ?";
        List<UserDepartment> list = new ArrayList<>();

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, departmentId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRowToUserDepartment(rs));
                }
            }
        }
        return list;
    }

    /**
     * Видаляє всі записи про приналежність користувача до будь-яких відділів.
     * Потрібно для того, щоб гарантувати, що координатор належить лише до одного відділу.
     */
    public void removeAllAssignmentsForUser(UUID userId) throws SQLException {
        String sql = "DELETE FROM user_departments WHERE user_id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, userId);
            ps.executeUpdate();
        }
    }

    public void addUserToDepartment(UUID userId, UUID departmentId) throws SQLException {
        String sql = "INSERT INTO user_departments (user_id, department_id) VALUES (?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, userId);
            ps.setObject(2, departmentId);
            ps.executeUpdate();
        }
    }

    public UUID findCoordinatorByDeptId(UUID departmentId) throws SQLException {
        String sql = "SELECT u.id " +
                "FROM users u " +
                "JOIN user_departments ud ON u.id = ud.user_id " +
                "WHERE ud.department_id = ? AND u.role = 'COORDINATOR'";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, departmentId);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getObject("id", UUID.class);
                }
            }
        }
        return null;
    }

    private UserDepartment mapRowToUserDepartment(ResultSet rs) throws SQLException {
        UserDepartment ud = new UserDepartment();
        ud.setUser_id(rs.getObject("user_id", UUID.class));
        ud.setDepartment_id(rs.getObject("department_id", UUID.class));
        return ud;
    }

    public List<UUID> getCoordinatorsByDepartment(UUID departmentId) throws SQLException {
        String sql = "SELECT u.id FROM users u " +
                "JOIN user_departments ud ON ud.user_id = u.id " +
                "WHERE ud.department_id = ? AND u.role = 'COORDINATOR'";
        List<UUID> coordinatorIds = new ArrayList<>();

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, departmentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    coordinatorIds.add(rs.getObject("id", UUID.class));
                }
            }
        }
        return coordinatorIds;
    }
}