package com.lanka.controllers.head;

import com.lanka.dao.DepartmentDAO;
import com.lanka.dao.DocumentDAO;
import com.lanka.dao.UserDAO;
import com.lanka.dao.UserDepartmentDAO;
import com.lanka.database.DatabaseConfig;
import com.lanka.models.Department;
import com.lanka.models.User;
import com.lanka.models.UserDepartment;
import com.lanka.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/management")
@CrossOrigin(origins = "http://localhost:5173", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class ManagementController {

    @Autowired
    private EmailService emailService;

    private final DepartmentDAO departmentDAO = new DepartmentDAO();
    private final UserDAO userDAO = new UserDAO();
    private final UserDepartmentDAO userDepartmentDAO = new UserDepartmentDAO();
    private final DocumentDAO documentDAO = new DocumentDAO();

    @GetMapping("/departments")
    public ResponseEntity<?> getDepartments() {
        try {
            return ResponseEntity.ok(departmentDAO.getAllDepartments());
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

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

    @GetMapping("/departments/{deptId}/volunteers")
    public ResponseEntity<?> getVolunteersByDepartment(@PathVariable UUID deptId) {
        try {
            var userDepts = userDepartmentDAO.getUsersByDepartmentId(deptId);
            List<User> volunteers = userDepts.stream()
                    .map(ud -> {
                        try { return userDAO.findById(ud.getUser_id()).orElse(null); }
                        catch (SQLException e) { return null; }
                    })
                    .filter(u -> u != null && u.isIs_verified())
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
            List<User> allVolunteers = userDAO.getVolunteersAndCoordinators();

            List<User> verifiedVolunteers = allVolunteers.stream()
                    .filter(user -> Boolean.TRUE.equals(user.isIs_verified()))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(verifiedVolunteers);
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @DeleteMapping("/volunteers/{id}")
    public ResponseEntity<?> deleteVolunteer(@PathVariable UUID id) {
        try {
            userDAO.deleteUser(id);
            return ResponseEntity.ok("Волонтера успішно видалено");
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

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
            List<User> allCustomers = userDAO.getCustomers();

            List<User> verifiedCustomers = allCustomers.stream()
                    .filter(user -> Boolean.TRUE.equals(user.isIs_verified()))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(verifiedCustomers);
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

    @GetMapping("/volunteers/pending")
    public ResponseEntity<?> getPendingUsers() {
        try {
            List<User> pendingUsers = userDAO.getUnverifiedUsers();

            List<Map<String, Object>> result = pendingUsers.stream().map(user -> {
                Map<String, Object> map = new HashMap<>();
                map.put("user", user);

                if (User.UserRole.VOLUNTEER.equals(user.getRole())) {
                    String sql = "SELECT department_id FROM user_details WHERE id = ?";
                    try (Connection conn = DatabaseConfig.getConnection();
                         PreparedStatement ps = conn.prepareStatement(sql)) {

                        ps.setObject(1, user.getId());
                        try (ResultSet rs = ps.executeQuery()) {
                            if (rs.next()) {
                                map.put("department_id", (UUID) rs.getObject("department_id"));
                            } else {
                                map.put("department_id", null);
                            }
                        }
                    } catch (Exception e) {
                        map.put("department_id", null);
                    }
                }
                return map;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/documents/{userId}")
    public ResponseEntity<?> getDocuments(@PathVariable UUID userId) {
        try {
            return ResponseEntity.ok(documentDAO.getUserDocuments(userId));
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @PostMapping("/documents/status")
    public ResponseEntity<?> updateDocStatus(@RequestBody Map<String, String> payload) {
        try {
            UUID docId = UUID.fromString(payload.get("docId"));
            String status = payload.get("status");
            String reason = payload.get("reason");

            documentDAO.updateDocumentStatus(docId, status, reason);

            if ("APPROVED".equals(status)) {
                UUID userId = documentDAO.getUserIdByDocId(docId);
                boolean allApproved = documentDAO.areAllDocumentsApproved(userId);

                if (allApproved) {
                    userDAO.updateVerificationStatus(userId, true);

                    User user = userDAO.findById(userId)
                            .orElseThrow(() -> new RuntimeException("Користувача не знайдено"));

                    String targetEmail = getTargetEmail(user.getEmail());

                    emailService.sendWelcomeEmail(targetEmail);
                }
            }

            return ResponseEntity.ok("Статус оновлено");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    private String getTargetEmail(String originalEmail) {
        if (originalEmail != null && originalEmail.endsWith("@lanka.com")) {
            return "christinakuz14@gmail.com";
        }
        return originalEmail;
    }

    @PostMapping("/documents/reject")
    public ResponseEntity<?> rejectDocument(@RequestBody Map<String, String> payload) {
        try {
            System.out.println("Отримано запит на відхилення: " + payload);
            UUID docId = UUID.fromString(payload.get("docId"));
            String reason = payload.get("reason");
            UUID userId = UUID.fromString(payload.get("userId"));

            User user = userDAO.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Користувача не знайдено"));

            String targetEmail = getTargetEmail(user.getEmail());
            emailService.sendRejectionEmail(targetEmail, reason);

            documentDAO.updateDocumentStatus(docId, "REJECTED", reason);

            userDAO.updateVerificationStatus(userId, false);

            return ResponseEntity.ok("Повідомлення відправлено на: " + targetEmail + ", статус користувача оновлено.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @PostMapping("/documents/reject-verified")
    public ResponseEntity<?> rejectDocumentForVerifiedUser(@RequestBody Map<String, String> payload) {
        try {
            UUID docId = UUID.fromString(payload.get("docId"));
            String reason = payload.get("reason");
            UUID userId = UUID.fromString(payload.get("userId"));

            User user = userDAO.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Користувача не знайдено"));
            String targetEmail = getTargetEmail(user.getEmail());

            emailService.sendRejectionEmail(targetEmail, reason);

            documentDAO.updateDocumentStatus(docId, "REJECTED", reason);

            documentDAO.deleteRejectedDocuments(userId);

            return ResponseEntity.ok("Документ відхилено, статус верифікації збережено.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/documents/pending-all")
    public ResponseEntity<?> getAllPendingDocuments() {
        try {
            String sql = "SELECT d.id, d.type, d.file_url, d.user_id, u.first_name, u.last_name " +
                    "FROM user_documents d " +
                    "JOIN users u ON d.user_id = u.id " +
                    "WHERE d.status = 'PENDING' AND u.is_verified = true";

            List<Map<String, Object>> pendingDocs = new ArrayList<>();

            try (Connection conn = DatabaseConfig.getConnection();
                 PreparedStatement ps = conn.prepareStatement(sql);
                 ResultSet rs = ps.executeQuery()) {

                while (rs.next()) {
                    Map<String, Object> doc = new HashMap<>();
                    doc.put("id", rs.getObject("id"));
                    doc.put("title", rs.getString("type"));
                    doc.put("file_url", rs.getString("file_url"));
                    doc.put("user_id", rs.getObject("user_id"));
                    doc.put("user_name", (rs.getString("first_name") != null ? rs.getString("first_name") : "") + " " +
                            (rs.getString("last_name") != null ? rs.getString("last_name") : ""));
                    pendingDocs.add(doc);
                }
            }
            return ResponseEntity.ok(pendingDocs);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Помилка БД: " + e.getMessage());
        }
    }
}