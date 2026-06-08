package com.lanka.dao;

import com.lanka.database.DatabaseConfig;
import com.lanka.models.Inventory;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Repository
public class InventoryDAO {

    public void addInventory(Inventory item) throws SQLException {
        String sql = "INSERT INTO inventory (id, item_name, quantity, unit_of_measure, last_updated_by, updated_at) " +
                "VALUES (?, ?, ?, ?, ?, ?)";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            if (item.getId() == null) {
                item.setId(UUID.randomUUID());
            }
            if (item.getUpdated_at() == null) {
                item.setUpdated_at(OffsetDateTime.now());
            }

            ps.setObject(1, item.getId());
            ps.setString(2, item.getItem_name());
            ps.setInt(3, item.getQuantity());
            ps.setString(4, item.getUnit_of_measure());
            ps.setObject(5, item.getLast_updated_by());
            ps.setObject(6, item.getUpdated_at());

            ps.executeUpdate();
        }
    }

    public void updateInventory(Inventory item) throws SQLException {
        String sql = "UPDATE inventory SET item_name = ?, quantity = ?, unit_of_measure = ?, last_updated_by = ?, updated_at = ? " +
                "WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, item.getItem_name());
            ps.setInt(2, item.getQuantity());
            ps.setString(3, item.getUnit_of_measure());
            ps.setObject(4, item.getLast_updated_by());

            item.setUpdated_at(OffsetDateTime.now());
            ps.setObject(5, item.getUpdated_at());

            ps.setObject(6, item.getId());

            ps.executeUpdate();
        }
    }

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

    public void deleteInventory(UUID id) throws SQLException {
        String sql = "DELETE FROM inventory WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, id);
            ps.executeUpdate();
        }
    }

    public List<Inventory> getAllInventory() throws SQLException {
        String sql = "SELECT id, item_name, quantity, unit_of_measure, last_updated_by, updated_at " +
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

    public Inventory getInventoryById(UUID id) throws SQLException {
        String sql = "SELECT id, item_name, quantity, unit_of_measure, last_updated_by, updated_at " +
                "FROM inventory WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setObject(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRowToInventory(rs);
                }
            }
        }
        return null;
    }

    public Inventory getInventoryByName(String itemName) throws SQLException {
        String sql = "SELECT id, item_name, quantity, unit_of_measure, last_updated_by, updated_at " +
                "FROM inventory WHERE item_name = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, itemName);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRowToInventory(rs);
                }
            }
        }
        return null;
    }

    public List<Inventory> getInventoryByNameStart(String namePattern) throws SQLException {
        String sql = "SELECT id, item_name, quantity, unit_of_measure, last_updated_by, updated_at " +
                "FROM inventory WHERE item_name ILIKE ? ORDER BY item_name ASC";
        List<Inventory> list = new ArrayList<>();

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, namePattern + "%");

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRowToInventory(rs));
                }
            }
        }
        return list;
    }

    private Inventory mapRowToInventory(ResultSet rs) throws SQLException {
        Inventory item = new Inventory();
        item.setId(rs.getObject("id", UUID.class));
        item.setItem_name(rs.getString("item_name"));
        item.setQuantity(rs.getInt("quantity"));
        item.setUnit_of_measure(rs.getString("unit_of_measure"));
        item.setLast_updated_by(rs.getObject("last_updated_by", UUID.class));
        item.setUpdated_at(rs.getObject("updated_at", OffsetDateTime.class));
        return item;
    }
}