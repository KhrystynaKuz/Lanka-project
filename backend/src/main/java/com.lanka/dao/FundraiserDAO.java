package com.lanka.dao;

import com.lanka.database.DatabaseConfig;
import com.lanka.models.Fundraiser;
import java.sql.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class FundraiserDAO {

    public List<Fundraiser> getAllFundraisers() {
        List<Fundraiser> fundraisers = new ArrayList<>();
        String sql = "SELECT id, title, description, link, qr_code_url, is_hidden, created_at FROM fundraisers ORDER BY created_at DESC";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                Fundraiser f = new Fundraiser();
                f.setId((UUID) rs.getObject("id"));
                f.setTitle(rs.getString("title"));
                f.setDescription(rs.getString("description"));
                f.setLink(rs.getString("link"));
                f.setQr_code_url(rs.getString("qr_code_url"));
                f.setIs_hidden(rs.getBoolean("is_hidden"));
                f.setCreated_at(rs.getObject("created_at", OffsetDateTime.class));

                fundraisers.add(f);
            }
        } catch (SQLException e) {
            System.err.println("Помилка при отриманні списку зборів: " + e.getMessage());
        }
        return fundraisers;
    }

    public boolean saveAll(List<Fundraiser> fundraisers) {
        String deleteSql = "DELETE FROM fundraisers";
        String insertSql = "INSERT INTO fundraisers (id, title, description, link, qr_code_url, is_hidden, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)";

        Connection conn = null;
        try {
            conn = DatabaseConfig.getConnection();
            conn.setAutoCommit(false);

            try (PreparedStatement deleteStmt = conn.prepareStatement(deleteSql)) {
                deleteStmt.executeUpdate();
            }

            try (PreparedStatement insertStmt = conn.prepareStatement(insertSql)) {
                for (Fundraiser f : fundraisers) {
                    UUID id = f.getId();
                    if (id == null) {
                        id = UUID.randomUUID();
                    }

                    OffsetDateTime createdAt = f.getCreated_at();
                    if (createdAt == null) {
                        createdAt = OffsetDateTime.now();
                    }

                    insertStmt.setObject(1, id);
                    insertStmt.setString(2, f.getTitle());
                    insertStmt.setString(3, f.getDescription());
                    insertStmt.setString(4, f.getLink());
                    insertStmt.setString(5, f.getQr_code_url());
                    insertStmt.setBoolean(6, f.isIs_hidden());
                    insertStmt.setObject(7, createdAt);

                    insertStmt.addBatch();
                }
                insertStmt.executeBatch();
            }

            conn.commit();
            return true;

        } catch (SQLException e) {
            if (conn != null) {
                try {
                    conn.rollback();
                    System.err.println("Транзакцію скасовано через помилку!");
                } catch (SQLException ex) {
                    System.err.println("Помилка при rollback: " + ex.getMessage());
                }
            }
            System.err.println("Помилка при збереженні списку зборів: " + e.getMessage());
            return false;
        } finally {
            if (conn != null) {
                try {
                    conn.setAutoCommit(true);
                    conn.close();
                } catch (SQLException e) {
                    System.err.println("Помилка при закритті підключення: " + e.getMessage());
                }
            }
        }
    }
}
