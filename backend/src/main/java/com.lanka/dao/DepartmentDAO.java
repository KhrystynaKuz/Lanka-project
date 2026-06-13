package com.lanka.dao;

import com.lanka.database.DatabaseConfig;
import com.lanka.models.Department;
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
                Department department = new Department(
                        rs.getObject("id", UUID.class),
                        rs.getString("name"),
                        rs.getString("description")
                );
                list.add(department);
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
                    return new Department(
                            rs.getObject("id", UUID.class),
                            rs.getString("name"),
                            rs.getString("description")
                    );
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
                    Department department = new Department(
                            rs.getObject("id", UUID.class),
                            rs.getString("name"),
                            rs.getString("description")
                    );
                    list.add(department);
                }
            }
        }
        return list;
    }

    // Призначити волонтера до відділу
    public void assignUserToDepartment(UUID userId, UUID deptId) throws SQLException {
        String sql = "INSERT INTO user_department (user_id, department_id) VALUES (?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, userId);
            ps.setObject(2, deptId);
            ps.executeUpdate();
        }
    }

    // Видалити всі зв'язки користувача з відділами (щоб він був лише в одному)
    public void removeAllAssignmentsForUser(UUID userId) throws SQLException {
        String sql = "DELETE FROM user_department WHERE user_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, userId);
            ps.executeUpdate();
        }
    }

    // Знайти координатора конкретного відділу (якщо у вас є поле coordinator_id у таблиці departments)
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
}