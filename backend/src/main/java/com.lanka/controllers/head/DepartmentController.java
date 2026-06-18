package com.lanka.controllers.head;

import com.lanka.dao.DepartmentDAO;
import com.lanka.dao.RequestDAO;
import com.lanka.models.Department;
import com.lanka.models.Request;
import com.lanka.models.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for retrieving department information and associations for the head coordinators.
 */
@RestController
@RequestMapping("/api/departments")
@CrossOrigin(originPatterns = "*")
public class DepartmentController {

    private final DepartmentDAO departmentDAO;
    private final RequestDAO requestDAO;

    /**
     * Constructs a new {@code DepartmentController}.
     *
     * @param departmentDAO the DAO for department operations
     * @param requestDAO    the DAO for request operations
     */
    public DepartmentController(DepartmentDAO departmentDAO, RequestDAO requestDAO) {
        this.departmentDAO = departmentDAO;
        this.requestDAO = requestDAO;
    }

    /**
     * Retrieves a list of all active departments.
     *
     * @return a {@link ResponseEntity} containing a list of {@link Department} objects
     */
    @GetMapping
    public ResponseEntity<List<Department>> getAllDepartments() {
        try {
            return ResponseEntity.ok(departmentDAO.getAllDepartments());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Retrieves all volunteers assigned to a specific coordinator's department.
     *
     * @param userId the UUID of the coordinator
     * @return a {@link ResponseEntity} containing a list of {@link User} volunteers
     */
    @GetMapping("/coordinator/{userId}/volunteers")
    public ResponseEntity<?> getDepartmentVolunteers(@PathVariable UUID userId) {
        try {
            List<User> volunteers = departmentDAO.getVolunteersByCoordinatorId(userId);
            return ResponseEntity.ok(volunteers);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Retrieves all requests applicable to a specific coordinator's department.
     *
     * @param userId the UUID of the coordinator
     * @return a {@link ResponseEntity} containing a list of relevant {@link Request} objects
     */
    @GetMapping("/coordinator/{userId}/requests")
    public ResponseEntity<?> getRequestsForCoordinator(@PathVariable UUID userId) {
        try {
            List<Request> requests = requestDAO.getRequestsByCoordinatorDepartment(userId);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}