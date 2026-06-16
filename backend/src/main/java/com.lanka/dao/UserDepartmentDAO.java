package com.lanka.dao;

import com.lanka.database.DatabaseConfig;
import com.lanka.models.UserDepartment;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Data Access Object for handling the many-to-many junction between users and departments.
 */
public class UserDepartmentDAO {

    /**
     * Links a user to a specific department.
     *
     * @param userDepartment The UserDepartment junction object.
     * @throws SQLException If a database access error occurs.
     */
    public void addUserToDepartment(UserDepartment userDepartment) throws SQLException {
        String sql = "INSERT INTO user_departments (user_id, department_id) VALUES (?, ?)";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, userDepartment.getUser_id());
            ps.setObject(2, userDepartment.getDepartment_id());

            ps.executeUpdate();
        }
    }

    /**
     * Severs the link between a user and a specific department.
     *
     * @param userId       The UUID of the user.
     * @param departmentId The UUID of the department.
     * @throws SQLException If a database access error occurs.
     */
    public void removeUserFromDepartment(UUID userId, UUID departmentId) throws SQLException {
        String sql = "DELETE FROM user_departments WHERE user_id = ? AND department_id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, userId);
            ps.setObject(2, departmentId);

            ps.executeUpdate();
        }
    }

    /**
     * Retrieves all departments a specific user is linked to.
     *
     * @param userId The UUID of the user.
     * @return A list of UserDepartment junction objects.
     * @throws SQLException If a database access error occurs.
     */
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

    /**
     * Retrieves all users linked to a specific department.
     *
     * @param departmentId The UUID of the department.
     * @return A list of UserDepartment junction objects.
     * @throws SQLException If a database access error occurs.
     */
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
     *
     * @param userId The UUID of the user.
     * @throws SQLException If a database access error occurs.
     */
    public void removeAllAssignmentsForUser(UUID userId) throws SQLException {
        String sql = "DELETE FROM user_departments WHERE user_id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, userId);
            ps.executeUpdate();
        }
    }

    /**
     * Overloaded method to link a user to a specific department using primitives/UUIDs.
     *
     * @param userId       The UUID of the user.
     * @param departmentId The UUID of the department.
     * @throws SQLException If a database access error occurs.
     */
    public void addUserToDepartment(UUID userId, UUID departmentId) throws SQLException {
        String sql = "INSERT INTO user_departments (user_id, department_id) VALUES (?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, userId);
            ps.setObject(2, departmentId);
            ps.executeUpdate();
        }
    }

    /**
     * Finds the ID of a coordinator within a specific department junction.
     *
     * @param departmentId The UUID of the department.
     * @return The UUID of the coordinator, or null if not found.
     * @throws SQLException If a database access error occurs.
     */
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

    /**
     * Helper method to map a ResultSet to a UserDepartment junction object.
     */
    private UserDepartment mapRowToUserDepartment(ResultSet rs) throws SQLException {
        UserDepartment ud = new UserDepartment();
        ud.setUser_id(rs.getObject("user_id", UUID.class));
        ud.setDepartment_id(rs.getObject("department_id", UUID.class));
        return ud;
    }

    /**
     * Returns a list of all coordinator IDs assigned to a given department.
     *
     * @param departmentId The UUID of the department.
     * @return A list of coordinator UUIDs.
     * @throws SQLException If a database access error occurs.
     */
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