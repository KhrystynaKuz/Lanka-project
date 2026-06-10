package com.lanka.controllers.head;

import com.lanka.dao.UserDAO;
import com.lanka.dao.DocumentDAO;
import com.lanka.models.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.SQLException;
import java.util.*;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "http://localhost:5173",
        allowCredentials = "true",
        allowedHeaders = "*",
        methods = {RequestMethod.GET, RequestMethod.POST,
                RequestMethod.PUT, RequestMethod.DELETE,
                RequestMethod.OPTIONS})
public class ProfileController {

    private final UserDAO userDAO;
    private final DocumentDAO documentDAO;

    public ProfileController() {
        this.userDAO = new UserDAO();
        this.documentDAO = new DocumentDAO();
    }

    // Отримати повну інформацію по userId
    @GetMapping("/full-info-by-id")
    public ResponseEntity<?> getFullUserInfoById(@RequestParam UUID userId) {
        try {
            System.out.println("Отримано запит для userId: " + userId);
            Optional<User> userOpt = userDAO.findById(userId);

            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Користувача не знайдено"));
            }

            User user = userOpt.get();

            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("firstName", user.getFirst_name());
            response.put("lastName", user.getLast_name());
            response.put("patronymic", user.getPatronymic());
            response.put("email", user.getEmail());
            response.put("role", user.getRole() != null ? user.getRole().name() : "HEAD");
            response.put("phone_number", user.getPhone_number());
            response.put("dob", user.getDob());
            response.put("created_at", user.getCreated_at());

            // Отримуємо документи
            try {
                List<Map<String, String>> docs = documentDAO.getUserDocuments(user.getId());
                response.put("documents", docs);
            } catch (SQLException e) {
                System.out.println("Помилка завантаження документів: " + e.getMessage());
                response.put("documents", new ArrayList<>());
            }

            return ResponseEntity.ok(response);
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Помилка БД: " + e.getMessage()));
        }
    }

    @GetMapping("/documents")
    public ResponseEntity<?> getUserDocuments(@RequestParam UUID userId) {
        try {
            List<Map<String, String>> docs = documentDAO.getUserDocuments(userId);
            return ResponseEntity.ok(docs);
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Помилка: " + e.getMessage()));
        }
    }

    @PostMapping("/documents/add")
    public ResponseEntity<?> addDocument(@RequestBody Map<String, String> payload, @RequestParam UUID userId) {
        try {
            String type = payload.get("type");
            String fileUrl = payload.get("file_url");

            if (type == null || type.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Тип документа обов'язковий"));
            }
            if (fileUrl == null || fileUrl.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "URL файлу обов'язковий"));
            }

            documentDAO.addDocument(userId, type, fileUrl);
            return ResponseEntity.ok(Map.of("message", "Документ додано до БД"));
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Помилка БД: " + e.getMessage()));
        }
    }

    @DeleteMapping("/documents/delete")
    public ResponseEntity<?> deleteDocument(@RequestParam String docId) {
        try {
            documentDAO.deleteDocument(UUID.fromString(docId));
            return ResponseEntity.ok(Map.of("message", "Документ видалено з БД"));
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Помилка: " + e.getMessage()));
        }
    }

    @PutMapping("/update-phone")
    public ResponseEntity<?> updatePhone(@RequestBody Map<String, String> payload) {
        try {
            String userIdStr = payload.get("id");
            String newPhone = payload.get("phone_number");

            if (userIdStr == null || newPhone == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Неповні дані"));
            }

            UUID userId = UUID.fromString(userIdStr);
            Optional<User> userOpt = userDAO.findById(userId);

            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Користувача не знайдено"));
            }

            User user = userOpt.get();
            user.setPhone_number(newPhone);
            userDAO.updateUser(user);

            return ResponseEntity.ok(Map.of("message", "Телефон оновлено в БД"));
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Помилка: " + e.getMessage()));
        }
    }
}