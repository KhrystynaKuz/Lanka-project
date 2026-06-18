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

/**
 * REST controller for retrieving archived (completed or cancelled) tasks assigned to a specific volunteer.
 */
@RestController
@RequestMapping("/api/archive")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "https://lanka-project.onrender.com"
})
public class ArchiveController {

    @Autowired
    private TaskDAO taskDAO;

    @Autowired
    private ReportDAO reportDAO;

    /**
     * Retrieves all archived tasks for a given volunteer.
     *
     * @param volunteerId the UUID of the volunteer
     * @return a {@link ResponseEntity} encapsulating the list of archived {@link Task} objects
     */
    @GetMapping("/volunteer/{volunteerId}")
    public ResponseEntity<List<Task>> getArchive(@PathVariable UUID volunteerId) {
        try {
            List<Task> tasks = taskDAO.getArchivedTasksByVolunteerId(volunteerId);
            return ResponseEntity.ok(tasks);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Retrieves specific details for an archived task.
     * Provides data only if the task has a completed or cancelled status.
     *
     * @param taskId the UUID of the target task
     * @return a {@link ResponseEntity} providing the {@link Task} details, or a not found status
     */
    @GetMapping("/task/{taskId}")
    public ResponseEntity<Task> getTaskDetails(@PathVariable UUID taskId) {
        try {
            Task task = taskDAO.getTaskById(taskId);
            if (task != null && (task.getStatus() == TaskStatus.COMPLETED || task.getStatus() == TaskStatus.CANCELLED)) {
                return ResponseEntity.ok(task);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Retrieves all reports submitted for a specific archived task.
     *
     * @param taskId the UUID of the target task
     * @return a {@link ResponseEntity} listing {@link Report} objects attached to the task
     */
    @GetMapping("/task/{taskId}/reports")
    public ResponseEntity<List<Report>> getTaskReports(@PathVariable UUID taskId) {
        try {
            return ResponseEntity.ok(reportDAO.getReportsByTaskId(taskId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}