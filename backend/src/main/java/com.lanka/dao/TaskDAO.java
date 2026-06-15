package com.lanka.dao;

import com.lanka.database.DatabaseConfig;
import com.lanka.models.Task;
import com.lanka.models.Task.TaskStatus;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Repository
public class TaskDAO {

    public void addTask(Task task) throws SQLException {
        String sql = "INSERT INTO tasks (id, request_id, department_id, assigned_volunteer_id, coordinator_id, title, description, status, created_at, completed_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?::task_status, ?, ?)";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            if (task.getId() == null) task.setId(UUID.randomUUID());
            if (task.getCreated_at() == null) task.setCreated_at(OffsetDateTime.now());
            if (task.getStatus() == null) task.setStatus(TaskStatus.ASSIGNED);

            ps.setObject(1, task.getId());
            ps.setObject(2, task.getRequest_id());
            ps.setObject(3, task.getDepartment_id());
            ps.setObject(4, task.getAssigned_volunteer_id());
            ps.setObject(5, task.getCoordinator_id());
            ps.setString(6, task.getTitle());
            ps.setString(7, task.getDescription());
            ps.setString(8, task.getStatus().name());
            ps.setObject(9, task.getCreated_at());
            ps.setObject(10, task.getCompleted_at());

            ps.executeUpdate();
        }
    }

    public void updateTask(Task task) throws SQLException {
        String sql = "UPDATE tasks SET request_id = ?, department_id = ?, assigned_volunteer_id = ?, " +
                "coordinator_id = ?, title = ?, description = ?, status = ?::task_status, completed_at = ? " +
                "WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, task.getRequest_id());
            ps.setObject(2, task.getDepartment_id());
            ps.setObject(3, task.getAssigned_volunteer_id());
            ps.setObject(4, task.getCoordinator_id());
            ps.setString(5, task.getTitle());
            ps.setString(6, task.getDescription());
            ps.setString(7, task.getStatus().name());
            ps.setObject(8, task.getCompleted_at());
            ps.setObject(9, task.getId());

            ps.executeUpdate();
        }
    }

    public void deleteTask(UUID id) throws SQLException {
        String sql = "DELETE FROM tasks WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, id);
            ps.executeUpdate();
        }
    }

    public List<Task> getAllTasks() throws SQLException {
        String sql = "SELECT t.*, r.title as request_title FROM tasks t LEFT JOIN requests r ON t.request_id = r.id ORDER BY t.created_at DESC";
        List<Task> list = new ArrayList<>();

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) list.add(mapRowToTask(rs));
        }
        return list;
    }

    public Task getTaskById(UUID id) throws SQLException {
        String sql = "SELECT t.*, r.title as request_title FROM tasks t LEFT JOIN requests r ON t.request_id = r.id WHERE t.id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRowToTask(rs);
            }
        }
        return null;
    }

    public List<Task> getTasksByRequestId(UUID requestId) throws SQLException {
        String sql = "SELECT t.*, r.title as request_title FROM tasks t LEFT JOIN requests r ON t.request_id = r.id WHERE t.request_id = ? ORDER BY t.created_at ASC";
        List<Task> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, requestId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapRowToTask(rs));
            }
        }
        return list;
    }

    public List<Task> getTasksByVolunteerId(UUID volunteerId) throws SQLException {
        String sql = "SELECT t.*, r.title as request_title FROM tasks t LEFT JOIN requests r ON t.request_id = r.id WHERE t.assigned_volunteer_id = ? ORDER BY t.status ASC, t.created_at DESC";
        List<Task> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, volunteerId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapRowToTask(rs));
            }
        }
        return list;
    }

    public List<Task> getTasksByCoordinatorId(UUID coordinatorId) throws SQLException {
        String sql = "SELECT t.*, r.title as request_title FROM tasks t LEFT JOIN requests r ON t.request_id = r.id WHERE t.coordinator_id = ? ORDER BY t.created_at DESC";
        List<Task> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, coordinatorId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapRowToTask(rs));
            }
        }
        return list;
    }

    public List<Task> getTasksByVolunteerAndStatus(UUID volunteerId, TaskStatus status) throws SQLException {
        String sql = "SELECT t.*, r.title as request_title FROM tasks t LEFT JOIN requests r ON t.request_id = r.id WHERE t.assigned_volunteer_id = ? AND t.status = ?::task_status ORDER BY t.created_at DESC";
        List<Task> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, volunteerId);
            ps.setString(2, status.name());
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapRowToTask(rs));
            }
        }
        return list;
    }

    // --- NEW METHOD FOR ARCHIVE ---
    public List<Task> getArchivedTasksByVolunteerId(UUID volunteerId) throws SQLException {
        String sql = "SELECT t.*, r.title as request_title FROM tasks t " +
                "LEFT JOIN requests r ON t.request_id = r.id " +
                "WHERE t.assigned_volunteer_id = ? AND t.status::text IN ('COMPLETED', 'CANCELLED') " +
                "ORDER BY t.completed_at DESC";
        List<Task> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, volunteerId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapRowToTask(rs));
            }
        }
        return list;
    }

    public int countCompletedTasks(UUID volunteerId) throws SQLException {
        String sql = "SELECT COUNT(*) FROM tasks WHERE assigned_volunteer_id = ? AND status = 'COMPLETED'";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, volunteerId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1);
            }
        }
        return 0;
    }

    public int countActiveTasks(UUID volunteerId) throws SQLException {
        String sql = "SELECT COUNT(*) FROM tasks WHERE assigned_volunteer_id = ? AND status != 'COMPLETED'";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, volunteerId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1);
            }
        }
        return 0;
    }

    public int countTasksCompletedInLastDays(UUID volunteerId, int days) throws SQLException {
        String sql = "SELECT COUNT(*) FROM tasks WHERE assigned_volunteer_id = ? AND status = 'COMPLETED' AND completed_at >= NOW() - CAST(? AS INTERVAL)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, volunteerId);
            ps.setString(2, days + " days");
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1);
            }
        }
        return 0;
    }

    private Task mapRowToTask(ResultSet rs) throws SQLException {
        Task task = new Task();
        task.setId(rs.getObject("id", UUID.class));
        task.setRequest_id(rs.getObject("request_id", UUID.class));
        task.setDepartment_id(rs.getObject("department_id", UUID.class));
        task.setAssigned_volunteer_id(rs.getObject("assigned_volunteer_id", UUID.class));
        task.setCoordinator_id(rs.getObject("coordinator_id", UUID.class));
        task.setTitle(rs.getString("title"));
        task.setDescription(rs.getString("description"));

        String statusStr = rs.getString("status");
        if (statusStr != null) task.setStatus(TaskStatus.valueOf(statusStr));

        task.setCreated_at(rs.getObject("created_at", OffsetDateTime.class));
        task.setCompleted_at(rs.getObject("completed_at", OffsetDateTime.class));

        // Safely set request title from the LEFT JOIN
        try {
            task.setRequestTitle(rs.getString("request_title"));
        } catch (SQLException e) {
            // Ignored if column isn't present
        }

        return task;
    }
}