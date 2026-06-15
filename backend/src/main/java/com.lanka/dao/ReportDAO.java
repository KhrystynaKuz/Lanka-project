package com.lanka.dao;

import com.lanka.database.DatabaseConfig;
import com.lanka.models.Report;
import org.springframework.stereotype.Repository;
import com.lanka.models.ReportDTO;
import com.lanka.models.ReportItemDTO;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

import java.sql.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Repository
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

        java.sql.Array sqlArray = rs.getArray("attached_files_urls");
        if (sqlArray != null) {
            try {
                report.setAttached_files_urls((String[]) sqlArray.getArray());
            } finally {
                sqlArray.free();
            }
        } else {
            report.setAttached_files_urls(new String[0]);
        }

        report.setCreated_at(rs.getObject("created_at", OffsetDateTime.class));
        return report;
    }

    // НОВИЙ МЕТОД ДЛЯ ГЕНЕРАЦІЇ ЗВІТІВ (ВИПРАВЛЕНИЙ)
    public List<ReportDTO> getGeneratedReportsData(LocalDate startDate, LocalDate endDate, UUID departmentId) throws SQLException {
        // Базовий запит
        StringBuilder sql = new StringBuilder(
                "SELECT " +
                        "    r.id AS request_id, " +
                        "    r.created_at::date AS request_date, " +
                        "    CONCAT(u.last_name, ' ', u.first_name, ' ', COALESCE(u.patronymic, '')) AS customer_name, " +
                        "    r.title, " +
                        "    r.description, " +
                        "    r.status, " +
                        "    i.item_name, " +
                        "    ABS(it.quantity_changed) AS qty, " +
                        "    i.unit_price, " +
                        "    COALESCE(it.transportation_cost, 0) AS transport_cost, " +
                        "    it.transaction_date::date AS transaction_date " +
                        "FROM public.requests r " +
                        "JOIN public.users u ON r.customer_id = u.id " +
                        "JOIN public.inventory_transactions it ON it.request_id = r.id " +
                        "JOIN public.inventory i ON it.inventory_id = i.id " +
                        "LEFT JOIN public.tasks t ON t.request_id = r.id " +
                        "WHERE r.status IN ('APPROVED', 'IN_PROGRESS', 'FULFILLED') " +
                        "  AND r.created_at >= ?::timestamp " +
                        "  AND r.created_at < (?::timestamp + interval '1 day') "
        );

        // Динамічно додаємо умову для відділу, якщо він переданий
        if (departmentId != null) {
            sql.append(" AND t.department_id = ? ");
        }

        sql.append("ORDER BY r.created_at DESC");

        Map<String, ReportDTO> reportMap = new LinkedHashMap<>();

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {

            ps.setObject(1, startDate);
            ps.setObject(2, endDate);

            // Встановлюємо третій параметр лише якщо departmentId не null
            if (departmentId != null) {
                ps.setObject(3, departmentId, Types.OTHER);
            }

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String reqId = rs.getString("request_id");

                    ReportDTO report = reportMap.getOrDefault(reqId, new ReportDTO());
                    if (!reportMap.containsKey(reqId)) {
                        report.setRequestId(reqId);

                        java.sql.Date reqDateSql = rs.getDate("request_date");
                        if(reqDateSql != null) report.setRequestDate(reqDateSql.toLocalDate());

                        report.setCustomerName(rs.getString("customer_name"));
                        report.setTitle(rs.getString("title"));
                        report.setDescription(rs.getString("description"));
                        report.setStatus(rs.getString("status"));
                        reportMap.put(reqId, report);
                    }

                    ReportItemDTO item = new ReportItemDTO();
                    item.setName(rs.getString("item_name"));
                    item.setQty(rs.getInt("qty"));
                    item.setPrice(rs.getBigDecimal("unit_price"));
                    item.setTransportCost(rs.getBigDecimal("transport_cost"));

                    java.sql.Date transDateSql = rs.getDate("transaction_date");
                    if(transDateSql != null) item.setDate(transDateSql.toLocalDate());

                    report.addItem(item);
                }
            }
        }
        return new ArrayList<>(reportMap.values());
    }
}
