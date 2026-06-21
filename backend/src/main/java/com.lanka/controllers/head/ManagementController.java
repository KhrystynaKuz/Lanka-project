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
import com.lanka.dao.ReportDAO;
import com.lanka.models.ReportDTO;
import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDate;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * REST controller for high-level organizational management.
 * Provides endpoints to manage departments, users (volunteers, coordinators, customers), documents, and reporting.
 */
@RestController
@RequestMapping("/api/management")
@CrossOrigin(originPatterns = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class ManagementController {

    @Autowired
    private EmailService emailService;

    private final DepartmentDAO departmentDAO = new DepartmentDAO();
    private final UserDAO userDAO = new UserDAO();
    private final UserDepartmentDAO userDepartmentDAO = new UserDepartmentDAO();
    private final DocumentDAO documentDAO = new DocumentDAO();
    private final ReportDAO reportDAO = new ReportDAO();

    /**
     * Retrieves a list of all departments.
     *
     * @return a {@link ResponseEntity} containing department data
     */
    @GetMapping("/departments")
    public ResponseEntity<?> getDepartments() {
        try {
            return ResponseEntity.ok(departmentDAO.getAllDepartments());
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    /**
     * Adds a new department to the system.
     * Generates a new UUID if one is not provided.
     *
     * @param dept the {@link Department} to add
     * @return a {@link ResponseEntity} containing the saved department
     */
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

    /**
     * Retrieves all verified volunteers associated with a specific department ID.
     *
     * @param deptId the UUID of the department
     * @return a {@link ResponseEntity} containing a list of verified {@link User} volunteers
     */
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

    /**
     * Assigns a user as the coordinator for a given department.
     * Updates previous coordinator roles back to volunteer if necessary.
     *
     * @param deptId     the UUID of the department
     * @param newCoordId the UUID of the user to be appointed as coordinator
     * @return a {@link ResponseEntity} detailing the outcome
     */
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

    /**
     * Retrieves the UUID of the current coordinator for a specific department.
     *
     * @param deptId the UUID of the department
     * @return a {@link ResponseEntity} containing the coordinator's UUID or an empty string
     */
    @GetMapping("/departments/{deptId}/coordinator")
    public ResponseEntity<?> getCoordinator(@PathVariable UUID deptId) {
        try {
            UUID coordId = userDepartmentDAO.findCoordinatorByDeptId(deptId);
            return ResponseEntity.ok(coordId != null ? coordId : "");
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    /**
     * Updates department details and optionally changes its assigned coordinator in a single operation.
     *
     * @param dept             the updated {@link Department} details
     * @param newCoordinatorId the UUID of the new coordinator (optional)
     * @param oldCoordinatorId the UUID of the previous coordinator to demote (optional)
     * @return a {@link ResponseEntity} confirming the update
     */
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

    /**
     * Updates the basic details of a department.
     *
     * @param dept the updated {@link Department} object
     * @return a {@link ResponseEntity} detailing the success of the operation
     */
    @PostMapping("/departments/update")
    public ResponseEntity<?> updateDepartment(@RequestBody Department dept) {
        try {
            departmentDAO.updateDepartment(dept);
            return ResponseEntity.ok("Відділ успішно оновлено");
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    /**
     * Deletes a department from the system.
     *
     * @param id the UUID of the department to delete
     * @return a {@link ResponseEntity} detailing the outcome
     */
    @DeleteMapping("/departments/{id}")
    public ResponseEntity<?> deleteDepartment(@PathVariable UUID id) {
        try {
            departmentDAO.deleteDepartment(id);
            return ResponseEntity.ok("Відділ успішно видалено");
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    /**
     * Retrieves all verified volunteers across the entire system.
     *
     * @return a {@link ResponseEntity} containing a list of verified volunteers
     */
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

    /**
     * Deletes a volunteer from the system based on their UUID.
     *
     * @param id the UUID of the volunteer
     * @return a {@link ResponseEntity} confirming deletion
     */
    @DeleteMapping("/volunteers/{id}")
    public ResponseEntity<?> deleteVolunteer(@PathVariable UUID id) {
        try {
            userDAO.deleteUser(id);
            return ResponseEntity.ok("Волонтера успішно видалено");
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    /**
     * Updates the profile information of a volunteer user.
     *
     * @param user the updated {@link User} object
     * @return a {@link ResponseEntity} indicating success or failure
     */
    @PostMapping("/volunteers/update")
    public ResponseEntity<?> updateVolunteer(@RequestBody User user) {
        try {
            boolean updated = userDAO.updateUser(user);
            return updated ? ResponseEntity.ok("Оновлено") : ResponseEntity.badRequest().body("Не знайдено");
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    /**
     * Assigns a volunteer to a specific department.
     *
     * @param deptId the UUID of the target department
     * @param userId the UUID of the volunteer to add
     * @return a {@link ResponseEntity} confirming the assignment
     */
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

    /**
     * Removes a volunteer assignment from a specific department.
     *
     * @param deptId the UUID of the department
     * @param userId the UUID of the volunteer to remove
     * @return a {@link ResponseEntity} confirming the removal
     */
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

    /**
     * Retrieves detailed profile and document information for a specific volunteer.
     *
     * @param userId the UUID of the volunteer
     * @return a {@link ResponseEntity} with the volunteer details payload
     */
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

    /**
     * Retrieves all verified customers registered in the system.
     *
     * @return a {@link ResponseEntity} containing a list of verified customer users
     */
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

    /**
     * Retrieves detailed profile and document information for a specific customer.
     *
     * @param userId the UUID of the customer
     * @return a {@link ResponseEntity} with the customer details payload
     */
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

    /**
     * Retrieves a list of users pending verification, including their potential department assignments.
     *
     * @return a {@link ResponseEntity} containing a list of pending users mapped with department info
     */
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

    /**
     * Retrieves all documents associated with a particular user.
     *
     * @param userId the UUID of the user
     * @return a {@link ResponseEntity} containing the user's documents
     */
    @GetMapping("/documents/{userId}")
    public ResponseEntity<?> getDocuments(@PathVariable UUID userId) {
        try {
            return ResponseEntity.ok(documentDAO.getUserDocuments(userId));
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    /**
     * Updates the status of a submitted document. Automatically verifies the user
     * and sends a welcome email if all required documents are approved.
     *
     * @param payload a map containing 'docId', 'status', and an optional 'reason'
     * @return a {@link ResponseEntity} confirming the status update
     */
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

    /**
     * Determines the target email address for sending system notifications.
     * Implements a fallback domain mapping for internal system routing.
     *
     * @param originalEmail the user's registered email
     * @return the resolved email address to send notifications to
     */
    private String getTargetEmail(String originalEmail) {
        if (originalEmail != null && originalEmail.endsWith("@lanka.com")) {
            return "christinakuz14@gmail.com";
        }
        return originalEmail;
    }

    /**
     * Rejects a user's document during the initial verification process.
     * Flags the user as unverified and sends a rejection notice via email.
     *
     * @param payload a map containing 'docId', 'reason', and 'userId'
     * @return a {@link ResponseEntity} detailing the outcome
     */
    @PostMapping("/documents/reject")
    public ResponseEntity<?> rejectDocument(@RequestBody Map<String, String> payload) {
        try {
            System.out.println("Отримано запит на відхилення: " + payload);
            UUID docId = UUID.fromString(payload.get("docId"));
            String reason = payload.get("reason");
            UUID userId = UUID.fromString(payload.get("userId"));

            documentDAO.updateDocumentStatus(docId, "REJECTED", reason);
            userDAO.updateVerificationStatus(userId, false);

            User user = userDAO.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Користувача не знайдено"));

            String targetEmail = getTargetEmail(user.getEmail());
            emailService.sendRejectionEmail(targetEmail, reason);

            return ResponseEntity.ok("Повідомлення відправлено на: " + targetEmail + ", статус користувача оновлено.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    /**
     * Generates analytical reports based on a date range and optional department filter.
     *
     * @param startDate    the start date for the report query
     * @param endDate      the end date for the report query
     * @param departmentId the UUID of the department to filter by (optional)
     * @return a {@link ResponseEntity} containing generated report DTOs
     */
    @GetMapping("/reports")
    public ResponseEntity<?> getGeneratedReports(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) UUID departmentId) {
        try {
            List<ReportDTO> reports = reportDAO.getGeneratedReportsData(startDate, endDate, departmentId);
            return ResponseEntity.ok(reports);
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Помилка генерації звіту: " + e.getMessage());
        }
    }

    /**
     * Rejects a document submission for a user who is already verified.
     * Preserves the user's verification status while rejecting the specific payload.
     *
     * @param payload a map containing 'docId', 'reason', and 'userId'
     * @return a {@link ResponseEntity} confirming document rejection without impacting user status
     */
    @PostMapping("/documents/reject-verified")
    public ResponseEntity<?> rejectDocumentForVerifiedUser(@RequestBody Map<String, String> payload) {
        try {
            UUID docId = UUID.fromString(payload.get("docId"));
            String reason = payload.get("reason");
            UUID userId = UUID.fromString(payload.get("userId"));

            documentDAO.updateDocumentStatus(docId, "REJECTED", reason);
            documentDAO.deleteRejectedDocuments(userId);

            User user = userDAO.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Користувача не знайдено"));
            String targetEmail = getTargetEmail(user.getEmail());

            emailService.sendRejectionEmail(targetEmail, reason);

            return ResponseEntity.ok("Документ відхилено, статус верифікації збережено.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    /**
     * Retrieves all pending documents submitted by users who are already verified.
     * Useful for auditing supplemental documents uploaded after initial onboarding.
     *
     * @return a {@link ResponseEntity} containing a list of pending documents and user info
     */
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

    /**
     * Retrieves a list of available, verified volunteers who are not currently assigned to the specified department.
     *
     * @param deptId the UUID of the department
     * @return a {@link ResponseEntity} containing a list of eligible volunteers
     */
    @GetMapping("/departments/{deptId}/volunteers/available")
    public ResponseEntity<?> getAvailableVolunteersForDept(@PathVariable UUID deptId) {
        try {
            String sql = "SELECT u.* FROM users u " +
                    "WHERE u.role = 'VOLUNTEER' " +
                    "AND u.is_verified = true " +
                    "AND u.id NOT IN (SELECT user_id FROM user_departments WHERE department_id = ?)";

            List<User> availableVolunteers = new ArrayList<>();

            try (Connection conn = DatabaseConfig.getConnection();
                 PreparedStatement ps = conn.prepareStatement(sql)) {

                ps.setObject(1, deptId);

                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        User user = new User();
                        user.setId((UUID) rs.getObject("id"));
                        user.setFirst_name(rs.getString("first_name"));
                        user.setLast_name(rs.getString("last_name"));
                        user.setEmail(rs.getString("email"));
                        availableVolunteers.add(user);
                    }
                }
            }
            return ResponseEntity.ok(availableVolunteers);
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Помилка БД: " + e.getMessage());
        }
    }
}