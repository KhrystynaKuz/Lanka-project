package com.lanka.controllers.volunteer;

import com.lanka.dao.UserDAO;
import com.lanka.models.User;
import com.lanka.models.VolunteerLevel;
import com.lanka.service.BadgeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/badges")
@CrossOrigin(origins = "http://localhost:5173")
public class BadgesController {

    @Autowired
    private BadgeService badgeService;

    @Autowired
    private UserDAO userDAO;

    @GetMapping("/{volunteerId}/level")
    public ResponseEntity<VolunteerLevel> getLevel(@PathVariable UUID volunteerId) {
        try {
            return ResponseEntity.ok(badgeService.getVolunteerLevel(volunteerId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{volunteerId}/map")
    public ResponseEntity<List<Map<String, Object>>> getLevelMap(@PathVariable UUID volunteerId) {
        try {
            return ResponseEntity.ok(badgeService.getAllLevels(volunteerId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{volunteerId}/achievements")
    public ResponseEntity<List<String>> getAchievements(@PathVariable UUID volunteerId) {
        try {
            return ResponseEntity.ok(badgeService.getVolunteerAchievements(volunteerId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{volunteerId}/profile")
    public ResponseEntity<?> getVolunteerProfile(@PathVariable UUID volunteerId) {
        try {
            Optional<User> userOpt = userDAO.findById(volunteerId);
            if (userOpt.isPresent()) {
                return ResponseEntity.ok(userOpt.get());
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}