package com.lanka.controllers.head;

import com.lanka.dao.DepartmentDAO;
import com.lanka.dao.DocumentDAO;
import com.lanka.dao.UserDAO;
import com.lanka.dao.UserDepartmentDAO;
import com.lanka.models.Department;
import com.lanka.models.User;
import com.lanka.models.UserDepartment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.SQLException;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/management")
@CrossOrigin(origins = "http://localhost:5173", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class ManagementController {

    private final DepartmentDAO departmentDAO = new DepartmentDAO();
    private final UserDAO userDAO = new UserDAO();
    private final UserDepartmentDAO userDepartmentDAO = new UserDepartmentDAO();
    private final DocumentDAO documentDAO = new DocumentDAO();


    // Отримати всі відділи
    @GetMapping("/departments")
    public ResponseEntity<?> getDepartments() {
        try {
            return ResponseEntity.ok(departmentDAO.getAllDepartments());
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    // Створити новий відділ
    @PostMapping("/departments/add")
    public ResponseEntity<?> addDepartment(@RequestBody Department dept) {
        try {
            if (dept.getId() == null) {
                dept.setId(UUID.randomUUID());
            }
            departmentDAO.addDepartment(dept);

            return ResponseEntity.ok(dept);
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    // Отримати всіх волонтерів відділу
    @GetMapping("/departments/{deptId}/volunteers")
    public ResponseEntity<?> getVolunteersByDepartment(@PathVariable UUID deptId) {
        try {
            var userDepts = userDepartmentDAO.getUsersByDepartmentId(deptId);
            List<User> volunteers = userDepts.stream()
                    .map(ud -> {
                        try { return userDAO.findById(ud.getUser_id()).orElse(null); }
                        catch (SQLException e) { return null; }
                    })
                    .filter(u -> u != null)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(volunteers);
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @PostMapping("/departments/{deptId}/set-coordinator")
    public ResponseEntity<?> setCoordinator(@PathVariable UUID deptId, @RequestBody UUID newCoordId) {
        try {
            UUID oldCoordId = userDepartmentDAO.findCoordinatorByDeptId(deptId);

            if (oldCoordId != null) {
                userDAO.updateUserRole(oldCoordId, "VOLUNTEER");
            }

            userDAO.updateUserRole(newCoordId, "COORDINATOR");

            userDepartmentDAO.removeAllAssignmentsForUser(newCoordId);

            userDepartmentDAO.addUserToDepartment(newCoordId, deptId);

            return ResponseEntity.ok(Collections.singletonMap("message", "Координатора успішно змінено"));
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/departments/{deptId}/coordinator")
    public ResponseEntity<?> getCoordinator(@PathVariable UUID deptId) {
        try {
            UUID coordId = userDepartmentDAO.findCoordinatorByDeptId(deptId);
            return ResponseEntity.ok(coordId != null ? coordId : "");
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @PostMapping("/departments/save-with-coordinator")
    public ResponseEntity<?> saveDepartmentWithCoordinator(
            @RequestBody Department dept,
            @RequestParam(required = false) UUID newCoordinatorId,
            @RequestParam(required = false) UUID oldCoordinatorId) {
        try {
            departmentDAO.updateDepartment(dept);

            if (newCoordinatorId != null) {
                if (oldCoordinatorId != null && !oldCoordinatorId.equals(newCoordinatorId)) {
                    userDAO.updateRole(oldCoordinatorId, User.UserRole.VOLUNTEER);
                }
                userDAO.updateRole(newCoordinatorId, User.UserRole.COORDINATOR);
            }
            return ResponseEntity.ok("Зміни збережено");
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @PostMapping("/departments/update")
    public ResponseEntity<?> updateDepartment(@RequestBody Department dept) {
        try {
            departmentDAO.updateDepartment(dept);
            return ResponseEntity.ok("Відділ успішно оновлено");
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    // Видалення відділу
    @DeleteMapping("/departments/{id}")
    public ResponseEntity<?> deleteDepartment(@PathVariable UUID id) {
        try {
            departmentDAO.deleteDepartment(id);
            return ResponseEntity.ok("Відділ успішно видалено");
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/volunteers")
    public ResponseEntity<?> getVolunteers() {
        try {
            return ResponseEntity.ok(userDAO.getVolunteersAndCoordinators());
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    // Видалення волонтера
    @DeleteMapping("/volunteers/{id}")
    public ResponseEntity<?> deleteVolunteer(@PathVariable UUID id) {
        try {
            userDAO.deleteUser(id);
            return ResponseEntity.ok("Волонтера успішно видалено");
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    // Оновлення волонтера
    @PostMapping("/volunteers/update")
    public ResponseEntity<?> updateVolunteer(@RequestBody User user) {
        try {
            boolean updated = userDAO.updateUser(user);
            return updated ? ResponseEntity.ok("Оновлено") : ResponseEntity.badRequest().body("Не знайдено");
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @PostMapping("/departments/{deptId}/add-volunteer")
    public ResponseEntity<?> addVolunteerToDept(
            @PathVariable UUID deptId,
            @RequestBody UUID userId) {

        try {
            UserDepartment ud = new UserDepartment();
            ud.setUser_id(userId);
            ud.setDepartment_id(deptId);

            userDepartmentDAO.addUserToDepartment(ud);
            return ResponseEntity.ok("Волонтера успішно додано");
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @DeleteMapping("/departments/{deptId}/remove-volunteer")
    public ResponseEntity<?> removeVolunteer(
            @PathVariable UUID deptId,
            @RequestParam UUID userId) {
        try {
            userDepartmentDAO.removeUserFromDepartment(userId, deptId);
            return ResponseEntity.ok("Волонтера видалено");
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/volunteers/{userId}/details")
    public ResponseEntity<?> getVolunteerDetails(@PathVariable UUID userId) {
        try {
            User user = userDAO.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Волонтера не знайдено"));

            List<Map<String, String>> docs = documentDAO.getUserDocuments(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("user", user);
            response.put("documents", docs);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Помилка: " + e.getMessage());
        }
    }

    @GetMapping("/customers")
    public ResponseEntity<?> getCustomers() {
        try {
            return ResponseEntity.ok(userDAO.getCustomers());
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/customers/{userId}/details")
    public ResponseEntity<?> getCustomerDetails(@PathVariable UUID userId) {
        try {
            User user = userDAO.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Замовника не знайдено"));

            List<Map<String, String>> docs = documentDAO.getUserDocuments(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("user", user);
            response.put("documents", docs);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Помилка: " + e.getMessage());
        }
    }
}