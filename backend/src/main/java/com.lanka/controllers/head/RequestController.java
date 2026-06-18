package com.lanka.controllers.head;

import com.lanka.dao.RequestDAO;
import com.lanka.dao.TaskDAO;
import com.lanka.dao.UserDepartmentDAO;
import com.lanka.models.Request;
import com.lanka.models.Request.RequestStatus;
import com.lanka.models.Task;
import com.lanka.models.Task.TaskStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for managing incoming requests, statistics, and task allocation at the head management level.
 */
@RestController
@RequestMapping("/api/requests")
@CrossOrigin(originPatterns = "*")
public class RequestController {

    private final RequestDAO requestDAO;
    private final TaskDAO taskDAO;
    private final UserDepartmentDAO userDepartmentDAO;

    /**
     * Constructs a new {@code RequestController} and initializes DAOs.
     */
    public RequestController() {
        this.requestDAO = new RequestDAO();
        this.taskDAO = new TaskDAO();
        this.userDepartmentDAO = new UserDepartmentDAO();
    }

    /**
     * Retrieves basic statistics regarding requests, such as the total count of pending requests.
     *
     * @return a {@link ResponseEntity} encapsulating the statistical map
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        try {
            int pendingCount = requestDAO.getPendingCount();
            return ResponseEntity.ok(Map.of("newCount", pendingCount));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Retrieves a list of all requests, mapped with customer name details.
     *
     * @return a {@link ResponseEntity} containing a list of {@link Request} objects
     */
    @GetMapping
    public ResponseEntity<List<Request>> getAll() {
        try {
            List<Request> requests = requestDAO.getAllRequestsWithCustomerName();
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Searches for requests whose title partially matches the provided string.
     *
     * @param title the search query string
     * @return a {@link ResponseEntity} containing matching {@link Request} objects
     */
    @GetMapping("/search")
    public ResponseEntity<List<Request>> search(@RequestParam String title) {
        try {
            return ResponseEntity.ok(requestDAO.searchByTitle(title));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Retrieves a list of all requests currently marked as pending.
     *
     * @return a {@link ResponseEntity} containing pending {@link Request} objects
     */
    @GetMapping("/pending")
    public ResponseEntity<List<Request>> getPending() {
        try {
            return ResponseEntity.ok(requestDAO.getPendingRequestsWithCustomerName());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Updates the status of a specific request. If the request is approved, this method
     * handles the downstream generation of specific {@link Task} entities distributed to
     * target department coordinators.
     *
     * @param id   the UUID string of the request
     * @param body a map containing the new 'status' and an optional list of 'departmentIds'
     * @return a {@link ResponseEntity} confirming the status update
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {

        try {
            String statusStr = (String) body.get("status");
            if (statusStr == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Status field is missing"));
            }

            RequestStatus status = RequestStatus.valueOf(statusStr.toUpperCase());
            requestDAO.updateStatus(id, status.name());

            if (status == RequestStatus.APPROVED) {
                @SuppressWarnings("unchecked")
                List<String> departmentIds = (List<String>) body.get("departmentIds");

                if (departmentIds != null && !departmentIds.isEmpty()) {
                    UUID requestId = UUID.fromString(id);
                    Request request = requestDAO.getRequestById(requestId);

                    for (String deptIdStr : departmentIds) {
                        UUID departmentId = UUID.fromString(deptIdStr);
                        List<UUID> coordinatorIds = userDepartmentDAO.getCoordinatorsByDepartment(departmentId);

                        for (UUID coordinatorId : coordinatorIds) {
                            Task task = new Task();
                            task.setId(UUID.randomUUID());
                            task.setRequest_id(requestId);
                            task.setDepartment_id(departmentId);
                            task.setCoordinator_id(coordinatorId);
                            task.setStatus(TaskStatus.ASSIGNED);
                            task.setTitle(request.getTitle());
                            task.setDescription(request.getDescription());
                            taskDAO.addTask(task);
                        }
                    }
                }
            }

            return ResponseEntity.ok(Map.of(
                    "message", "updated",
                    "id", id,
                    "status", status.name()
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Deletes a request from the database entirely.
     *
     * @param id the UUID string of the request to remove
     * @return a {@link ResponseEntity} confirming the deletion outcome
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRequest(@PathVariable String id) {
        try {
            UUID uuid = UUID.fromString(id);
            requestDAO.deleteRequest(uuid);
            return ResponseEntity.ok(Map.of("message", "Заявка успішно видалена", "id", id));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}