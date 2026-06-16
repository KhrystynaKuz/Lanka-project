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

/**
 * Data Access Object for performing CRUD operations and managing relationships
 * related to the Department entity in the database.
 */
@Repository
public class DepartmentDAO {

    /**
     * Adds a new department to the database.
     *
     * @param department The Department object to add.
     * @throws SQLException If a database access error occurs.
     */
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

    /**
     * Updates an existing department's name and description.
     *
     * @param department The Department object containing updated details.
     * @throws SQLException If a database access error occurs.
     */
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

    /**
     * Deletes a department by its ID.
     *
     * @param id The UUID of the department to delete.
     * @throws SQLException If a database access error occurs.
     */
    public void deleteDepartment(UUID id) throws SQLException {
        String sql = "DELETE FROM departments WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, id);
            ps.executeUpdate();
        }
    }

    /**
     * Retrieves all departments from the database, ordered alphabetically by name.
     *
     * @return A list of all Department objects.
     * @throws SQLException If a database access error occurs.
     */
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

    /**
     * Retrieves a specific department by its ID.
     *
     * @param id The UUID of the department.
     * @return The Department object, or null if not found.
     * @throws SQLException If a database access error occurs.
     */
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

    /**
     * Retrieves a list of departments matching a name pattern.
     *
     * @param namePattern The string pattern to search for (case-insensitive).
     * @return A list of matching Department objects.
     * @throws SQLException If a database access error occurs.
     */
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

    /**
     * Assigns a user (volunteer/coordinator) to a specific department.
     *
     * @param userId The UUID of the user.
     * @param deptId The UUID of the department.
     * @throws SQLException If a database access error occurs.
     */
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

    /**
     * Removes all department assignments for a specific user to ensure they belong to only one.
     *
     * @param userId The UUID of the user.
     * @throws SQLException If a database access error occurs.
     */
    // Видалити всі зв'язки користувача з відділами (щоб він був лише в одному)
    public void removeAllAssignmentsForUser(UUID userId) throws SQLException {
        String sql = "DELETE FROM user_departments WHERE user_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, userId);
            ps.executeUpdate();
        }
    }

    /**
     * Finds the coordinator ID for a specific department.
     *
     * @param deptId The UUID of the department.
     * @return The UUID of the coordinator, or null if not found.
     * @throws SQLException If a database access error occurs.
     */
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

    /**
     * Updates the coordinator ID for a specific department.
     *
     * @param deptId The UUID of the department.
     * @param userId The UUID of the new coordinator.
     * @throws SQLException If a database access error occurs.
     */
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

    /**
     * Retrieves the specific department to which a user belongs.
     *
     * @param userId The UUID of the user.
     * @return The Department object, or null if the user has no assignment.
     * @throws SQLException If a database access error occurs.
     */
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

    /**
     * Retrieves all users assigned to a specific department.
     *
     * @param deptId The UUID of the department.
     * @return A list of User objects assigned to the department.
     * @throws SQLException If a database access error occurs.
     */
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

    /**
     * Retrieves a list of volunteers managed by a specific coordinator.
     * Determines the department based on the coordinator's assignment.
     *
     * @param coordinatorId The UUID of the coordinator.
     * @return A list of User objects (VOLUNTEER or COORDINATOR roles) in that department.
     * @throws SQLException If a database access error occurs.
     */
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

    /**
     * Helper method to map a ResultSet row to a Department object.
     */
    private Department mapRowToDepartment(ResultSet rs) throws SQLException {
        return new Department(
                rs.getObject("id", UUID.class),
                rs.getString("name"),
                rs.getString("description")
        );
    }

    /**
     * Helper method to map a ResultSet row to a User object.
     */
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