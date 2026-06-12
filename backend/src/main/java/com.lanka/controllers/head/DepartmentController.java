package com.lanka.controllers.head;

import com.lanka.dao.DepartmentDAO;
import com.lanka.models.Department;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
@CrossOrigin(originPatterns = "http://localhost:*")
public class DepartmentController {

    private final DepartmentDAO departmentDAO;

    public DepartmentController(DepartmentDAO departmentDAO) {
        this.departmentDAO = departmentDAO;
    }

    @GetMapping
    public ResponseEntity<List<Department>> getAllDepartments() {
        try {
            return ResponseEntity.ok(departmentDAO.getAllDepartments());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}