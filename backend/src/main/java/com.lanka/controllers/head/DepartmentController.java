package com.lanka.controllers.head;

import com.lanka.dao.DepartmentDAO;
import com.lanka.dao.RequestDAO;
import com.lanka.models.Department;
import com.lanka.models.Request;
import com.lanka.models.User; // Ensure this is imported!
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/departments")
@CrossOrigin(originPatterns = "http://localhost:*")
public class DepartmentController {

    private final DepartmentDAO departmentDAO;
    private final RequestDAO requestDAO; // Added to handle request fetches

    public DepartmentController(DepartmentDAO departmentDAO, RequestDAO requestDAO) {
        this.departmentDAO = departmentDAO;
        this.requestDAO = requestDAO;
    }

    @GetMapping
    public ResponseEntity<List<Department>> getAllDepartments() {
        try {
            return ResponseEntity.ok(departmentDAO.getAllDepartments());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

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