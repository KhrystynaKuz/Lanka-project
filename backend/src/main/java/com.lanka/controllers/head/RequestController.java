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
@CrossOrigin(origins = "http://localhost:3000")
public class RequestController {

    private final RequestDAO requestDAO;

    public RequestController(RequestDAO requestDAO) {
        this.requestDAO = requestDAO;
    }

    // 1. Отримати всі заявки
    @GetMapping
    public ResponseEntity<List<Request>> getAll() {
        try {
            return ResponseEntity.ok(requestDAO.getAllRequests());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // 2. Пошук по назві (неповний збіг)
    @GetMapping("/search")
    public ResponseEntity<List<Request>> search(@RequestParam String title) {
        try {
            return ResponseEntity.ok(requestDAO.searchByTitle(title));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // 3. Отримати тільки PENDING
    @GetMapping("/pending")
    public ResponseEntity<List<Request>> getPending() {
        try {
            return ResponseEntity.ok(requestDAO.getPendingRequests());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // 4. Зміна статусу
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {

        try {
            RequestStatus status = RequestStatus.valueOf(body.get("status"));

            requestDAO.updateStatus(id, status.name());

            return ResponseEntity.ok(Map.of(
                    "message", "updated",
                    "id", id,
                    "status", status
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}