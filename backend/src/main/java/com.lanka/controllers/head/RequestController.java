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

    // 5. Зміна статусу (ЗАТВЕРДИТИ / ВІДХИЛИТИ)
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {

        try {
            String statusStr = body.get("status");
            if (statusStr == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Status field is missing"));
            }

            RequestStatus status = RequestStatus.valueOf(statusStr.toUpperCase());

            requestDAO.updateStatus(id, status.name());

            return ResponseEntity.ok(Map.of(
                    "message", "updated",
                    "id", id,
                    "status", status.name()
            ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status value"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}