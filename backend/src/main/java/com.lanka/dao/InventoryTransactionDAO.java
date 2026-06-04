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
        String sql = "INSERT INTO inventory_transactions (id, inventory_id, request_id, user_id, quantity_changed, transaction_date) " +
                "VALUES (?, ?, ?, ?, ?, ?)";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            if (transaction.getId() == null) {
                transaction.setId(UUID.randomUUID());
            }
            if (transaction.getTransaction_date() == null) {
                transaction.setTransaction_date(OffsetDateTime.now());
            }

            ps.setObject(1, transaction.getId());
            ps.setObject(2, transaction.getInventory_id());
            ps.setObject(3, transaction.getRequest_id());
            ps.setObject(4, transaction.getUser_id());
            ps.setInt(5, transaction.getQuantity_changed());
            ps.setObject(6, transaction.getTransaction_date());

            ps.executeUpdate();
        }
    }

    public List<InventoryTransaction> getAllTransactions() throws SQLException {
        String sql = "SELECT id, inventory_id, request_id, user_id, quantity_changed, transaction_date " +
                "FROM inventory_transactions ORDER BY transaction_date DESC";
        List<InventoryTransaction> list = new ArrayList<>();

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                list.add(mapRowToTransaction(rs));
            }
        }
        return list;
    }

    public InventoryTransaction getTransactionById(UUID id) throws SQLException {
        String sql = "SELECT id, inventory_id, request_id, user_id, quantity_changed, transaction_date " +
                "FROM inventory_transactions WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRowToTransaction(rs);
                }
            }
        }
        return null;
    }

    public List<InventoryTransaction> getTransactionsByInventoryId(UUID inventoryId) throws SQLException {
        String sql = "SELECT id, inventory_id, request_id, user_id, quantity_changed, transaction_date " +
                "FROM inventory_transactions WHERE inventory_id = ? ORDER BY transaction_date DESC";
        List<InventoryTransaction> list = new ArrayList<>();

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, inventoryId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRowToTransaction(rs));
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
        return transaction;
    }
}