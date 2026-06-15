package com.lanka.dao;

import com.lanka.database.DatabaseConfig;
import com.lanka.models.Department;
import com.lanka.models.User;
import com.lanka.models.User.UserRole;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Repository
public class DepartmentDAO {

    public void addDepartment(Department department) throws SQLException {
        String sql = "INSERT INTO departments (id, name, description) VALUES (?, ?, ?)";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            if (department.getId() == null) {
                department.setId(UUID.randomUUID());
            }

            ps.setObject(1, department.getId());
            ps.setString(2, department.getName());
            ps.setString(3, department.getDescription());

            ps.executeUpdate();
        }
    }

    public void updateDepartment(Department department) throws SQLException {
        String sql = "UPDATE departments SET name = ?, description = ? WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, department.getName());
            ps.setString(2, department.getDescription());
            ps.setObject(3, department.getId());

            ps.executeUpdate();
        }
    }

    public void deleteDepartment(UUID id) throws SQLException {
        String sql = "DELETE FROM departments WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, id);
            ps.executeUpdate();
        }
    }

    public List<Department> getAllDepartments() throws SQLException {
        String sql = "SELECT id, name, description FROM departments ORDER BY name ASC";
        List<Department> list = new ArrayList<>();

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                list.add(mapRowToDepartment(rs));
            }
        }
        return list;
    }

    public Department getDepartmentById(UUID id) throws SQLException {
        String sql = "SELECT id, name, description FROM departments WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRowToDepartment(rs);
                }
            }
        }
        return null;
    }

    public List<Department> getDepartmentsByName(String namePattern) throws SQLException {
        String sql = "SELECT id, name, description FROM departments WHERE name ILIKE ? ORDER BY name ASC";
        List<Department> list = new ArrayList<>();

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, namePattern + "%");

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRowToDepartment(rs));
                }
            }
        }
        return list;
    }

    // --- RELATIONSHIP MANAGEMENT ---

    // Призначити волонтера до відділу
    public void assignUserToDepartment(UUID userId, UUID deptId) throws SQLException {
        String sql = "INSERT INTO user_departments(user_id, department_id) VALUES (?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, userId);
            ps.setObject(2, deptId);
            ps.executeUpdate();
        }
    }

    // Видалити всі зв'язки користувача з відділами (щоб він був лише в одному)
    public void removeAllAssignmentsForUser(UUID userId) throws SQLException {
        String sql = "DELETE FROM user_departmentsWHERE user_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, userId);
            ps.executeUpdate();
        }
    }

    // Знайти координатора конкретного відділу
    public UUID findCoordinatorByDeptId(UUID deptId) throws SQLException {
        String sql = "SELECT coordinator_id FROM departments WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, deptId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getObject("coordinator_id", UUID.class);
                }
            }
        }
        return null;
    }

    // Оновити координатора для відділу
    public void setCoordinatorForDepartment(UUID deptId, UUID userId) throws SQLException {
        String sql = "UPDATE departments SET coordinator_id = ? WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, userId);
            ps.setObject(2, deptId);
            ps.executeUpdate();
        }
    }

    // --- NEW / IMPROVED METHODS ---

    // Отримати відділ, до якого належить конкретний користувач
    public Department getDepartmentByUserId(UUID userId) throws SQLException {
        // ДОДАНО ПРОБІЛ між user_departments та ud
        String sql = "SELECT d.id, d.name, d.description FROM departments d " +
                "JOIN user_departments ud ON d.id = ud.department_id " +
                "WHERE ud.user_id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRowToDepartment(rs);
                }
            }
        }
        return null;
    }

    // Отримати всіх користувачів конкретного відділу
    public List<User> getUsersByDepartmentId(UUID deptId) throws SQLException {
        // ДОДАНО ПРОБІЛ між user_departments та ud
        String sql = "SELECT u.id, u.email, u.first_name, u.last_name, u.patronymic, u.dob, u.role::text, u.phone_number, u.created_at, u.is_verified " +
                "FROM users u " +
                "JOIN user_departments ud ON u.id = ud.user_id " +
                "WHERE ud.department_id = ?";

        List<User> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, deptId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRowToUser(rs));
                }
            }
        }
        return list;
    }

    // Повністю заповнений мапінг для волонтерів по координатору
    public List<User> getVolunteersByCoordinatorId(UUID coordinatorId) throws SQLException {
        // Змінено SELECT, щоб отримати всі колонки для mapRowToUser
        String sql = "SELECT u.id, u.email, u.first_name, u.last_name, u.patronymic, u.dob, u.role::text, u.phone_number, u.created_at, u.is_verified " +
                "FROM users u " +
                "JOIN user_departments ud ON u.id = ud.user_id " +
                "WHERE ud.department_id = ( " +
                "    SELECT department_id " +
                "    FROM user_departments " +
                "    WHERE user_id = ? " +
                "    LIMIT 1 " +
                ") " +
                "AND u.role IN ('VOLUNTEER', 'COORDINATOR')";

        List<User> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, coordinatorId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRowToUser(rs));
                }
            }
        }
        return list;
    }

    // --- HELPER MAPPERS ---

    private Department mapRowToDepartment(ResultSet rs) throws SQLException {
        return new Department(
                rs.getObject("id", UUID.class),
                rs.getString("name"),
                rs.getString("description")
        );
    }

    private User mapRowToUser(ResultSet rs) throws SQLException {
        User user = new User();
        user.setId(rs.getObject("id", UUID.class));
        user.setEmail(rs.getString("email"));
        user.setFirst_name(rs.getString("first_name"));
        user.setLast_name(rs.getString("last_name"));
        user.setPatronymic(rs.getString("patronymic"));

        Boolean isVerified = rs.getObject("is_verified", Boolean.class);
        user.setIs_verified(isVerified);

        Date dobDate = rs.getDate("dob");
        if (dobDate != null) user.setDob(dobDate.toLocalDate());

        String roleStr = rs.getString("role");
        if (roleStr != null) user.setRole(UserRole.valueOf(roleStr.toUpperCase().trim()));

        user.setPhone_number(rs.getString("phone_number"));
        user.setCreated_at(rs.getObject("created_at", java.time.OffsetDateTime.class));

        return user;
    }
}