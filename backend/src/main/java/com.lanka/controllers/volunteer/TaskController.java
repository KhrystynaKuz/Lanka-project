package com.lanka.controllers.volunteer;

import com.lanka.dao.ReportDAO;
import com.lanka.dao.TaskDAO;
import com.lanka.models.Report;
import com.lanka.models.Task;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
            taskDAO.updateTask(existingTask);
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
                taskDAO.updateTask(task);
            }

            return ResponseEntity.ok("Звіт успішно відправлено та статус змінено");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}