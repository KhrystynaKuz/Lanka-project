package com.lanka.dao;

import com.lanka.database.DatabaseConfig;
import com.lanka.models.InventoryTransaction;

import java.sql.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class InventoryTransactionDAO {

    public void addTransaction(InventoryTransaction transaction) throws SQLException {
        String sql = "INSERT INTO inventory_transactions (id, inventory_id, request_id, user_id, quantity_changed, transaction_date, type, transportation_cost) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?::transaction_type, ?)";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            if (transaction.getId() == null) transaction.setId(UUID.randomUUID());
            if (transaction.getTransaction_date() == null) transaction.setTransaction_date(OffsetDateTime.now());

            ps.setObject(1, transaction.getId());
            ps.setObject(2, transaction.getInventory_id());
            ps.setObject(3, transaction.getRequest_id());
            ps.setObject(4, transaction.getUser_id());
            ps.setInt(5, transaction.getQuantity_changed());
            ps.setObject(6, transaction.getTransaction_date());
            ps.setString(7, transaction.getType() != null ? transaction.getType() : "ADDITION");
            ps.setBigDecimal(8, transaction.getTransportation_cost());

            ps.executeUpdate();
        }
    }

    public List<InventoryTransaction> getTransactionsByInventoryId(UUID inventoryId) throws SQLException {
        // Додаємо JOIN з таблицею users та конкатенацію імені
        String sql = "SELECT t.id, t.inventory_id, t.request_id, t.user_id, t.quantity_changed, " +
                "t.transaction_date, t.type, t.transportation_cost, " +
                "u.first_name || ' ' || u.last_name AS user_full_name " +
                "FROM inventory_transactions t " +
                "LEFT JOIN users u ON t.user_id = u.id " +
                "WHERE t.inventory_id = ? ORDER BY t.transaction_date DESC";

        List<InventoryTransaction> list = new ArrayList<>();

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, inventoryId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    InventoryTransaction transaction = new InventoryTransaction();
                    transaction.setId(rs.getObject("id", UUID.class));
                    transaction.setInventory_id(rs.getObject("inventory_id", UUID.class));
                    transaction.setRequest_id(rs.getObject("request_id", UUID.class));
                    transaction.setUser_id(rs.getObject("user_id", UUID.class));
                    transaction.setQuantity_changed(rs.getInt("quantity_changed"));
                    transaction.setTransaction_date(rs.getObject("transaction_date", OffsetDateTime.class));
                    transaction.setType(rs.getString("type"));
                    transaction.setTransportation_cost(rs.getBigDecimal("transportation_cost"));

                    // Мапимо нове поле
                    transaction.setUser_full_name(rs.getString("user_full_name"));

                    list.add(transaction);
                }
            }
        }
        return list;
    }

    private InventoryTransaction mapRowToTransaction(ResultSet rs) throws SQLException {
        InventoryTransaction transaction = new InventoryTransaction();
        transaction.setId(rs.getObject("id", UUID.class));
        transaction.setInventory_id(rs.getObject("inventory_id", UUID.class));
        transaction.setRequest_id(rs.getObject("request_id", UUID.class));
        transaction.setUser_id(rs.getObject("user_id", UUID.class));
        transaction.setQuantity_changed(rs.getInt("quantity_changed"));
        transaction.setTransaction_date(rs.getObject("transaction_date", OffsetDateTime.class));
        transaction.setType(rs.getString("type"));
        transaction.setTransportation_cost(rs.getBigDecimal("transportation_cost"));
        return transaction;
    }
}