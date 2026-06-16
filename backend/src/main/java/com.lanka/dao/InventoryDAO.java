package com.lanka.dao;

import com.lanka.database.DatabaseConfig;
import com.lanka.models.Inventory;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Data Access Object for managing inventory items in the system.
 */
@Repository
public class InventoryDAO {

    /**
     * Adds a new item to the inventory.
     *
     * @param item The Inventory object to insert.
     * @throws SQLException If a database access error occurs.
     */
    public void addInventory(Inventory item) throws SQLException {
        String sql = "INSERT INTO inventory (id, item_name, quantity, unit_of_measure, unit_price, last_updated_by, updated_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            if (item.getId() == null) item.setId(UUID.randomUUID());
            if (item.getUpdated_at() == null) item.setUpdated_at(OffsetDateTime.now());

            ps.setObject(1, item.getId());
            ps.setString(2, item.getItem_name());
            ps.setInt(3, item.getQuantity());
            ps.setString(4, item.getUnit_of_measure());
            ps.setBigDecimal(5, item.getUnit_price());
            ps.setObject(6, item.getLast_updated_by());
            ps.setObject(7, item.getUpdated_at());

            ps.executeUpdate();
        }
    }

    /**
     * Updates the quantity of a specific inventory item.
     *
     * @param id            The UUID of the inventory item.
     * @param newQuantity   The updated quantity.
     * @param coordinatorId The UUID of the user making the change.
     * @throws SQLException If a database access error occurs.
     */
    public void updateInventoryQuantity(UUID id, int newQuantity, UUID coordinatorId) throws SQLException {
        String sql = "UPDATE inventory SET quantity = ?, last_updated_by = ?, updated_at = ? WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, newQuantity);
            ps.setObject(2, coordinatorId);
            ps.setObject(3, OffsetDateTime.now());
            ps.setObject(4, id);

            ps.executeUpdate();
        }
    }

    /**
     * Deletes an inventory item and completely removes its transaction history.
     * Executed within a manual transaction block.
     *
     * @param id The UUID of the inventory item to delete.
     * @throws SQLException If a database access error occurs.
     */
    public void deleteInventory(UUID id) throws SQLException {
        String deleteTransactionsSql = "DELETE FROM inventory_transactions WHERE inventory_id = ?";
        String deleteInventorySql = "DELETE FROM inventory WHERE id = ?";

        // We use a manual transaction to ensure both deletes succeed, or neither do.
        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);

            try (PreparedStatement ps1 = conn.prepareStatement(deleteTransactionsSql);
                 PreparedStatement ps2 = conn.prepareStatement(deleteInventorySql)) {

                // 1. Erase the history first
                ps1.setObject(1, id);
                ps1.executeUpdate();

                // 2. Erase the item
                ps2.setObject(1, id);
                ps2.executeUpdate();

                conn.commit();
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    /**
     * Retrieves all inventory items sorted alphabetically by item name.
     *
     * @return A list of Inventory objects.
     * @throws SQLException If a database access error occurs.
     */
    public List<Inventory> getAllInventory() throws SQLException {
        String sql = "SELECT id, item_name, quantity, unit_of_measure, unit_price, last_updated_by, updated_at " +
                "FROM inventory ORDER BY item_name ASC";
        List<Inventory> list = new ArrayList<>();

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(mapRowToInventory(rs));
            }
        }
        return list;
    }

    /**
     * Retrieves a single inventory item by its ID.
     *
     * @param id The UUID of the inventory item.
     * @return The Inventory object, or null if not found.
     * @throws SQLException If a database access error occurs.
     */
    public Inventory getInventoryById(UUID id) throws SQLException {
        String sql = "SELECT id, item_name, quantity, unit_of_measure, unit_price, last_updated_by, updated_at " +
                "FROM inventory WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRowToInventory(rs);
            }
        }
        return null;
    }

    /**
     * Helper method to map a ResultSet to an Inventory object.
     */
    private Inventory mapRowToInventory(ResultSet rs) throws SQLException {
        Inventory item = new Inventory();
        item.setId(rs.getObject("id", UUID.class));
        item.setItem_name(rs.getString("item_name"));
        item.setQuantity(rs.getInt("quantity"));
        item.setUnit_of_measure(rs.getString("unit_of_measure"));
        item.setUnit_price(rs.getBigDecimal("unit_price"));
        item.setLast_updated_by(rs.getObject("last_updated_by", UUID.class));
        item.setUpdated_at(rs.getObject("updated_at", OffsetDateTime.class));
        return item;
    }

    /**
     * Updates an inventory item's metadata (name, unit, price) without affecting its quantity.
     * Quantities should only be changed via transactions and updateInventoryQuantity().
     *
     * @param item The Inventory object with updated details.
     * @throws SQLException If a database access error occurs.
     */
    public void updateInventory(Inventory item) throws SQLException {
        // Note: 'quantity' is intentionally excluded from this UPDATE statement.
        // Quantities should only be changed via transactions and updateInventoryQuantity().
        String sql = "UPDATE inventory SET item_name = ?, unit_of_measure = ?, unit_price = ?, last_updated_by = ?, updated_at = ? " +
                "WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, item.getItem_name());
            ps.setString(2, item.getUnit_of_measure());
            ps.setBigDecimal(3, item.getUnit_price());
            ps.setObject(4, item.getLast_updated_by());

            item.setUpdated_at(OffsetDateTime.now());
            ps.setObject(5, item.getUpdated_at());

            ps.setObject(6, item.getId());

            ps.executeUpdate();
        }
    }
}