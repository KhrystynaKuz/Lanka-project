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

/**
 * REST controller responsible for handling customer requests.
 * Provides endpoints to create, retrieve, and delete requests made by customers.
 */
@RestController("customerRequestController")
@RequestMapping("/api/requests")
@CrossOrigin(origins = "http://localhost:5173")
public class RequestController {

    private final RequestDAO requestDAO;

    /**
     * Constructs a new {@code RequestController} with the specified data access object.
     *
     * @param requestDAO the data access object for managing requests
     */
    @Autowired
    public RequestController(RequestDAO requestDAO) {
        this.requestDAO = requestDAO;
    }

    /**
     * Creates a new customer request based on the provided Data Transfer Object (DTO).
     * Validates input parameters before interacting with the database.
     *
     * @param dto the {@link RequestDTO} containing the request details
     * @return a {@link ResponseEntity} containing the created {@link Request} or an error message
     */
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

    /**
     * Retrieves all requests submitted by a specific customer.
     *
     * @param customerId the string representation of the customer's UUID
     * @return a {@link ResponseEntity} containing a list of {@link Request} objects or an error message
     */
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

    /**
     * Deletes or cancels a specific request identified by its UUID.
     *
     * @param requestId the string representation of the request's UUID
     * @return a {@link ResponseEntity} indicating the result of the deletion operation
     */
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

    /**
     * Retrieves a single request by its unique identifier.
     *
     * @param requestId the string representation of the request's UUID
     * @return a {@link ResponseEntity} containing the {@link Request} or a not found status
     */
    @GetMapping("/{requestId}")
    public ResponseEntity<?> getRequestById(@PathVariable String requestId) {
        try {
            UUID uuid = UUID.fromString(requestId);
            Request request = requestDAO.getRequestById(uuid);

            if (request != null) {
                return ResponseEntity.ok(request);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Заявку не знайдено.");
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Некоректний формат UUID заявки.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Помилка сервера: " + e.getMessage());
        }
    }

    /**
     * Data Transfer Object for handling incoming request creation payloads.
     */
    public static class RequestDTO {
        private String customerId;
        private String title;
        private String category;
        private String description;
        private int priority;

        /**
         * @return the customer ID string
         */
        public String getCustomerId() { return customerId; }

        /**
         * @param customerId the customer ID string to set
         */
        public void setCustomerId(String customerId) { this.customerId = customerId; }

        /**
         * @return the request title
         */
        public String getTitle() { return title; }

        /**
         * @param title the request title to set
         */
        public void setTitle(String title) { this.title = title; }

        /**
         * @return the request category
         */
        public String getCategory() { return category; }

        /**
         * @param category the request category to set
         */
        public void setCategory(String category) { this.category = category; }

        /**
         * @return the request description
         */
        public String getDescription() { return description; }

        /**
         * @param description the request description to set
         */
        public void setDescription(String description) { this.description = description; }

        /**
         * @return the priority level of the request
         */
        public int getPriority() { return priority; }

        /**
         * @param priority the priority level to set
         */
        public void setPriority(int priority) { this.priority = priority; }
    }
}