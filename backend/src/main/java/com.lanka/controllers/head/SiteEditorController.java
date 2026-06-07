package com.lanka.controllers.head;

import com.lanka.dao.SettingsDAO;
import com.lanka.dao.FundraiserDAO;
import com.lanka.models.Fundraiser;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/site-editor")
@CrossOrigin(origins = "http://localhost:5173")
public class SiteEditorController {

    private final SettingsDAO settingsDAO;
    private final FundraiserDAO fundraiserDAO;

    public SiteEditorController() {
        this.settingsDAO = new SettingsDAO();
        this.fundraiserDAO = new FundraiserDAO();
    }

    // БЛОК 1: НАЛАШТУВАННЯ ГОЛОВНОЇ СТОРІНКИ

    // GET: http://localhost:8080/api/site-editor/settings
    @GetMapping("/settings")
    public ResponseEntity<?> getSettings() {
        try {
            Map<String, String> settings = settingsDAO.getAllSettings();
            return ResponseEntity.ok(settings);
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body("Помилка завантаження контенту сайту: " + e.getMessage());
        }
    }

    // PUT: http://localhost:8080/api/site-editor/update-home
    @PutMapping("/update-home")
    public ResponseEntity<?> updateHomeBlock(@RequestBody Map<String, String> payload) {
        try {
            String title = payload.get("title");
            String description = payload.get("description");
            String image = payload.get("image");

            if (title != null) settingsDAO.updateSetting("home_title", title);
            if (description != null) settingsDAO.updateSetting("home_description", description);
            if (image != null) settingsDAO.updateSetting("home_image", image);

            return ResponseEntity.ok("Головну сторінку успішно оновлено!");
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body("Помилка збереження в базу даних: " + e.getMessage());
        }
    }

    // БЛОК 2: СТОРІНКА АКТИВНИХ ЗБОРІВ

    // GET: http://localhost:8080/api/site-editor/fundraisers
    @GetMapping("/fundraisers")
    public ResponseEntity<?> getAllFundraisers() {
        try {
            List<Fundraiser> fundraisers = fundraiserDAO.getAllFundraisers();
            return ResponseEntity.ok(fundraisers);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body("Помилка отримання списку зборів: " + e.getMessage());
        }
    }

    // POST: http://localhost:8080/api/site-editor/fundraisers/save-all
    @PostMapping("/fundraisers/save-all")
    public ResponseEntity<?> saveAllFundraisers(@RequestBody List<Fundraiser> fundraisers) {
        try {
            boolean success = fundraiserDAO.saveAll(fundraisers);
            if (success) {
                return ResponseEntity.ok("Список активних зборів успішно синхронізовано з БД!");
            } else {
                return ResponseEntity.internalServerError()
                        .body("Не вдалося зберегти список зборів. Перевірте логи сервера.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body("Помилка сервера при збереженні зборів: " + e.getMessage());
        }
    }
}