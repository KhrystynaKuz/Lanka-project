package com.lanka.controllers.volunteer;

import com.lanka.dao.DepartmentDAO;
import com.lanka.dao.ReportDAO;
import com.lanka.dao.TaskDAO;
import com.lanka.models.Department;
import com.lanka.models.Report;
import com.lanka.models.Task;
import com.lanka.service.BadgeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "http://localhost:5173")
public class TaskController {

    @Autowired
    private TaskDAO taskDAO;

    @Autowired
    private ReportDAO reportDAO;

    @Autowired
    private DepartmentDAO departmentDAO;

    @Autowired
    private BadgeService badgeService;

    @GetMapping("/volunteer/{volunteerId}")
    public ResponseEntity<List<Task>> getActiveTasks(@PathVariable UUID volunteerId) {
        try {
            return ResponseEntity.ok(taskDAO.getTasksByVolunteerId(volunteerId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/update-status")
    public ResponseEntity<String> updateTaskStatus(@RequestBody Task task) {
        try {
            Task existingTask = taskDAO.getTaskById(task.getId());
            if (existingTask == null) return ResponseEntity.notFound().build();

            existingTask.setStatus(task.getStatus());

            // Set completion date for both Completed and Cancelled statuses for the Archive Tab
            if (task.getStatus() == Task.TaskStatus.COMPLETED || task.getStatus() == Task.TaskStatus.CANCELLED) {
                existingTask.setCompleted_at(OffsetDateTime.now());
            }

            taskDAO.updateTask(existingTask);

            if (task.getStatus() == Task.TaskStatus.COMPLETED) {
                badgeService.checkAndGrantBadges(existingTask.getAssigned_volunteer_id(), existingTask.getId());
            }

            return ResponseEntity.ok("Статус оновлено");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/submit-report")
    public ResponseEntity<String> submitReport(@RequestBody Report report) {
        try {
            reportDAO.addReport(report);

            Task task = taskDAO.getTaskById(report.getTask_id());
            if (task != null) {
                task.setStatus(Task.TaskStatus.COMPLETED);
                task.setCompleted_at(OffsetDateTime.now()); // Set timestamp on report submission
                taskDAO.updateTask(task);

                badgeService.checkAndGrantBadges(task.getAssigned_volunteer_id(), task.getId());
            }

            return ResponseEntity.ok("Звіт успішно відправлено та статус змінено");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/request/{reqId}")
    public ResponseEntity<?> getTasksForRequest(@PathVariable UUID reqId) {
        try {
            List<Task> tasks = taskDAO.getTasksByRequestId(reqId);
            return ResponseEntity.ok(tasks);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/request/{reqId}/batch")
    public ResponseEntity<?> batchSaveTasks(@PathVariable UUID reqId, @RequestBody List<Task> tasks) {
        try {
            // Retrieve coordinator's department ID to assign to new tasks
            UUID deptId = null;
            if (!tasks.isEmpty() && tasks.get(0).getCoordinator_id() != null) {
                Department dept = departmentDAO.getDepartmentByUserId(tasks.get(0).getCoordinator_id());
                if (dept != null) {
                    deptId = dept.getId();
                }
            }

            for (Task task : tasks) {
                task.setRequest_id(reqId);

                // Automatically assign department_id if missing
                if (task.getDepartment_id() == null) {
                    task.setDepartment_id(deptId);
                }

                if (task.getId() == null || task.getId().toString().startsWith("temp-")) {
                    task.setId(UUID.randomUUID());
                    taskDAO.addTask(task);
                } else {
                    taskDAO.updateTask(task);
                }
            }

            return ResponseEntity.ok(taskDAO.getTasksByRequestId(reqId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<?> deleteTask(@PathVariable UUID taskId) {
        try {
            taskDAO.deleteTask(taskId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}