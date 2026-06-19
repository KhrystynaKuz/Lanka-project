package com.lanka.controllers.coordinator;

import com.lanka.dao.InventoryDAO;
import com.lanka.dao.InventoryTransactionDAO;
import com.lanka.dao.RequestDAO;
import com.lanka.models.Inventory;
import com.lanka.models.InventoryTransaction;
import com.lanka.models.Request;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * REST controller responsible for managing warehouse inventory operations.
 * Provides endpoints for retrieving, adding, deleting inventory, and managing stock transactions.
 */
@RestController
@CrossOrigin(
        origins = "https://lanka-project.onrender.com",
        allowCredentials = "true"
)
@RequestMapping("/api/warehouse")
public class InventoryController {

    private final InventoryDAO inventoryDAO = new InventoryDAO();
    private final InventoryTransactionDAO transDAO = new InventoryTransactionDAO();
    private final RequestDAO requestDAO = new RequestDAO();

    /**
     * Retrieves all inventory items currently in the warehouse.
     *
     * @return a list of {@link Inventory} items
     * @throws SQLException if a database access error occurs
     */
    @GetMapping
    public List<Inventory> getAll() throws SQLException {
        return inventoryDAO.getAllInventory();
    }

    /**
     * Adds a new inventory item to the warehouse.
     * Requires an authenticated session to track the user making the update.
     *
     * @param item    the {@link Inventory} item to be added
     * @param session the HTTP session containing the authenticated user's ID
     * @return a {@link ResponseEntity} indicating success or failure
     */
    @PostMapping
    public ResponseEntity<?> add(@RequestBody Inventory item, HttpSession session) {
        try {
            UUID userId = (UUID) session.getAttribute("userId");
            if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

            item.setLast_updated_by(userId);
            inventoryDAO.addInventory(item);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Помилка створення товару");
        }
    }

    /**
     * Deletes an inventory item from the warehouse by its unique identifier.
     *
     * @param id the unique identifier of the inventory item to delete
     * @throws SQLException if a database access error occurs
     */
    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) throws SQLException {
        inventoryDAO.deleteInventory(id);
    }

    /**
     * Processes an addition transaction for an existing inventory item.
     * Requires an authenticated session.
     *
     * @param id      the unique identifier of the inventory item
     * @param trans   the {@link InventoryTransaction} details regarding the stock addition
     * @param session the HTTP session containing the authenticated user's ID
     * @return a {@link ResponseEntity} indicating success or failure
     */
    @PostMapping("/transaction/{id}")
    public ResponseEntity<?> addStock(@PathVariable UUID id, @RequestBody InventoryTransaction trans, HttpSession session) {
        try {
            UUID userId = (UUID) session.getAttribute("userId");
            if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

            Inventory item = inventoryDAO.getInventoryById(id);
            if (item == null) return ResponseEntity.notFound().build();

            trans.setInventory_id(id);
            trans.setUser_id(userId);
            trans.setType("ADDITION");

            transDAO.addTransaction(trans);
            return ResponseEntity.ok().build();

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    /**
     * Processes a deduction transaction for an existing inventory item, typically used for booking.
     * Validates that sufficient quantity exists before processing.
     * Requires an authenticated session.
     *
     * @param id      the unique identifier of the inventory item
     * @param trans   the {@link InventoryTransaction} details regarding the stock deduction
     * @param session the HTTP session containing the authenticated user's ID
     * @return a {@link ResponseEntity} indicating success or failure
     */
    @PostMapping("/book/{id}")
    public ResponseEntity<?> bookItem(@PathVariable UUID id, @RequestBody InventoryTransaction trans, HttpSession session) {
        try {
            UUID userId = (UUID) session.getAttribute("userId");
            if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

            Inventory item = inventoryDAO.getInventoryById(id);
            if (item == null) return ResponseEntity.notFound().build();

            if (item.getQuantity() >= Math.abs(trans.getQuantity_changed())) {
                trans.setInventory_id(id);
                trans.setUser_id(userId);
                trans.setType("DEDUCTION");

                transDAO.addTransaction(trans);
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Недостатньо товару на складі");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    /**
     * Retrieves the transaction history for a specific inventory item.
     *
     * @param id the unique identifier of the inventory item
     * @return a list of {@link InventoryTransaction} records associated with the item
     * @throws SQLException if a database access error occurs
     */
    @GetMapping("/history/{id}")
    public List<InventoryTransaction> getHistory(@PathVariable UUID id) throws SQLException {
        return transDAO.getTransactionsByInventoryId(id);
    }

    /**
     * Retrieves requests associated with the currently authenticated user's volunteer departments.
     *
     * @param session the HTTP session containing the authenticated user's ID
     * @return a {@link ResponseEntity} containing a list of {@link Request} objects
     */
    @GetMapping("/requests/mine")
    public ResponseEntity<List<Request>> getMyRequests(HttpSession session) {
        try {
            UUID userId = (UUID) session.getAttribute("userId");
            if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

            List<Request> myRequests = requestDAO.getRequestsByVolunteerDepartments(userId);

            return ResponseEntity.ok(myRequests);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}