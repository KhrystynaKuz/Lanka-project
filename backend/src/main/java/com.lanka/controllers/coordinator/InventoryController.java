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
    public List<Inventory> getAll() throws SQLException { return inventoryDAO.getAllInventory(); }

    @PostMapping
    public void add(@RequestBody Inventory item) throws SQLException { inventoryDAO.addInventory(item); }

    @PutMapping("/{id}")
    public void update(@PathVariable UUID id, @RequestBody Inventory item) throws SQLException {
        item.setId(id);
        inventoryDAO.updateInventory(item);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) throws SQLException { inventoryDAO.deleteInventory(id); }

    @PostMapping("/book/{id}")
    public void bookItem(@PathVariable UUID id, @RequestBody InventoryTransaction trans) throws SQLException {
        Inventory item = inventoryDAO.getInventoryById(id);
        if (item != null && item.getQuantity() >= Math.abs(trans.getQuantity_changed())) {
            int newQty = item.getQuantity() - Math.abs(trans.getQuantity_changed());
            inventoryDAO.updateInventoryQuantity(id, newQty, trans.getUser_id());
            trans.setInventory_id(id);
            transDAO.addTransaction(trans);
        }
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
