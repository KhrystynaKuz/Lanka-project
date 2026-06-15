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

@Repository
public class RequestDAO {

    public void addRequest(Request request) throws SQLException {
        String sql = "INSERT INTO requests (id, customer_id, title, description, status, priority, created_at, updated_at, manager_id) " +
                "VALUES (?, ?, ?, ?, ?::request_status, ?, ?, ?, ?)";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            if (request.getId() == null) {
                request.setId(UUID.randomUUID());
            }
            if (request.getCreated_at() == null) {
                request.setCreated_at(OffsetDateTime.now());
            }
            if (request.getUpdated_at() == null) {
                request.setUpdated_at(OffsetDateTime.now());
            }
            if (request.getStatus() == null) {
                request.setStatus(RequestStatus.PENDING);
            }

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

    public void deleteRequest(UUID id) throws SQLException {
        String sql = "DELETE FROM requests WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, id);
            ps.executeUpdate();
        }
    }

    // 1. UPDATE THE SQL IN THIS METHOD
    public List<Request> getRequestsByCustomerId(UUID customerId) throws SQLException {
        // ADD manager_id to the SELECT statement here!
        String sql = "SELECT id, customer_id, title, description, status::text, priority, created_at, updated_at, manager_id " +
                "FROM requests WHERE customer_id = ? ORDER BY created_at DESC";
        List<Request> list = new ArrayList<>();

        try (Connection conn = com.lanka.database.DatabaseConfig.getConnection();
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

    // 2. UPDATE THE MAPPING METHOD
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

        // ADD THIS LINE TO GET THE MANAGER ID!
        request.setManager_id(rs.getObject("manager_id", UUID.class));

        return request;
    }

    public List<Request> getPendingRequests() throws SQLException {
        return getRequestsByStatus(RequestStatus.PENDING);
    }

    public int getPendingCount() throws SQLException {
        String sql = "SELECT COUNT(*) FROM requests WHERE status::text = 'PENDING'";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                return rs.getInt(1);
            }
        }
        return 0;
    }

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
    public List<Request> getAllRequests() throws SQLException {
        // ДОДАНО manager_id В SQL
        String sql = "SELECT id, customer_id, title, description, status::text, priority, created_at, updated_at, manager_id " +
                "FROM requests ORDER BY created_at DESC";
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

    public Request getRequestById(UUID id) throws SQLException {
        String sql = "SELECT id, customer_id, title, description, status::text, priority, created_at, updated_at, manager_id " +
                "FROM requests WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, id);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Request request = mapRowToRequest(rs);

                    request.setDepartments(
                            getDepartmentsByRequestId(request.getId())
                    );

                    return request;
                }
            }
        }

        return null;
    }

    public List<Request> searchByTitle(String titlePart) throws SQLException {
        String sql = """
        SELECT id, customer_id, title, description,
               status::text, priority, created_at, updated_at, manager_id
        FROM requests
        WHERE title ILIKE ?
        ORDER BY created_at DESC
        """;

        List<Request> list = new ArrayList<>();

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, titlePart + "%");

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Request request = mapRowToRequest(rs);

                    request.setDepartments(
                            getDepartmentsByRequestId(request.getId())
                    );

                    list.add(request);
                }
            }
        }

        return list;
    }

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

                    request.setDepartments(
                            getDepartmentsByRequestId(request.getId())
                    );

                    list.add(request);
                }
            }
        }

        return list;
    }

    public List<String> getDepartmentsByRequestId(UUID requestId) throws SQLException {
        String sql = """
        SELECT DISTINCT d.name
        FROM tasks t
        JOIN departments d ON d.id = t.department_id
        WHERE t.request_id = ?
    """;

        List<String> departments = new ArrayList<>();

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, requestId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    departments.add(rs.getString("name"));
                }
            }
        }

        return departments;
    }
}