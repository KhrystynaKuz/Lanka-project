package com.lanka.controllers.head;

import com.lanka.dao.SettingsDAO;
import com.lanka.dao.FundraiserDAO;
import com.lanka.dao.SiteReportDAO;
import com.lanka.models.Fundraiser;
import com.lanka.models.SiteReport;
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
    private final SiteReportDAO siteReportDAO;

    public SiteEditorController() {
        this.settingsDAO = new SettingsDAO();
        this.fundraiserDAO = new FundraiserDAO();
        this.siteReportDAO = new SiteReportDAO();
    }

    // БЛОК 1: НАЛАШТУВАННЯ ГОЛОВНОЇ СТОРІНКИ
    @GetMapping("/settings")
    public ResponseEntity<?> getSettings() {
        try {
            Map<String, String> settings = settingsDAO.getAllSettings();
            return ResponseEntity.ok(settings);
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Помилка: " + e.getMessage());
        }
    }

    @PutMapping("/update-home")
    public ResponseEntity<?> updateHomeBlock(@RequestBody Map<String, String> payload) {
        try {
            if (payload.get("title") != null) settingsDAO.updateSetting("home_title", payload.get("title"));
            if (payload.get("description") != null) settingsDAO.updateSetting("home_description", payload.get("description"));
            if (payload.get("image") != null) settingsDAO.updateSetting("home_image", payload.get("image"));
            return ResponseEntity.ok("Головну сторінку успішно оновлено!");
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body("Помилка збереження: " + e.getMessage());
        }
    }

    // БЛОК 2: СТОРІНКА АКТИВНИХ ЗБОРІВ
    @GetMapping("/fundraisers")
    public ResponseEntity<?> getAllFundraisers() {
        try {
            return ResponseEntity.ok(fundraiserDAO.getAllFundraisers());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Помилка: " + e.getMessage());
        }
    }

    @PostMapping("/fundraisers/save-all")
    public ResponseEntity<?> saveAllFundraisers(@RequestBody List<Fundraiser> fundraisers) {
        try {
            return fundraiserDAO.saveAll(fundraisers) ? ResponseEntity.ok("Збережено!") : ResponseEntity.internalServerError().body("Помилка БД");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Помилка: " + e.getMessage());
        }
    }

    // БЛОК 3: СТОРІНКА ЗВІТІВ
    @GetMapping("/reports")
    public ResponseEntity<?> getReports() {
        try {
            List<SiteReport> reports = siteReportDAO.getAllReports();
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Помилка завантаження звітів: " + e.getMessage());
        }
    }

    @PostMapping("/reports/save-all")
    public ResponseEntity<?> saveAllReports(@RequestBody List<SiteReport> reports) {
        try {
            boolean success = siteReportDAO.saveAllReports(reports);
            if (success) {
                return ResponseEntity.ok("Список звітів успішно оновлено!");
            } else {
                return ResponseEntity.internalServerError().body("Не вдалося зберегти звіти.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Помилка сервера: " + e.getMessage());
        }
    }
}