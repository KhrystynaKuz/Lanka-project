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

/**
 * REST controller responsible for handling volunteer gamification metrics such as levels, maps, and achievements.
 */
@RestController
@RequestMapping("/api/badges")
@CrossOrigin(origins = "*")
public class BadgesController {

    @Autowired
    private BadgeService badgeService;

    @Autowired
    private UserDAO userDAO;

    /**
     * Retrieves the current progression level calculation for a specific volunteer.
     *
     * @param volunteerId the UUID of the volunteer
     * @return a {@link ResponseEntity} exposing the current {@link VolunteerLevel}
     */
    @GetMapping("/{volunteerId}/level")
    public ResponseEntity<VolunteerLevel> getLevel(@PathVariable UUID volunteerId) {
        try {
            return ResponseEntity.ok(badgeService.getVolunteerLevel(volunteerId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Retrieves the comprehensive map of all accessible and completed levels for a volunteer.
     *
     * @param volunteerId the UUID of the volunteer
     * @return a {@link ResponseEntity} listing level metrics mapped by milestone configurations
     */
    @GetMapping("/{volunteerId}/map")
    public ResponseEntity<List<Map<String, Object>>> getLevelMap(@PathVariable UUID volunteerId) {
        try {
            return ResponseEntity.ok(badgeService.getAllLevels(volunteerId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Fetches all distinctive achievements and badges obtained by the volunteer.
     *
     * @param volunteerId the UUID of the volunteer
     * @return a {@link ResponseEntity} holding a list of achievement identifiers or names
     */
    @GetMapping("/{volunteerId}/achievements")
    public ResponseEntity<List<String>> getAchievements(@PathVariable UUID volunteerId) {
        try {
            return ResponseEntity.ok(badgeService.getVolunteerAchievements(volunteerId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Fetches the general user profile details for the target volunteer.
     *
     * @param volunteerId the UUID of the volunteer
     * @return a {@link ResponseEntity} holding the {@link User} object, or a not found status
     */
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