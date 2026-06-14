package com.lanka.dao;

import com.lanka.database.DatabaseConfig;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.util.*;

@Repository
public class DocumentDAO {

    public void addDocument(UUID userId, String type, String fileUrl) throws SQLException {
        String sql = "INSERT INTO user_documents (id, user_id, type, file_url, status, uploaded_at) " +
                "VALUES (?, ?, ?, ?, 'PENDING'::public.document_status, ?)";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, UUID.randomUUID());
            ps.setObject(2, userId);
            ps.setString(3, type);
            ps.setString(4, fileUrl);
            ps.setObject(5, java.time.OffsetDateTime.now());
            ps.executeUpdate();
        }
    }

    public List<Map<String, String>> getUserDocuments(UUID userId) throws SQLException {
        String sql = "SELECT id, type, file_url, status, rejection_reason, uploaded_at, verified_at " +
                "FROM user_documents WHERE user_id = ? ORDER BY uploaded_at DESC";

        List<Map<String, String>> docs = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, String> doc = new HashMap<>();
                    doc.put("id", rs.getString("id"));
                    doc.put("type", rs.getString("type"));
                    doc.put("file_url", rs.getString("file_url"));
                    doc.put("status", rs.getString("status"));
                    doc.put("rejection_reason", rs.getString("rejection_reason"));
                    doc.put("uploaded_at", rs.getString("uploaded_at"));
                    doc.put("verified_at", rs.getString("verified_at"));
                    docs.add(doc);
                }
            }
        }
        return docs;
    }

    public void deleteDocument(UUID docId) throws SQLException {
        String sql = "DELETE FROM user_documents WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, docId);
            ps.executeUpdate();
        }
    }

    public void updateDocumentStatus(UUID docId, String status, UUID verifiedBy, String rejectionReason) throws SQLException {
        String sql = "UPDATE user_documents SET status = ?::public.document_status, " +
                "verified_at = ?, verified_by = ?, rejection_reason = ? WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setObject(2, java.time.OffsetDateTime.now());
            ps.setObject(3, verifiedBy);
            ps.setString(4, rejectionReason);
            ps.setObject(5, docId);
            ps.executeUpdate();
        }
    }
}