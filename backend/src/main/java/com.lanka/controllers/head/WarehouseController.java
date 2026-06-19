package com.lanka.controllers.head;

import com.lanka.dao.InventoryDAO;
import com.lanka.models.Inventory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for high-level management of warehouse inventory.
 */
@RestController
@CrossOrigin(originPatterns = "*")
@RequestMapping("/api/head/warehouse")
public class WarehouseController {

    private final InventoryDAO inventoryDAO;

    /**
     * Constructs a new {@code WarehouseController}.
     *
     * @param inventoryDAO the DAO used to perform inventory operations
     */
    public WarehouseController(InventoryDAO inventoryDAO) {
        this.inventoryDAO = inventoryDAO;
    }

    /**
     * Retrieves a full list of all available inventory items.
     *
     * @return a {@link ResponseEntity} encapsulating the inventory list
     * @throws SQLException if a database error occurs
     */
    @GetMapping
    public ResponseEntity<List<Inventory>> getWarehouse() throws SQLException {
        return ResponseEntity.ok(inventoryDAO.getAllInventory());
    }

    /**
     * Adds a newly acquired item to the warehouse tracking system.
     *
     * @param item the {@link Inventory} item to register
     * @return an empty {@link ResponseEntity} confirming operation success
     * @throws SQLException if a database error occurs
     */
    @PostMapping
    public ResponseEntity<?> add(@RequestBody Inventory item) throws SQLException {
        inventoryDAO.addInventory(item);
        return ResponseEntity.ok().build();
    }

    /**
     * Updates an existing warehouse item's details.
     *
     * @param id   the UUID of the inventory item to update
     * @param item the updated {@link Inventory} properties
     * @return an empty {@link ResponseEntity} confirming operation success
     * @throws SQLException if a database error occurs
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable UUID id, @RequestBody Inventory item) throws SQLException {
        item.setId(id);
        inventoryDAO.updateInventory(item);
        return ResponseEntity.ok().build();
    }

    /**
     * Removes an item entirely from warehouse tracking.
     *
     * @param id the UUID of the inventory item to remove
     * @return an empty {@link ResponseEntity} confirming operation success
     * @throws SQLException if a database error occurs
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable UUID id) throws SQLException {
        inventoryDAO.deleteInventory(id);
        return ResponseEntity.ok().build();
    }
}