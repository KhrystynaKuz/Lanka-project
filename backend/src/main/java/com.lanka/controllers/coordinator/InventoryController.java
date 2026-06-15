package com.lanka.controllers.coordinator;

import com.lanka.dao.InventoryDAO;
import com.lanka.dao.InventoryTransactionDAO;
import com.lanka.dao.RequestDAO;
import com.lanka.dao.TaskDAO;
import com.lanka.models.Inventory;
import com.lanka.models.InventoryTransaction;
import com.lanka.models.Request;
import com.lanka.models.Task;
import jakarta.servlet.http.HttpSession;
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
    private final TaskDAO taskDAO = new TaskDAO();
    private final RequestDAO requestDAO = new RequestDAO();

    @GetMapping
    public List<Inventory> getAll() throws SQLException {
        return inventoryDAO.getAllInventory();
    }

    @PostMapping
    public void add(@RequestBody Inventory item, HttpSession session) throws SQLException {
        UUID userId = (UUID) session.getAttribute("userId");
        item.setLast_updated_by(userId);
        inventoryDAO.addInventory(item);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) throws SQLException {
        inventoryDAO.deleteInventory(id);
    }

    // NEW: Handle adding stock to an existing item
    @PostMapping("/transaction/{id}")
    public void addStock(@PathVariable UUID id, @RequestBody InventoryTransaction trans, HttpSession session) throws SQLException {
        UUID userId = (UUID) session.getAttribute("userId");
        Inventory item = inventoryDAO.getInventoryById(id);

        if (item != null) {
            int newQty = item.getQuantity() + trans.getQuantity_changed();
            inventoryDAO.updateInventoryQuantity(id, newQty, userId);

            trans.setInventory_id(id);
            trans.setUser_id(userId);
            trans.setType("ADDITION");
            transDAO.addTransaction(trans);
        }
    }

    // UPDATED: Handle deducting stock for a request
    @PostMapping("/book/{id}")
    public void bookItem(@PathVariable UUID id, @RequestBody InventoryTransaction trans, HttpSession session) throws SQLException {
        UUID userId = (UUID) session.getAttribute("userId");
        Inventory item = inventoryDAO.getInventoryById(id);

        // trans.getQuantity_changed() is sent as a negative number from React
        if (item != null && item.getQuantity() >= Math.abs(trans.getQuantity_changed())) {
            int newQty = item.getQuantity() + trans.getQuantity_changed();
            inventoryDAO.updateInventoryQuantity(id, newQty, userId);

            trans.setInventory_id(id);
            trans.setUser_id(userId);
            trans.setType("DEDUCTION"); // Make sure this matches your DB enum for deductions
            transDAO.addTransaction(trans);
        }
    }

    // NEW: Fetch history for a specific item
    @GetMapping("/history/{id}")
    public List<InventoryTransaction> getHistory(@PathVariable UUID id) throws SQLException {
        return transDAO.getTransactionsByInventoryId(id);
    }

    @GetMapping("/requests/mine")
    public List<Request> getMyRequests(HttpSession session) throws SQLException {
        UUID coordinatorId = (UUID) session.getAttribute("userId");
        if (coordinatorId == null) return new ArrayList<>();

        List<Task> tasks = taskDAO.getTasksByCoordinatorId(coordinatorId);
        List<Request> myRequests = new ArrayList<>();

        for (Task task : tasks) {
            if (task.getRequest_id() != null) {
                Request req = requestDAO.getRequestById(task.getRequest_id());
                if (req != null && !myRequests.contains(req)) {
                    myRequests.add(req);
                }
            }
        }
        return myRequests;
    }
}