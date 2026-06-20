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

/**
 * Data Access Object for handling CRUD operations on tasks.
 */
@Repository
public class TaskDAO {

    /**
     * Adds a new task to the database.
     *
     * @param task The Task object to insert.
     * @throws SQLException If a database access error occurs.
     */
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

    /**
     * Updates an existing task.
     *
     * @param task The Task object containing updated data.
     * @throws SQLException If a database access error occurs.
     */
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

    /**
     * Deletes a task by its ID.
     *
     * @param id The UUID of the task.
     * @throws SQLException If a database access error occurs.
     */
    public void deleteTask(UUID id) throws SQLException {
        String sql = "DELETE FROM tasks WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, id);
            ps.executeUpdate();
        }
    }

    /**
     * Retrieves all tasks and attempts to join the parent request title.
     *
     * @return A list of Task objects.
     * @throws SQLException If a database access error occurs.
     */
    public List<Task> getAllTasks() throws SQLException {
        String sql = "SELECT t.*, r.title as request_title, rep.attached_files_urls as report_urls " +
                "FROM tasks t " +
                "LEFT JOIN requests r ON t.request_id = r.id " +
                "LEFT JOIN reports rep ON t.id = rep.task_id " +
                "ORDER BY t.created_at DESC";
        List<Task> list = new ArrayList<>();

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) list.add(mapRowToTask(rs));
        }
        return list;
    }

    /**
     * Retrieves a task by its ID and attempts to join the parent request title.
     *
     * @param id The UUID of the task.
     * @return The Task object, or null if not found.
     * @throws SQLException If a database access error occurs.
     */
    public Task getTaskById(UUID id) throws SQLException {
        String sql = "SELECT t.*, r.title as request_title, rep.attached_files_urls as report_urls " +
                "FROM tasks t " +
                "LEFT JOIN requests r ON t.request_id = r.id " +
                "LEFT JOIN reports rep ON t.id = rep.task_id " +
                "WHERE t.id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRowToTask(rs);
            }
        }
        return null;
    }

    /**
     * Retrieves all tasks belonging to a specific request.
     *
     * @param requestId The UUID of the request.
     * @return A list of Task objects.
     * @throws SQLException If a database access error occurs.
     */
    public List<Task> getTasksByRequestId(UUID requestId) throws SQLException {
        String sql = "SELECT t.*, r.title as request_title, rep.attached_files_urls as report_urls " +
                "FROM tasks t " +
                "LEFT JOIN requests r ON t.request_id = r.id " +
                "LEFT JOIN reports rep ON t.id = rep.task_id " +
                "WHERE t.request_id = ? ORDER BY t.created_at ASC";
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

    /**
     * Retrieves all tasks assigned to a specific volunteer.
     *
     * @param volunteerId The UUID of the volunteer.
     * @return A list of Task objects.
     * @throws SQLException If a database access error occurs.
     */
    public List<Task> getTasksByVolunteerId(UUID volunteerId) throws SQLException {
        String sql = "SELECT t.*, r.title as request_title, rep.attached_files_urls as report_urls " +
                "FROM tasks t " +
                "LEFT JOIN requests r ON t.request_id = r.id " +
                "LEFT JOIN reports rep ON t.id = rep.task_id " +
                "WHERE t.assigned_volunteer_id = ? ORDER BY t.status ASC, t.created_at DESC";
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

    /**
     * Retrieves all tasks coordinated by a specific coordinator.
     *
     * @param coordinatorId The UUID of the coordinator.
     * @return A list of Task objects.
     * @throws SQLException If a database access error occurs.
     */
    public List<Task> getTasksByCoordinatorId(UUID coordinatorId) throws SQLException {
        String sql = "SELECT t.*, r.title as request_title, rep.attached_files_urls as report_urls " +
                "FROM tasks t " +
                "LEFT JOIN requests r ON t.request_id = r.id " +
                "LEFT JOIN reports rep ON t.id = rep.task_id " +
                "WHERE t.coordinator_id = ? ORDER BY t.created_at DESC";
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

    /**
     * Retrieves tasks assigned to a volunteer matching a specific status.
     *
     * @param volunteerId The UUID of the volunteer.
     * @param status      The targeted TaskStatus.
     * @return A list of matching Task objects.
     * @throws SQLException If a database access error occurs.
     */
    public List<Task> getTasksByVolunteerAndStatus(UUID volunteerId, TaskStatus status) throws SQLException {
        String sql = "SELECT t.*, r.title as request_title, rep.attached_files_urls as report_urls " +
                "FROM tasks t " +
                "LEFT JOIN requests r ON t.request_id = r.id " +
                "LEFT JOIN reports rep ON t.id = rep.task_id " +
                "WHERE t.assigned_volunteer_id = ? AND t.status = ?::task_status ORDER BY t.created_at DESC";
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

    /**
     * Retrieves tasks that have been either completed or cancelled for a volunteer.
     *
     * @param volunteerId The UUID of the volunteer.
     * @return A list of archived Task objects.
     * @throws SQLException If a database access error occurs.
     */
    public List<Task> getArchivedTasksByVolunteerId(UUID volunteerId) throws SQLException {
        String sql = "SELECT t.*, r.title as request_title, rep.attached_files_urls as report_urls FROM tasks t " +
                "LEFT JOIN requests r ON t.request_id = r.id " +
                "LEFT JOIN reports rep ON t.id = rep.task_id " +
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

    /**
     * Counts the total number of COMPLETED tasks assigned to a volunteer.
     *
     * @param volunteerId The UUID of the volunteer.
     * @return The integer count.
     * @throws SQLException If a database access error occurs.
     */
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

    /**
     * Counts the total number of active (non-completed) tasks for a volunteer.
     *
     * @param volunteerId The UUID of the volunteer.
     * @return The integer count.
     * @throws SQLException If a database access error occurs.
     */
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

    /**
     * Counts tasks completed by a volunteer within a specified lookback window.
     *
     * @param volunteerId The UUID of the volunteer.
     * @param days        The number of days to look back.
     * @return The integer count.
     * @throws SQLException If a database access error occurs.
     */
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

    /**
     * Helper method to map a ResultSet to a Task object.
     */
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

        // Safely set report URLs from the LEFT JOIN
        try {
            task.setReportUrls(rs.getString("report_urls"));
        } catch (SQLException e) {
            // Ignored if column isn't present
        }

        return task;
    }
}