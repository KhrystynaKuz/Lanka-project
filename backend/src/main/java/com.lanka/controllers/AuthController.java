package com.lanka.controllers;

import com.lanka.dao.UserDAO;
import com.lanka.models.User;
import com.lanka.service.AuthService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;

import java.sql.SQLException;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * REST controller for handling user authentication and session management.
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "https://lanka-project.onrender.com",
        allowCredentials = "true")
public class AuthController {

    private final UserDAO userDAO;

    /**
     * Constructs the AuthController with a specific UserDAO.
     *
     * @param userDAO The data access object for users.
     */
    @Autowired
    public AuthController(UserDAO userDAO) {
        this.userDAO = userDAO;
    }

    /**
     * Default constructor for AuthController.
     */
    public AuthController() {
        this.userDAO = new UserDAO();
    }

    /**
     * Authenticates a user using a Bearer token and returns their profile.
     *
     * @param authHeader The Authorization header containing the Bearer token.
     * @return A ResponseEntity containing the verified User object, or an error payload based on the failure.
     */
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

    /**
     * Sets the user ID into the current HTTP session.
     *
     * @param userId  The UUID string of the user.
     * @param session The current HTTP session.
     */
    @PostMapping("/set-session")
    public void setSession(@RequestBody String userId, HttpSession session) {
        session.setAttribute("userId", UUID.fromString(userId.replace("\"", "")));
    }

    /**
     * Initializes a login session by mapping the given user ID to the session attributes.
     *
     * @param payload A map containing the "userId" string.
     * @param session The current HTTP session.
     */
    @PostMapping("/login-session")
    public ResponseEntity<?> loginSession(
            @RequestBody Map<String, String> payload,
            HttpSession session
    ) {
        String userId = payload.get("userId");

        if (userId != null) {
            session.setAttribute("userId", UUID.fromString(userId));

            System.out.println("SESSION ID = " + session.getId());
            System.out.println("USER ID = " + session.getAttribute("userId"));
        }

        return ResponseEntity.ok(session.getId());
    }

    /**
     * Retrieves the verification status of a user.
     *
     * @param userId The UUID of the user.
     * @return A ResponseEntity containing a map with the "is_verified" status, or an error payload.
     */
    @GetMapping("/status/{userId}")
    public ResponseEntity<?> getUserStatus(@PathVariable UUID userId) {
        try {
            Optional<User> userOpt = userDAO.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Користувача не знайдено"));
            }

            User user = userOpt.get();

            HashMap<String, Object> response = new HashMap<>();
            response.put("is_verified", user.isIs_verified());

            return ResponseEntity.ok(response);

        } catch (SQLException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Помилка бази даних"));
        }
    }
}