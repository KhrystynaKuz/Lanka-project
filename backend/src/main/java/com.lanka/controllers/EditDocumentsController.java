package com.lanka.controllers;

import com.lanka.dao.DocumentDAO;
import com.lanka.dao.UserDAO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.SQLException;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for handling document editing and verification retries.
 */
@RestController
@RequestMapping("/api/documents")
@CrossOrigin(originPatterns = "*")
public class EditDocumentsController {

    @Autowired
    private DocumentDAO documentDAO;

    @Autowired
    private UserDAO userDAO;

    /**
     * Retrieves the details regarding a document rejection for a specific user.
     *
     * @param userId The UUID of the user whose rejection details are being requested.
     * @return A ResponseEntity containing a map with the "rejection_reason".
     * @throws SQLException If a database error occurs.
     */
    @GetMapping("/rejection-info/{userId}")
    public ResponseEntity<?> getRejectionInfo(@PathVariable UUID userId) throws SQLException {
        System.out.println("Запит до БД для користувача: " + userId);
        Map<String, Object> details = documentDAO.getRejectionDetails(userId);
        if (details == null) {
            System.out.println("Запис у БД не знайдено!");
            return ResponseEntity.ok(Map.of("rejection_reason", "Причину не вказано (тестовий режим)"));
        }
        return ResponseEntity.ok(details);
    }

    /**
     * Allows a user to retry uploading their verification documents after a rejection.
     * Clears rejected documents and resets the user's verification status.
     *
     * @param payload A map containing the "userId".
     * @return A ResponseEntity containing a success message, or a 500 error if the process fails.
     */
    @PostMapping("/upload-retry")
    public ResponseEntity<?> retryUpload(@RequestBody Map<String, Object> payload) {
        try {
            UUID userId = UUID.fromString(payload.get("userId").toString());

            documentDAO.deleteRejectedDocuments(userId);

            userDAO.updateVerificationStatus(userId, null);

            return ResponseEntity.ok("Нові документи надіслано на повторну перевірку!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Помилка: " + e.getMessage());
        }
    }
}