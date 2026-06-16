package com.lanka.service;

import com.lanka.dao.TaskDAO;
import com.lanka.database.DatabaseConfig;
import com.lanka.models.VolunteerLevel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.time.Duration;
import java.util.*;

/**
 * Відповідає за логіку рівнів волонтерів та видачу досягнень (бейджів).
 */
@Service
public class BadgeService {

    @Autowired
    private TaskDAO taskDAO;

    /**
     * Внутрішній клас конфігурації рівнів.
     */
    private static class LevelConfig {
        int threshold;
        String name;

        LevelConfig(int threshold, String name) {
            this.threshold = threshold;
            this.name = name;
        }
    }

    private static final List<LevelConfig> LEVELS = List.of(
            new LevelConfig(0, "Новачок"),
            new LevelConfig(5, "Помічник"),
            new LevelConfig(15, "Рятівник"),
            new LevelConfig(30, "Координатор змін"),
            new LevelConfig(50, "Майстер логістики"),
            new LevelConfig(80, "Ветеран волонтерства"),
            new LevelConfig(120, "Герой громади"),
            new LevelConfig(200, "Орденоносець"),
            new LevelConfig(350, "Експерт-наставник"),
            new LevelConfig(500, "Легенда проекту")
    );

    /**
     * Визначає поточний рівень волонтера на основі кількості виконаних завдань.
     * @param volunteerId ID волонтера
     * @return об'єкт VolunteerLevel з інформацією про рівень
     * @throws SQLException при помилці запиту до БД
     */
    public VolunteerLevel getVolunteerLevel(UUID volunteerId) throws SQLException {
        int count = taskDAO.countCompletedTasks(volunteerId);

        LevelConfig current = LEVELS.get(0);
        LevelConfig next = LEVELS.get(1);

        for (int i = 0; i < LEVELS.size(); i++) {
            if (count >= LEVELS.get(i).threshold) {
                current = LEVELS.get(i);
                next = (i + 1 < LEVELS.size()) ? LEVELS.get(i + 1) : current;
            }
        }

        return new VolunteerLevel(LEVELS.indexOf(current) + 1, current.name, count, next.threshold);
    }

    /**
     * Отримує список усіх рівнів із позначенням того, чи досяг їх волонтер.
     *
     * @param volunteerId унікальний ідентифікатор волонтера.
     * @return список мап, де кожна мапа містить опис рівня та статус "відкрито".
     * @throws SQLException у разі виникнення помилок при роботі з базою даних.
     */
    public List<Map<String, Object>> getAllLevels(UUID volunteerId) throws SQLException {
        int count = taskDAO.countCompletedTasks(volunteerId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (int i = 0; i < LEVELS.size(); i++) {
            LevelConfig config = LEVELS.get(i);
            Map<String, Object> level = new HashMap<>();
            level.put("levelNumber", i + 1);
            level.put("name", config.name);
            level.put("threshold", config.threshold);
            level.put("isUnlocked", count >= config.threshold);
            result.add(level);
        }

        return result;
    }

    /**
     * Нараховує волонтеру новий бейдж, записуючи його в базу даних.
     *
     * @param volunteerId унікальний ідентифікатор волонтера.
     * @param badgeId     ідентифікатор бейджа, який потрібно видати.
     * @throws SQLException у разі виникнення помилок при роботі з базою даних.
     */
    public void grantBadge(UUID volunteerId, String badgeId) throws SQLException {
        String sql = "INSERT INTO user_achievements (user_id, badge_id) VALUES (?, ?) ON CONFLICT DO NOTHING";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, volunteerId);
            ps.setString(2, badgeId);
            ps.executeUpdate();
        }
    }

    /**
     * Отримує список усіх бейджів, які вже заробив волонтер.
     *
     * @param volunteerId унікальний ідентифікатор волонтера.
     * @return список ідентифікаторів отриманих бейджів.
     * @throws SQLException у разі виникнення помилок при роботі з базою даних.
     */
    public List<String> getVolunteerAchievements(UUID volunteerId) throws SQLException {
        List<String> badges = new ArrayList<>();
        String sql = "SELECT badge_id FROM user_achievements WHERE user_id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, volunteerId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    badges.add(rs.getString("badge_id"));
                }
            }
        }
        return badges;
    }

    /**
     * Повертає повний каталог доступних бейджів з інформацією, чи отримав їх конкретний волонтер.
     *
     * @param volunteerId унікальний ідентифікатор волонтера.
     * @return список мап з описом бейджа та його статусом (відкрито/закрито).
     * @throws SQLException у разі виникнення помилок при роботі з базою даних.
     */
    public List<Map<String, Object>> getAllAvailableBadges(UUID volunteerId) throws SQLException {
        List<String> userAchieved = getVolunteerAchievements(volunteerId);
        List<Map<String, Object>> allBadges = new ArrayList<>();

        String[][] badgeCatalog = {
                {"FIRST_TRIP", "Перший виїзд"},
                {"FAST_HELP", "Швидка допомога"},
                {"NIGHT_WATCH", "Нічний дозор"},
                {"STEADY_HAND", "Безвідмовний"},
                {"WEEKLY_HERO", "Тижневий герой"},
                {"MARATHON_RUNNER", "Марафон"},
                {"VETERAN", "Ветеран"}
        };

        for (String[] b : badgeCatalog) {
            Map<String, Object> badge = new HashMap<>();
            badge.put("id", b[0]);
            badge.put("name", b[1]);
            badge.put("unlocked", userAchieved.contains(b[0]));
            allBadges.add(badge);
        }
        return allBadges;
    }

    /**
     * Перевіряє умови отримання всіх доступних бейджів після виконання завдання.
     * Реалізує бізнес-логіку нарахування нагород (наприклад, за швидкість чи нічні зміни).
     * @param volunteerId ID волонтера
     * @param taskId ID виконаного завдання
     */
    public void checkAndGrantBadges(UUID volunteerId, UUID taskId) throws SQLException {
        var task = taskDAO.getTaskById(taskId);
        int totalCompleted = taskDAO.countCompletedTasks(volunteerId);

        // 1. FIRST_TRIP: Виконано 1+ завдання
        if (totalCompleted >= 1) grantBadge(volunteerId, "FIRST_TRIP");

        // 2. VETERAN: Виконано 50+ завдань
        if (totalCompleted >= 50) grantBadge(volunteerId, "VETERAN");

        // 3. FAST_HELP: Менше 2 годин на виконання
        if (task.getCompleted_at() != null && task.getCreated_at() != null) {
            if (Duration.between(task.getCreated_at().toLocalDateTime(),
                    task.getCompleted_at().toLocalDateTime()).toHours() < 2) {
                grantBadge(volunteerId, "FAST_HELP");
            }
        }

        // 4. NIGHT_WATCH: Виконано вночі (22:00 - 06:00)
        if (task.getCompleted_at() != null) {
            int hour = task.getCompleted_at().toLocalDateTime().getHour();
            if (hour >= 22 || hour < 6) grantBadge(volunteerId, "NIGHT_WATCH");
        }

        // 5. STEADY_HAND: 3+ активних завдання одночасно
        if (taskDAO.countActiveTasks(volunteerId) >= 3) {
            grantBadge(volunteerId, "STEADY_HAND");
        }

        // 6. WEEKLY_HERO: 5+ завдань за останні 7 днів
        if (taskDAO.countTasksCompletedInLastDays(volunteerId, 7) >= 5) {
            grantBadge(volunteerId, "WEEKLY_HERO");
        }

        // 7. MARATHON_RUNNER: Завдання тривало 7+ днів
        if (task.getCompleted_at() != null && task.getCreated_at() != null) {
            if (Duration.between(task.getCreated_at().toLocalDateTime(),
                    task.getCompleted_at().toLocalDateTime()).toDays() >= 7) {
                grantBadge(volunteerId, "MARATHON_RUNNER");
            }
        }
    }
}