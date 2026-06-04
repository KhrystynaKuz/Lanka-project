package com.lanka.controllers;

import com.lanka.dao.UserDAO;
import com.lanka.models.User;
import com.lanka.service.AuthService;
import io.javalin.http.Context;
import java.sql.SQLException;
import java.util.UUID;
import java.util.Optional;
import java.util.Map;

public class AuthController {

    private final UserDAO userDAO = new UserDAO();

    public void login(Context ctx) {
        String authHeader = ctx.header("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            ctx.status(401).json(Map.of("error", "Missing or invalid token"));
            return;
        }

        String token = authHeader.substring(7);

        try {
            UUID userId = AuthService.verifyTokenAndGetUserId(token);
            Optional<User> userOpt = userDAO.findById(userId);

            if (userOpt.isEmpty()) {
                ctx.status(404).json(Map.of("error", "User not found"));
                return;
            }

            ctx.status(200).json(userOpt.get());

        } catch (SQLException e) {
            ctx.status(500).json(Map.of("error", "Database connection error"));
        } catch (RuntimeException e) {
            ctx.status(401).json(Map.of("error", "Auth error: " + e.getMessage()));
        }
    }
}