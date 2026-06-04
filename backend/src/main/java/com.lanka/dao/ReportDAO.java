package com.lanka.dao;

import com.lanka.database.DatabaseConfig;
import com.lanka.models.Report;

import java.sql.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class ReportDAO {

    public void addReport(Report report) throws SQLException {
        String sql = "INSERT INTO reports (id, task_id, author_id, content, attached_files_urls, created_at) " +
                "VALUES (?, ?, ?, ?, ?, ?)";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            if (report.getId() == null) {
                report.setId(UUID.randomUUID());
            }
            if (report.getCreated_at() == null) {
                report.setCreated_at(OffsetDateTime.now());
            }

            ps.setObject(1, report.getId());
            ps.setObject(2, report.getTask_id());
            ps.setObject(3, report.getAuthor_id());
            ps.setString(4, report.getContent());

            if (report.getAttached_files_urls() != null) {
                Array sqlArray = conn.createArrayOf("text", report.getAttached_files_urls());
                ps.setArray(5, sqlArray);
            } else {
                ps.setNull(5, Types.ARRAY);
            }

            ps.setObject(6, report.getCreated_at());

            ps.executeUpdate();
        }
    }

    public void updateReport(Report report) throws SQLException {
        String sql = "UPDATE reports SET task_id = ?, author_id = ?, content = ?, attached_files_urls = ? " +
                "WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, report.getTask_id());
            ps.setObject(2, report.getAuthor_id());
            ps.setString(3, report.getContent());

            if (report.getAttached_files_urls() != null) {
                Array sqlArray = conn.createArrayOf("text", report.getAttached_files_urls());
                ps.setArray(4, sqlArray);
            } else {
                ps.setNull(4, Types.ARRAY);
            }

            ps.setObject(5, report.getId());

            ps.executeUpdate();
        }
    }

    public void deleteReport(UUID id) throws SQLException {
        String sql = "DELETE FROM reports WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, id);
            ps.executeUpdate();
        }
    }

    public List<Report> getAllReports() throws SQLException {
        String sql = "SELECT id, task_id, author_id, content, attached_files_urls, created_at " +
                "FROM reports ORDER BY created_at DESC";
        List<Report> list = new ArrayList<>();

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                list.add(mapRowToReport(rs));
            }
        }
        return list;
    }

    public Report getReportById(UUID id) throws SQLException {
        String sql = "SELECT id, task_id, author_id, content, attached_files_urls, created_at " +
                "FROM reports WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRowToReport(rs);
                }
            }
        }
        return null;
    }

    public List<Report> getReportsByTaskId(UUID taskId) throws SQLException {
        String sql = "SELECT id, task_id, author_id, content, attached_files_urls, created_at " +
                "FROM reports WHERE task_id = ? ORDER BY created_at DESC";
        List<Report> list = new ArrayList<>();

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, taskId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRowToReport(rs));
                }
            }
        }
        return list;
    }

    private Report mapRowToReport(ResultSet rs) throws SQLException {
        Report report = new Report();
        report.setId(rs.getObject("id", UUID.class));
        report.setTask_id(rs.getObject("task_id", UUID.class));
        report.setAuthor_id(rs.getObject("author_id", UUID.class));
        report.setContent(rs.getString("content"));

        Array sqlArray = rs.getArray("attached_files_urls");
        if (sqlArray != null) {
            report.setAttached_files_urls((String[]) sqlArray.getArray());
        }

        report.setCreated_at(rs.getObject("created_at", OffsetDateTime.class));
        return report;
    }
}
