package com.lanka.controllers.head;

import com.lanka.dao.RequestDAO;
import com.lanka.models.Request;
import com.lanka.models.Request.RequestStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/requests")
@CrossOrigin(originPatterns = "http://localhost:*")
public class RequestController {

    private final RequestDAO requestDAO;

    public RequestController(RequestDAO requestDAO) {
        this.requestDAO = requestDAO;
    }

    // 1. Отримати всі заявки (для історії)
    @GetMapping
    public ResponseEntity<List<Request>> getAll() {
        try {
            return ResponseEntity.ok(requestDAO.getAllRequests());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // 2. ЕНДПОІНТ ДЛЯ СТАТИСТИКИ (Додано, щоб фронтенд не падав)

    // 3. Пошук по назві
    @GetMapping("/search")
    public ResponseEntity<List<Request>> search(@RequestParam String title) {
        try {
            return ResponseEntity.ok(requestDAO.searchByTitle(title));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // 4. Отримати тільки PENDING
    @GetMapping("/pending")
    public ResponseEntity<List<Request>> getPending() {
        try {
            return ResponseEntity.ok(requestDAO.getPendingRequests());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {

        System.out.println("=== ОТРИМАНО PATCH ЗАПИТ ===");
        System.out.println("ID з фронтенду: " + id);
        System.out.println("Статус з фронтенду: " + body.get("status"));

        try {
            String statusStr = body.get("status");
            if (statusStr == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Status field is missing"));
            }

            RequestStatus status = RequestStatus.valueOf(statusStr.toUpperCase());

            requestDAO.updateStatus(id, status.name());

            System.out.println("Успішно оновлено в БД!");
            return ResponseEntity.ok(Map.of(
                    "message", "updated",
                    "id", id,
                    "status", status.name()
            ));

        } catch (IllegalArgumentException e) {
            System.err.println("Помилка валідації статусу: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status value"));
        } catch (Exception e) {
            // ЦЕЙ БЛОК НАДРУКУЄ СПРАВЖНЮ ПОМИЛКУ В КОНСОЛЬ INTELLIJ IDEA!
            System.err.println("КРИТИЧНА ПОМИЛКА ПРИ ОНОВЛЕННІ В БД:");
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}