package com.lanka.controllers.head;

import com.lanka.dao.UserDAO;
import com.lanka.dao.DocumentDAO;
import com.lanka.models.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.sql.SQLException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

/**
 * REST controller for managing individual user profiles and user document uploads.
 */
@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = {"*"},
        allowCredentials = "true",
        allowedHeaders = "*",
        methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class ProfileController {

    private final UserDAO userDAO;
    private final DocumentDAO documentDAO;

    @Value("${supabase.service-role-key}")
    private String serviceRoleKey;

    /**
     * Constructs a new {@code ProfileController} initializing necessary DAOs.
     */
    public ProfileController() {
        this.userDAO = new UserDAO();
        this.documentDAO = new DocumentDAO();
    }

    /**
     * Retrieves comprehensive profile information and associated documents for a given user ID.
     *
     * @param userId the UUID of the user
     * @return a {@link ResponseEntity} containing a structured map of the user's data
     */
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
            response.put("dob", user.getDob() != null ? user.getDob().toString() : null);
            response.put("created_at", user.getCreated_at());

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

    /**
     * Retrieves a list of documents uploaded by a specific user.
     *
     * @param userId the UUID of the user
     * @return a {@link ResponseEntity} containing the user's document metadata
     */
    @GetMapping("/documents")
    public ResponseEntity<?> getUserDocuments(@RequestParam UUID userId) {
        try {
            List<Map<String, String>> docs = documentDAO.getUserDocuments(userId);
            return ResponseEntity.ok(docs);
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Registers a new document URL to a user's profile within the database.
     *
     * @param payload a map containing 'type' and 'file_url' of the document
     * @param userId  the UUID of the user owning the document
     * @return a {@link ResponseEntity} indicating success or missing fields
     */
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

    /**
     * Deletes a specific document record from the database.
     *
     * @param docId the string representation of the document's UUID
     * @return a {@link ResponseEntity} confirming deletion
     */
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

    /**
     * Updates specific details (phone, patronymic, date of birth) for a user profile.
     *
     * @param payload a map containing 'id', and optionally 'phone_number', 'patronymic', and 'dob'
     * @return a {@link ResponseEntity} detailing the outcome of the update
     */
    @PutMapping("/update-details")
    public ResponseEntity<?> updateProfileDetails(@RequestBody Map<String, String> payload) {
        try {
            System.out.println("Отримано запит на оновлення: " + payload);

            String userIdStr = payload.get("id");
            String newPhone = payload.get("phone_number");
            String newPatronymic = payload.get("patronymic");
            String newDobStr = payload.get("dob");

            if (userIdStr == null || userIdStr.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "ID користувача обов'язковий"));
            }

            UUID userId;
            try {
                userId = UUID.fromString(userIdStr);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Некоректний формат ID"));
            }

            Optional<User> userOpt = userDAO.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Користувача не знайдено"));
            }

            User user = userOpt.get();

            if (newPhone != null && !newPhone.trim().isEmpty()) {
                user.setPhone_number(newPhone);
            } else {
                user.setPhone_number(null);
            }

            if (newPatronymic != null && !newPatronymic.trim().isEmpty()) {
                user.setPatronymic(newPatronymic);
            } else {
                user.setPatronymic(null);
            }

            if (newDobStr != null && !newDobStr.trim().isEmpty()) {
                try {
                    java.time.LocalDate dob = java.time.LocalDate.parse(newDobStr);
                    user.setDob(dob);
                } catch (java.time.format.DateTimeParseException e) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Некоректний формат дати. Використовуйте YYYY-MM-DD"));
                }
            } else {
                user.setDob(null);
            }

            boolean updated = userDAO.updateUser(user);

            if (updated) {
                System.out.println("Користувача успішно оновлено: " + userId);
                return ResponseEntity.ok(Map.of(
                        "message", "Профіль успішно оновлено в БД",
                        "success", true
                ));
            } else {
                return ResponseEntity.internalServerError().body(Map.of("error", "Не вдалося оновити користувача"));
            }

        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Помилка БД: " + e.getMessage()));
        }
    }


    @PostMapping("/registration/documents/upload")
    public ResponseEntity<?> uploadDocument(
            @RequestParam("userId") UUID userId,
            @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Файл порожній"));
        }

        try {
            String originalName = file.getOriginalFilename();
            String sanitizedName = (originalName != null) ? originalName.replaceAll("\\s+", "_") : "document.png";

            String bucketName = "user-documents";
            String fileName = userId.toString() + "/" + sanitizedName;

            String supabaseUrl = "https://dxgywtqqzpyrueostjdy.supabase.co/storage/v1/object/" + bucketName + "/" + fileName;

            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("apikey", serviceRoleKey);
            headers.set("Authorization", "Bearer " + serviceRoleKey);

            String contentType = file.getContentType();
            headers.setContentType(MediaType.parseMediaType(contentType != null ? contentType : "application/octet-stream"));

            HttpEntity<byte[]> requestEntity = new HttpEntity<>(file.getBytes(), headers);

            restTemplate.exchange(supabaseUrl, HttpMethod.PUT, requestEntity, String.class);

            String publicUrl = "https://dxgywtqqzpyrueostjdy.supabase.co/storage/v1/object/public/" + bucketName + "/" + fileName;

            documentDAO.addDocument(userId, "IDENTITY_DOC", publicUrl);

            return ResponseEntity.ok(Map.of("message", "Файл успішно завантажено", "url", publicUrl));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Помилка завантаження: " + e.getMessage()));
        }
    }

}