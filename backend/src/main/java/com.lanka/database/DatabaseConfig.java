package com.lanka.database;

import io.github.cdimascio.dotenv.Dotenv;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * Клас конфігурації підключення до бази даних PostgreSQL.
 * Використовує змінні середовища для налаштування з'єднання через Supabase.
 */
public class DatabaseConfig {

    private static final String DB_URL;
    private static final String DB_USER;
    private static final String DB_PASSWORD;

    static {
        Dotenv dotenv = Dotenv.configure()
                .directory("./backend")
                .load();
        DB_URL = dotenv.get("DB_URL");
        DB_USER = dotenv.get("DB_USER");
        DB_PASSWORD = dotenv.get("DB_PASSWORD");

        try {
            Class.forName("org.postgresql.Driver");
        } catch (ClassNotFoundException e) {
            throw new RuntimeException("PostgreSQL Driver not found", e);
        }
    }

    /**
     * Створює нове з'єднання з базою даних.
     * @return об'єкт {@link Connection}.
     * @throws SQLException у разі помилки підключення.
     */
    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
    }

    public static void main(String[] args) {
        try (Connection conn = getConnection()) {
            System.out.println("Successfully connected to Supabase!");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}