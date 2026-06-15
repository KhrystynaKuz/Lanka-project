package com.lanka.controllers;

import com.lanka.dao.DocumentDAO;
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
        UUID userId = UUID.fromString(payload.get("userId").toString());
        try {
            documentDAO.resetDocumentsToPending(userId);
            return ResponseEntity.ok("Документи успішно відправлені!");
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body("Помилка БД");
        }
    }
}