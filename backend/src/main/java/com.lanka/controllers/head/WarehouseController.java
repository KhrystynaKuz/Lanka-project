package com.lanka.controllers.head;

import com.lanka.models.Inventory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/warehouse")
@CrossOrigin(origins = "http://localhost:5173")
public class WarehouseController {

    private static List<Inventory> warehouseItems = new ArrayList<>();

    static {
        warehouseItems.add(new Inventory(UUID.randomUUID(), "Бинти медичні", 150, "шт", null, OffsetDateTime.now()));
        warehouseItems.add(new Inventory(UUID.randomUUID(), "Антисептики (л)", 40, "л", null, OffsetDateTime.now()));
        warehouseItems.add(new Inventory(UUID.randomUUID(), "Інсулін (флакони)", 25, "фл", null, OffsetDateTime.now()));
    }

    @GetMapping
    public ResponseEntity<List<Inventory>> getWarehouse() {
        return ResponseEntity.ok(warehouseItems);
    }

    @PostMapping("/save-all")
    public ResponseEntity<?> saveAllWarehouse(@RequestBody List<Inventory> updatedItems) {
        try {
            warehouseItems = updatedItems;
            return ResponseEntity.ok("Склад успішно синхронізовано з БД!");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Помилка збереження складу: " + e.getMessage());
        }
    }
}