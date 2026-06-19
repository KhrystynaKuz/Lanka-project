package com.lanka.dao;

import com.lanka.database.DatabaseConfig;
import com.lanka.models.Request;
import com.lanka.models.Request.RequestStatus;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Data Access Object for handling military and civilian aid requests.
 */
@Repository
public class RequestDAO {

    /**
     * Adds a new request to the system.
     *
     * @param request The Request object to save.
     * @throws SQLException If a database access error occurs.
     */
    public void addRequest(Request request) throws SQLException {
        String sql = "INSERT INTO requests (id, customer_id, title, description, status, priority, created_at, updated_at, manager_id) " +
                "VALUES (?, ?, ?, ?, ?::request_status, ?, ?, ?, ?)";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            if (request.getId() == null) request.setId(UUID.randomUUID());
            if (request.getCreated_at() == null) request.setCreated_at(OffsetDateTime.now());
            if (request.getUpdated_at() == null) request.setUpdated_at(OffsetDateTime.now());
            if (request.getStatus() == null) request.setStatus(RequestStatus.PENDING);

            ps.setObject(1, request.getId());
            ps.setObject(2, request.getCustomer_id());
            ps.setString(3, request.getTitle());
            ps.setString(4, request.getDescription());
            ps.setString(5, request.getStatus().name());
            ps.setInt(6, request.getPriority());
            ps.setObject(7, request.getCreated_at());
            ps.setObject(8, request.getUpdated_at());
            ps.setObject(9, request.getManager_id());

            ps.executeUpdate();
        }
    }

    /**
     * Updates an existing request.
     *
     * @param request The Request object containing updated data.
     * @throws SQLException If a database access error occurs.
     */
    public void updateRequest(Request request) throws SQLException {
        String sql = "UPDATE requests SET customer_id = ?, title = ?, description = ?, status = ?::request_status, priority = ?, updated_at = ? " +
                "WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, request.getCustomer_id());
            ps.setString(2, request.getTitle());
            ps.setString(3, request.getDescription());
            ps.setString(4, request.getStatus().name());
            ps.setInt(5, request.getPriority());

            request.setUpdated_at(OffsetDateTime.now());
            ps.setObject(6, request.getUpdated_at());
            ps.setObject(7, request.getId());

            ps.executeUpdate();
        }
    }

    /**
     * Deletes a request from the database.
     *
     * @param id The UUID of the request to delete.
     * @throws SQLException If a database access error occurs.
     */
    public void deleteRequest(UUID id) throws SQLException {
        String sql = "DELETE FROM requests WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, id);
            ps.executeUpdate();
        }
    }

    /**
     * Retrieves all requests made by a specific customer.
     *
     * @param customerId The UUID of the customer making the requests.
     * @return A list of Request objects.
     * @throws SQLException If a database access error occurs.
     */
    public List<Request> getRequestsByCustomerId(UUID customerId) throws SQLException {
        String sql = "SELECT id, customer_id, title, description, status::text, priority, created_at, updated_at, manager_id " +
                "FROM requests WHERE customer_id = ? ORDER BY created_at DESC";
        List<Request> list = new ArrayList<>();

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, customerId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRowToRequest(rs));
                }
            }
        }
        return list;
    }

    /**
     * Helper method to map a ResultSet to a Request object.
     */
    private Request mapRowToRequest(ResultSet rs) throws SQLException {
        Request request = new Request();
        request.setId(rs.getObject("id", UUID.class));
        request.setCustomer_id(rs.getObject("customer_id", UUID.class));
        request.setTitle(rs.getString("title"));
        request.setDescription(rs.getString("description"));

        String statusStr = rs.getString("status");
        if (statusStr != null) {
            request.setStatus(RequestStatus.valueOf(statusStr.toUpperCase()));
        }

        request.setPriority(rs.getInt("priority"));
        request.setCreated_at(rs.getObject("created_at", OffsetDateTime.class));
        request.setUpdated_at(rs.getObject("updated_at", OffsetDateTime.class));
        request.setManager_id(rs.getObject("manager_id", UUID.class));

        try {
            String fName = rs.getString("first_name");
            String lName = rs.getString("last_name");
            if (fName != null || lName != null) {
                request.setCustomerName((fName == null ? "" : fName) + " " + (lName == null ? "" : lName));
            }
        } catch (SQLException e) {
        }

        return request;
    }

    /**
     * Retrieves all requests with a PENDING status.
     *
     * @return A list of pending Request objects.
     * @throws SQLException If a database access error occurs.
     */
    public List<Request> getPendingRequests() throws SQLException {
        return getRequestsByStatus(RequestStatus.PENDING);
    }

    /**
     * Counts the total number of pending requests.
     *
     * @return The count of pending requests.
     * @throws SQLException If a database access error occurs.
     */
    public int getPendingCount() throws SQLException {
        String sql = "SELECT COUNT(*) FROM requests WHERE status::text = 'PENDING'";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) return rs.getInt(1);
        }
        return 0;
    }

    /**
     * Updates the status of a specific request.
     *
     * @param requestId The ID string of the request.
     * @param status    The new status string.
     * @throws SQLException If a database access error occurs.
     */
    public void updateStatus(String requestId, String status) throws SQLException {
        String sql = "UPDATE requests SET status = ?::request_status, updated_at = ? WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setObject(2, OffsetDateTime.now());
            ps.setObject(3, UUID.fromString(requestId));
            ps.executeUpdate();
        }
    }

    /**
     * Retrieves all requests, filling in the relevant departments associated with them.
     *
     * @return A list of Request objects.
     * @throws SQLException If a database access error occurs.
     */
    public List<Request> getAllRequests() throws SQLException {
        String sql = "SELECT id, customer_id, title, description, status::text, priority, created_at, updated_at, manager_id " +
                "FROM requests ORDER BY created_at DESC";
        List<Request> list = new ArrayList<>();

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                Request request = mapRowToRequest(rs);
                request.setDepartments(getDepartmentsByRequestId(request.getId()));
                list.add(request);
            }
        }
        return list;
    }

    /**
     * Retrieves a request by its ID.
     *
     * @param id The UUID of the request.
     * @return The Request object, or null if not found.
     * @throws SQLException If a database access error occurs.
     */
    public Request getRequestById(UUID id) throws SQLException {
        String sql = "SELECT id, customer_id, title, description, status::text, priority, created_at, updated_at, manager_id " +
                "FROM requests WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Request request = mapRowToRequest(rs);
                    request.setDepartments(getDepartmentsByRequestId(request.getId()));
                    return request;
                }
            }
        }
        return null;
    }

    /**
     * Searches requests by a title matching pattern.
     *
     * @param titlePart The starting string to match the title.
     * @return A list of matching Request objects.
     * @throws SQLException If a database access error occurs.
     */
    public List<Request> searchByTitle(String titlePart) throws SQLException {
        String sql = "SELECT id, customer_id, title, description, status::text, priority, created_at, updated_at, manager_id " +
                "FROM requests WHERE title ILIKE ? ORDER BY created_at DESC";
        List<Request> list = new ArrayList<>();

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, titlePart + "%");
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Request request = mapRowToRequest(rs);
                    request.setDepartments(getDepartmentsByRequestId(request.getId()));
                    list.add(request);
                }
            }
        }
        return list;
    }

    /**
     * Retrieves requests filtered by a specific status.
     *
     * @param status The target RequestStatus.
     * @return A list of Request objects filtered by the status.
     * @throws SQLException If a database access error occurs.
     */
    public List<Request> getRequestsByStatus(RequestStatus status) throws SQLException {
        String sql = "SELECT id, customer_id, title, description, status::text, priority, created_at, updated_at, manager_id " +
                "FROM requests WHERE status::text = ? ORDER BY priority DESC, created_at DESC";
        List<Request> list = new ArrayList<>();

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status.name());
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Request request = mapRowToRequest(rs);
                    request.setDepartments(getDepartmentsByRequestId(request.getId()));
                    list.add(request);
                }
            }
        }
        return list;
    }

    /**
     * Finds the names of all departments involved in a specific request based on its tasks.
     *
     * @param requestId The UUID of the request.
     * @return A list of department names.
     * @throws SQLException If a database access error occurs.
     */
    public List<String> getDepartmentsByRequestId(UUID requestId) throws SQLException {
        String sql = "SELECT DISTINCT d.name FROM tasks t JOIN departments d ON d.id = t.department_id WHERE t.request_id = ?";
        List<String> departments = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, requestId);
            try (ResultSet rs = ps.executeQuery()) {

                while (rs.next()) {
                    String dep = rs.getString("name");
                    departments.add(dep);
                }

            }
        }
        return departments;
    }

    // --- NEW METHOD FOR COORDINATOR LOGIC ---

    /**
     * Retrieves all requests relevant to a coordinator's assigned department.
     *
     * @param coordinatorId The UUID of the coordinator.
     * @return A list of matching Request objects.
     * @throws SQLException If a database access error occurs.
     */
    public List<Request> getRequestsByCoordinatorDepartment(UUID coordinatorId) throws SQLException {
        String sql = "SELECT DISTINCT r.id, r.customer_id, r.title, r.description, r.status::text, r.priority, r.created_at, r.updated_at, r.manager_id " +
                "FROM requests r " +
                "JOIN tasks t ON r.id = t.request_id " +
                "JOIN user_departments ud ON t.department_id = ud.department_id " +
                "WHERE ud.user_id = ? ORDER BY r.created_at DESC";

        List<Request> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, coordinatorId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Request request = mapRowToRequest(rs);
                    request.setDepartments(getDepartmentsByRequestId(request.getId()));
                    list.add(request);
                }
            }
        }
        return list;
    }

    /**
     * Retrieves all requests along with joined customer names.
     *
     * @return A list of Request objects mapped with customer names.
     * @throws SQLException If a database access error occurs.
     */
    public List<Request> getAllRequestsWithCustomerName() throws SQLException {
        List<Request> requests = new ArrayList<>();

        String sql = "SELECT r.id, r.customer_id, r.title, r.description, r.status::text, r.priority, r.created_at, r.updated_at, r.manager_id, u.first_name, u.last_name " +
                "FROM requests r " +
                "LEFT JOIN users u ON r.customer_id = u.id " +
                "ORDER BY r.created_at DESC";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                Request request = mapRowToRequest(rs);

                request.setDepartments(
                        getDepartmentsByRequestId(request.getId())
                );

                requests.add(request);
            }
        }

        return requests;
    }

    /**
     * Retrieves pending requests along with joined customer names.
     *
     * @return A list of pending Request objects with customer names.
     * @throws SQLException If a database access error occurs.
     */
    public List<Request> getPendingRequestsWithCustomerName() throws SQLException {
        String sql = "SELECT r.*, u.first_name, u.last_name " +
                "FROM requests r " +
                "LEFT JOIN users u ON r.customer_id = u.id " +
                "WHERE r.status::text = 'PENDING' " +
                "ORDER BY r.created_at DESC";

        List<Request> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Request request = mapRowToRequest(rs);

                request.setDepartments(
                        getDepartmentsByRequestId(request.getId())
                );

                list.add(request);
            }
        }
        return list;
    }

    /**
     * Retrieves requests related to tasks inside a volunteer's assigned department.
     *
     * @param userId The UUID of the volunteer.
     * @return A list of relevant Request objects.
     * @throws SQLException If a database access error occurs.
     */
    public List<Request> getRequestsByVolunteerDepartments(UUID userId) throws SQLException {
        String sql = "SELECT DISTINCT r.* FROM requests r " +
                "JOIN tasks t ON r.id = t.request_id " +
                "JOIN user_departments ud ON t.department_id = ud.department_id " +
                "WHERE ud.user_id = ? " +
                "ORDER BY r.created_at DESC";

        List<Request> list = new ArrayList<>();

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, userId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRowToRequest(rs));
                }
            }
        }
        return list;
    }
}