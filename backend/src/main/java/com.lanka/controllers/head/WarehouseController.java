package com.lanka.controllers.head;

import com.lanka.dao.InventoryDAO;
import com.lanka.models.Inventory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/head/warehouse")
public class WarehouseController {

    private final InventoryDAO inventoryDAO;

    public WarehouseController(InventoryDAO inventoryDAO) {
        this.inventoryDAO = inventoryDAO;
    }

    @GetMapping
    public ResponseEntity<List<Inventory>> getWarehouse() throws SQLException {
        return ResponseEntity.ok(inventoryDAO.getAllInventory());
    }

    @PostMapping
    public ResponseEntity<?> add(@RequestBody Inventory item) throws SQLException {
        inventoryDAO.addInventory(item);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable UUID id, @RequestBody Inventory item) throws SQLException {
        item.setId(id);
        inventoryDAO.updateInventory(item);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable UUID id) throws SQLException {
        inventoryDAO.deleteInventory(id);
        return ResponseEntity.ok().build();
    }
}