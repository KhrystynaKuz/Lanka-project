package com.lanka.controllers;

import com.lanka.dao.DocumentDAO;
import com.lanka.dao.UserDAO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.SQLException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "http://localhost:5173")
public class EditDocumentsController {

    @Autowired
    private DocumentDAO documentDAO;

    @Autowired
    private UserDAO userDAO;

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