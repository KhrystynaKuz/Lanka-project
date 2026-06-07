package com.lanka.controllers.customer;

import com.lanka.dao.RequestDAO;
import com.lanka.models.Request;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.SQLException;
import java.util.List;
import java.util.UUID;

@RestController("customerRequestController")
@RequestMapping("/api/requests")
@CrossOrigin(origins = "http://localhost:5173")
public class RequestController {

    private final RequestDAO requestDAO;

    @Autowired
    public RequestController(RequestDAO requestDAO) {
        this.requestDAO = requestDAO;
    }

    @PostMapping("/create")
    public ResponseEntity<?> createRequest(@RequestBody RequestDTO dto) {
        if (dto.getTitle() == null || dto.getTitle().trim().isEmpty() ||
                dto.getDescription() == null || dto.getDescription().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Назва та опис є обов'язковими полями.");
        }

        try {
            Request request = new Request();

            if (dto.getCustomerId() != null && !dto.getCustomerId().trim().isEmpty()) {
                request.setCustomer_id(UUID.fromString(dto.getCustomerId()));
            } else {
                return ResponseEntity.badRequest().body("Помилка: customerId не може бути порожнім.");
            }

            request.setTitle(dto.getTitle());

            String fullDescription = "[Категорія: " + dto.getCategory() + "] " + dto.getDescription();
            request.setDescription(fullDescription);

            int reqPriority = dto.getPriority() > 0 ? dto.getPriority() : 1;
            request.setPriority(reqPriority);

            requestDAO.addRequest(request);

            return ResponseEntity.status(HttpStatus.CREATED).body(request);
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Помилка бази даних при створенні заявки: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Некоректний формат UUID для Customer ID.");
        }
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<?> getCustomerRequests(@PathVariable String customerId) {
        try {
            UUID uuid = UUID.fromString(customerId);
            List<Request> requests = requestDAO.getRequestsByCustomerId(uuid);
            return ResponseEntity.ok(requests);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Некоректний формат UUID користувача.");
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Помилка бази даних при отриманні заявок: " + e.getMessage());
        }
    }

    @DeleteMapping("/delete/{requestId}")
    public ResponseEntity<?> deleteRequest(@PathVariable String requestId) {
        try {
            UUID uuid = UUID.fromString(requestId);
            requestDAO.deleteRequest(uuid);
            return ResponseEntity.ok("Заявку успішно видалено/скасовано.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Некоректний формат UUID заявки.");
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Помилка бази даних при видаленні заявки: " + e.getMessage());
        }
    }

    public static class RequestDTO {
        private String customerId;
        private String title;
        private String category;
        private String description;
        private int priority;

        public String getCustomerId() { return customerId; }
        public void setCustomerId(String customerId) { this.customerId = customerId; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public int getPriority() { return priority; }
        public void setPriority(int priority) { this.priority = priority; } // Сеттер
    }
}