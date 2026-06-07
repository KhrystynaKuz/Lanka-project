package com.lanka.dao;

import com.lanka.database.DatabaseConfig;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

public class SettingsDAO {

    public Map<String, String> getAllSettings() throws SQLException {
        String sql = "SELECT key, value FROM site_settings";
        Map<String, String> settings = new HashMap<>();

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                settings.put(rs.getString("key"), rs.getString("value"));
            }
        }
        return settings;
    }

    public void updateSetting(String key, String value) throws SQLException {
        String sql = "INSERT INTO site_settings (key, value) VALUES (?, ?) " +
                "ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, key);
            ps.setString(2, value);
            ps.executeUpdate();
        }
    }
}