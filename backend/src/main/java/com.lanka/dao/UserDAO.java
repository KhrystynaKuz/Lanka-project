package com.lanka.dao;

import com.lanka.database.DatabaseConfig;
import com.lanka.models.User;
import com.lanka.models.User.UserRole;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.sql.Date;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class UserDAO {

    public void addUser(User user) throws SQLException {
        String sql = "INSERT INTO users (id, email, first_name, last_name, patronymic, dob, role, phone_number, created_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?::user_role, ?, ?)";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            if (user.getId() == null) {
                user.setId(UUID.randomUUID());
            }
            if (user.getCreated_at() == null) {
                user.setCreated_at(java.time.OffsetDateTime.now());
            }

            ps.setObject(1, user.getId());
            ps.setString(2, user.getEmail());
            ps.setString(3, user.getFirst_name());
            ps.setString(4, user.getLast_name());
            ps.setString(5, user.getPatronymic());
            ps.setDate(6, user.getDob() != null ? Date.valueOf(user.getDob()) : null);
            ps.setString(7, user.getRole().name());
            ps.setString(8, user.getPhone_number());
            ps.setObject(9, user.getCreated_at());

            ps.executeUpdate();
        }
    }

    public Optional<User> findById(UUID id) throws SQLException {
        String sql = "SELECT id, email, first_name, last_name, patronymic, dob, role::text, phone_number, created_at FROM users WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, id);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRowToUser(rs));
                }
            }
        }
        return Optional.empty();
    }

    public List<User> getUnverifiedUsers() throws SQLException {
        String sql = "SELECT id, email, first_name, last_name, patronymic, dob, role::text, phone_number, created_at " +
                "FROM users WHERE is_verified = false AND document_url IS NOT NULL ORDER BY created_at ASC";
        List<User> list = new ArrayList<>();

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                list.add(mapRowToUser(rs));
            }
        }
        return list;
    }

    public void updateVerificationStatus(UUID id, boolean isVerified) throws SQLException {
        String sql = "UPDATE users SET is_verified = ? WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setBoolean(1, isVerified);
            ps.setObject(2, id);

            ps.executeUpdate();
        }
    }

    public boolean updateUser(User user) throws SQLException {
        String sql = "UPDATE users SET first_name = ?, last_name = ?, patronymic = ?, phone_number = ?, dob = ? WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, user.getFirst_name());
            ps.setString(2, user.getLast_name());
            ps.setString(3, user.getPatronymic());
            ps.setString(4, user.getPhone_number());

            if (user.getDob() != null) {
                ps.setDate(5, Date.valueOf(user.getDob()));
            } else {
                ps.setNull(5, Types.DATE);
            }

            ps.setObject(6, user.getId());

            int rowsAffected = ps.executeUpdate();
            return rowsAffected > 0;
        }
    }

    public void updateRole(UUID userId, User.UserRole newRole) throws SQLException {
        String sql = "UPDATE users SET role = ?::user_role WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, newRole.name());
            ps.setObject(2, userId);
            ps.executeUpdate();
        }
    }

    public void updateUserRole(UUID userId, String newRole) throws SQLException {
        String sql = "UPDATE users SET role = ?::user_role WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, newRole);
            ps.setObject(2, userId);
            ps.executeUpdate();
        }
    }
    public boolean updateUserDetails(UUID userId, String phoneNumber, String patronymic, java.time.LocalDate dob) throws SQLException {
        String sql = "UPDATE users SET phone_number = ?, patronymic = ?, dob = ? WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, phoneNumber);
            ps.setString(2, patronymic);

            if (dob != null) {
                ps.setDate(3, Date.valueOf(dob));
            } else {
                ps.setNull(3, Types.DATE);
            }

            ps.setObject(4, userId);

            int rowsAffected = ps.executeUpdate();
            return rowsAffected > 0;
        }
    }

    public void deleteUser(UUID id) throws SQLException {
        String sql = "DELETE FROM users WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, id);
            ps.executeUpdate();
        }
    }

    public List<User> getUsersByRoleAndDepartment(User.UserRole role, UUID departmentId) throws SQLException {
        String sql = "SELECT u.id, u.email, u.first_name, u.last_name, u.patronymic, u.dob, u.role::text, u.phone_number, u.created_at " +
                "FROM users u " +
                "JOIN user_departments ud ON u.id = ud.user_id " +
                "WHERE u.role = ?::user_role AND ud.department_id = ? " +
                "ORDER BY u.last_name ASC, u.first_name ASC";

        List<User> list = new ArrayList<>();

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, role.name());
            ps.setObject(2, departmentId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRowToUser(rs));
                }
            }
        }
        return list;
    }

    public List<User> getAllActiveUsers() throws SQLException {
        String sql = "SELECT id, email, first_name, last_name, patronymic, dob, role::text, phone_number, created_at " +
                "FROM users WHERE is_verified = true ORDER BY last_name ASC";
        List<User> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(mapRowToUser(rs));
            }
        }
        return list;
    }

    public List<User> getVolunteersAndCoordinators() throws SQLException {
        String sql = "SELECT id, email, first_name, last_name, patronymic, dob, role::text, phone_number, created_at " +
                "FROM users WHERE UPPER(role::text) IN ('VOLUNTEER', 'COORDINATOR') ORDER BY last_name ASC";

        List<User> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                list.add(mapRowToUser(rs));
            }
        }
        return list;
    }

    public UUID getCoordinatorIdByDepartmentId(UUID deptId) throws SQLException {
        String sql = "SELECT u.id FROM users u " +
                "JOIN user_departments ud ON u.id = ud.user_id " +
                "WHERE ud.department_id = ? AND u.role = 'COORDINATOR'";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, deptId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getObject("id", UUID.class);
                }
            }
        }
        return null;
    }

    public List<User> getCustomers() throws SQLException {
        String sql = "SELECT id, email, first_name, last_name, patronymic, dob, role::text, phone_number, created_at " +
                "FROM users WHERE role = 'CUSTOMER'::user_role ORDER BY last_name ASC";

        List<User> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                list.add(mapRowToUser(rs));
            }
        }
        return list;
    }

    private User mapRowToUser(ResultSet rs) throws SQLException {
        User user = new User();
        user.setId(rs.getObject("id", UUID.class));
        user.setEmail(rs.getString("email"));
        user.setFirst_name(rs.getString("first_name"));
        user.setLast_name(rs.getString("last_name"));
        user.setPatronymic(rs.getString("patronymic"));

        Date dobDate = rs.getDate("dob");
        if (dobDate != null) {
            user.setDob(dobDate.toLocalDate());
        }

        String roleStr = rs.getString("role");
        if (roleStr != null) {
            user.setRole(UserRole.valueOf(roleStr.toUpperCase().trim()));
        }

        user.setPhone_number(rs.getString("phone_number"));
        user.setCreated_at(rs.getObject("created_at", java.time.OffsetDateTime.class));

        return user;
    }
}