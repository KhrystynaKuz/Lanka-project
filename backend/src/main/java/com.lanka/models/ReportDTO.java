package com.lanka.models;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * DTO для формування агрегованого звіту по запиту.
 * Містить деталі запиту та список використаних ресурсів.
 */
public class ReportDTO {
    private String requestId;
    private LocalDate requestDate;
    private String customerName;
    private String title;
    private String description;
    private String status;
    private List<ReportItemDTO> items = new ArrayList<>();
    private BigDecimal totalItemsCost = BigDecimal.ZERO;
    private BigDecimal totalTransportCost = BigDecimal.ZERO;

    /**
     * Додає елемент до звіту та автоматично перераховує загальні витрати.
     * @param item об'єкт {@link ReportItemDTO} для додавання.
     */
    public void addItem(ReportItemDTO item) {
        this.items.add(item);
        BigDecimal itemTotal = item.getPrice().multiply(BigDecimal.valueOf(item.getQty()));
        this.totalItemsCost = this.totalItemsCost.add(itemTotal);

        if (item.getTransportCost() != null) {
            this.totalTransportCost = this.totalTransportCost.add(item.getTransportCost());
        }
    }

    // Getters
    public String getRequestId() { return requestId; }
    public LocalDate getRequestDate() { return requestDate; }
    public String getCustomerName() { return customerName; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getStatus() { return status; }
    public List<ReportItemDTO> getItems() { return items; }
    public BigDecimal getTotalItemsCost() { return totalItemsCost; }
    public BigDecimal getTotalTransportCost() { return totalTransportCost; }

    // Setters
    public void setRequestId(String requestId) { this.requestId = requestId; }
    public void setRequestDate(LocalDate requestDate) { this.requestDate = requestDate; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setStatus(String status) { this.status = status; }
}