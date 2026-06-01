package com.lanka.dao;

import com.lanka.database.DatabaseConfig;
import com.lanka.models.User;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public class UserDAO {

    public void createUser(User user) {
        String sql = "INSERT INTO users (id, email, first_name, last_name, patronymic, dob, role, phone_number, created_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?::user_role, ?, ?)";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            if (user.getId() == null) {
                user.setId(UUID.randomUUID());
            }

            stmt.setObject(1, user.getId());
            stmt.setString(2, user.getEmail());
            stmt.setString(3, user.getFirst_name());
            stmt.setString(4, user.getLast_name());
            stmt.setString(5, user.getPatronymic());
            stmt.setDate(6, user.getDob() != null ? Date.valueOf(user.getDob()) : null);
            stmt.setString(7, user.getRole().name()); // Передасть "HEAD", "VOLUNTEER" або "CUSTOMER"
            stmt.setString(8, user.getPhone_number());
            stmt.setObject(9, user.getCreated_at()); // Тепер індекс правильний (9 замість 11)

            stmt.executeUpdate();
            System.out.println("Користувача успішно зареєстровано: " + user.getEmail());

        } catch (SQLException e) {
            throw new RuntimeException("Помилка при збереженні користувача", e);
        }
    }

    public Optional<User> findById(UUID id) {
        String sql = "SELECT * FROM users WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setObject(1, id);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRowToUser(rs));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Помилка при пошуку користувача за ID", e);
        }
        return Optional.empty();
    }

    public Optional<User> findByEmail(String email) {
        String sql = "SELECT * FROM users WHERE email = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, email);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRowToUser(rs));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Помилка при пошуку користувача за email", e);
        }
        return Optional.empty();
    }

    public List<User> findUnverifiedUsers() {
        String sql = "SELECT * FROM users WHERE is_verified = false AND document_url IS NOT NULL ORDER BY created_at ASC";
        List<User> unverifiedUsers = new ArrayList<>();

        try (Connection conn = DatabaseConfig.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                unverifiedUsers.add(mapRowToUser(rs));
            }

        } catch (SQLException e) {
            throw new RuntimeException("Помилка при отриманні списку неверифікованих користувачів", e);
        }
        return unverifiedUsers;
    }

    public void updateVerificationStatus(UUID id, boolean isVerified) {
        String sql = "UPDATE users SET is_verified = ? WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setBoolean(1, isVerified);
            stmt.setObject(2, id);

            stmt.executeUpdate();
            System.out.println("Статус верифікації користувача " + id + " змінено на: " + isVerified);

        } catch (SQLException e) {
            throw new RuntimeException("Помилка при оновленні статусу верифікації", e);
        }
    }

    public void updateUser(User user) {
        String sql = "UPDATE users SET first_name = ?, last_name = ?, patronymic = ?, phone_number = ? WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, user.getFirst_name());
            stmt.setString(2, user.getLast_name());
            stmt.setString(3, user.getPatronymic());
            stmt.setString(4, user.getPhone_number());
            stmt.setObject(5, user.getId());

            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Помилка при оновленні профілю користувача", e);
        }
    }

    public void deleteUser(UUID id) {
        String sql = "DELETE FROM users WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setObject(1, id);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Помилка при видаленні користувача", e);
        }
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
            user.setRole(User.UserRole.valueOf(roleStr.toUpperCase().trim()));
        }

        user.setPhone_number(rs.getString("phone_number"));
        user.setCreated_at(rs.getObject("created_at", java.time.OffsetDateTime.class));

        return user;
    }
}