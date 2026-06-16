package com.lanka.dao;

import com.lanka.database.DatabaseConfig;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

/**
 * Data Access Object for handling general site settings stored in the database.
 */
public class SettingsDAO {

    /**
     * Retrieves all site settings as key-value pairs.
     *
     * @return A Map containing the setting keys and their corresponding values.
     * @throws SQLException If a database access error occurs.
     */
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

    /**
     * Upserts a site setting. Inserts if new, updates value if the key already exists.
     *
     * @param key   The setting key.
     * @param value The setting value.
     * @throws SQLException If a database access error occurs.
     */
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