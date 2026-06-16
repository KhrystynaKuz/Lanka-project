package com.lanka.dao;

import com.lanka.database.DatabaseConfig;
import com.lanka.models.SiteReport;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object for handling site-level report metadata (name, URL, type).
 */
public class SiteReportDAO {

    /**
     * Retrieves all site reports.
     *
     * @return A list of SiteReport objects ordered by creation date descending.
     * @throws SQLException If a database access error occurs.
     */
    public List<SiteReport> getAllReports() throws SQLException {
        List<SiteReport> reports = new ArrayList<>();
        String sql = "SELECT name, url, type FROM site_reports ORDER BY created_at DESC";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                reports.add(new SiteReport(
                        rs.getString("name"),
                        rs.getString("url"),
                        rs.getString("type")
                ));
            }
        }
        return reports;
    }

    /**
     * Overwrites all existing site reports with a new batch inside a transaction block.
     *
     * @param reports The list of SiteReport objects to save.
     * @return True if successful.
     * @throws SQLException If a database access error occurs or the transaction fails.
     */
    public boolean saveAllReports(List<SiteReport> reports) throws SQLException {
        String deleteSql = "DELETE FROM site_reports";
        String insertSql = "INSERT INTO site_reports (name, url, type) VALUES (?, ?, ?)";

        Connection conn = null;
        try {
            conn = DatabaseConfig.getConnection();
            conn.setAutoCommit(false);

            try (Statement stmt = conn.createStatement()) {
                stmt.executeUpdate(deleteSql);
            }

            try (PreparedStatement pstmt = conn.prepareStatement(insertSql)) {
                for (SiteReport report : reports) {
                    pstmt.setString(1, report.getName());
                    pstmt.setString(2, report.getUrl());
                    pstmt.setString(3, report.getType());
                    pstmt.addBatch();
                }
                pstmt.executeBatch();
            }

            conn.commit();
            return true;
        } catch (SQLException e) {
            if (conn != null) conn.rollback();
            throw e;
        } finally {
            if (conn != null) conn.close();
        }
    }
}