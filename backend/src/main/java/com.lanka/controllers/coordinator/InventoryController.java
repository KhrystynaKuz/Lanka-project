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

@RestController
@RequestMapping("/api/warehouse")
public class InventoryController {

    private final InventoryDAO inventoryDAO = new InventoryDAO();
    private final InventoryTransactionDAO transDAO = new InventoryTransactionDAO();
    private final RequestDAO requestDAO = new RequestDAO();

    @GetMapping
    public List<Inventory> getAll() throws SQLException {
        return inventoryDAO.getAllInventory();
    }

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

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) throws SQLException {
        inventoryDAO.deleteInventory(id);
    }

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

    @GetMapping("/history/{id}")
    public List<InventoryTransaction> getHistory(@PathVariable UUID id) throws SQLException {
        return transDAO.getTransactionsByInventoryId(id);
    }

    @GetMapping("/requests/mine")
    public ResponseEntity<List<Request>> getMyRequests(HttpSession session) {
        try {
            UUID userId = (UUID) session.getAttribute("userId");
            if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

            // Використовуємо новий метод, який шукає заявки за відділами користувача
            List<Request> myRequests = requestDAO.getRequestsByVolunteerDepartments(userId);

            return ResponseEntity.ok(myRequests);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}