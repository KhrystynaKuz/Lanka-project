package com.lanka.controllers;

import com.lanka.dao.UserDAO;
import com.lanka.models.User;
import com.lanka.service.AuthService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.SQLException;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"})
public class AuthController {

    private final UserDAO userDAO;

    @Autowired
    public AuthController(UserDAO userDAO) {
        this.userDAO = userDAO;
    }

    public AuthController() {
        this.userDAO = new UserDAO();
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Missing or invalid token"));
        }

        String token = authHeader.substring(7);

        try {
            UUID userId = AuthService.verifyTokenAndGetUserId(token);
            Optional<User> userOpt = userDAO.findById(userId);

            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found"));
            }

            return ResponseEntity.ok(userOpt.get());

        } catch (SQLException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Database connection error"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Auth error: " + e.getMessage()));
        }
    }

    @PostMapping("/set-session")
    public void setSession(@RequestBody String userId, HttpSession session) {
        session.setAttribute("userId", UUID.fromString(userId.replace("\"", "")));
    }

    @PostMapping("/login-session")
    public void loginSession(@RequestBody Map<String, String> payload, HttpSession session) {
        String userId = payload.get("userId");
        if (userId != null) {
            session.setAttribute("userId", UUID.fromString(userId));
        }
    }
}