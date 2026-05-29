package com.lanka.database;

import io.github.cdimascio.dotenv.Dotenv;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseConfig {

    public static Connection getConnection() {
        // Load the .env file
        Dotenv dotenv = Dotenv.load();

        String dbUrl = dotenv.get("DB_URL");
        String dbUser = dotenv.get("DB_USER");
        String dbPassword = dotenv.get("DB_PASSWORD");

        try {
            // Register the driver explicitly (good practice in pure Java)
            Class.forName("org.postgresql.Driver");

            // Open the connection
            return DriverManager.getConnection(dbUrl, dbUser, dbPassword);

        } catch (ClassNotFoundException e) {
            throw new RuntimeException("PostgreSQL Driver not found", e);
        } catch (SQLException e) {
            throw new RuntimeException("Failed to connect to the database", e);
        }
    }

    public static void main(String[] args) {
        try (Connection conn = getConnection()) {
            System.out.println("Successfully connected to Supabase!");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}