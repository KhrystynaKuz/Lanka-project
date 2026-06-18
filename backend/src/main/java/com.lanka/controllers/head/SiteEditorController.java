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

/**
 * REST controller for managing global site content, including home page settings, fundraisers, and public reports.
 */
@RestController
@RequestMapping("/api/site-editor")
@CrossOrigin(originPatterns = "*")
public class SiteEditorController {

    private final SettingsDAO settingsDAO;
    private final FundraiserDAO fundraiserDAO;
    private final SiteReportDAO siteReportDAO;

    /**
     * Constructs a new {@code SiteEditorController} and initializes DAOs.
     */
    public SiteEditorController() {
        this.settingsDAO = new SettingsDAO();
        this.fundraiserDAO = new FundraiserDAO();
        this.siteReportDAO = new SiteReportDAO();
    }

    /**
     * Retrieves global site configuration settings stored as key-value pairs.
     *
     * @return a {@link ResponseEntity} encapsulating a map of settings
     */
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

    /**
     * Updates targeted configuration variables designated for the website's home page block.
     *
     * @param payload a map containing potential updates for 'title', 'description', and 'image'
     * @return a {@link ResponseEntity} denoting success or returning an error message
     */
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

    /**
     * Fetches all registered active and past fundraiser campaigns.
     *
     * @return a {@link ResponseEntity} comprising a list of {@link Fundraiser} entries
     */
    @GetMapping("/fundraisers")
    public ResponseEntity<?> getAllFundraisers() {
        try {
            return ResponseEntity.ok(fundraiserDAO.getAllFundraisers());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Помилка: " + e.getMessage());
        }
    }

    /**
     * Performs a bulk save or overwrite operation for the site's fundraisers list.
     *
     * @param fundraisers a complete list of {@link Fundraiser} objects representing the desired state
     * @return a {@link ResponseEntity} denoting success or failure of the batch transaction
     */
    @PostMapping("/fundraisers/save-all")
    public ResponseEntity<?> saveAllFundraisers(@RequestBody List<Fundraiser> fundraisers) {
        try {
            return fundraiserDAO.saveAll(fundraisers) ? ResponseEntity.ok("Збережено!") : ResponseEntity.internalServerError().body("Помилка БД");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Помилка: " + e.getMessage());
        }
    }

    /**
     * Retrieves all published site reports intended for public view.
     *
     * @return a {@link ResponseEntity} comprising a list of {@link SiteReport} instances
     */
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

    /**
     * Performs a bulk save or overwrite operation for the site's public reports list.
     *
     * @param reports a complete list of {@link SiteReport} objects representing the desired state
     * @return a {@link ResponseEntity} denoting transaction success or failure
     */
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