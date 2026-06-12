package com.lanka.controllers.volunteer;

import com.lanka.dao.ReportDAO;
import com.lanka.dao.TaskDAO;
import com.lanka.models.Report;
import com.lanka.models.Task;
import com.lanka.models.Task.TaskStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/archive")
@CrossOrigin(origins = "http://localhost:5173")
public class ArchiveController {

    @Autowired
    private TaskDAO taskDAO;

    @Autowired
    private ReportDAO reportDAO;

    @GetMapping("/volunteer/{volunteerId}")
    public ResponseEntity<List<Task>> getArchive(@PathVariable UUID volunteerId) {
        try {
            List<Task> tasks = taskDAO.getTasksByVolunteerAndStatus(volunteerId, TaskStatus.COMPLETED);
            return ResponseEntity.ok(tasks);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/task/{taskId}")
    public ResponseEntity<Task> getTaskDetails(@PathVariable UUID taskId) {
        try {
            Task task = taskDAO.getTaskById(taskId);
            if (task != null && task.getStatus() == TaskStatus.COMPLETED) {
                return ResponseEntity.ok(task);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/task/{taskId}/reports")
    public ResponseEntity<List<Report>> getTaskReports(@PathVariable UUID taskId) {
        try {
            return ResponseEntity.ok(reportDAO.getReportsByTaskId(taskId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}