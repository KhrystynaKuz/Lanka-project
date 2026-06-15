import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

// Утиліта для гарного форматування грошей (напр. 1 250,00 ₴)
const formatMoney = (amount) => {
    return Number(amount || 0).toLocaleString('uk-UA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + ' ₴';
};

// Утиліта для перекладу статусів
const translateStatus = (status) => {
    const statuses = {
        'PENDING': 'В очікуванні',
        'APPROVED': 'Схвалено',
        'IN_PROGRESS': 'В роботі',
        'FULFILLED': 'Виконано',
        'REJECTED': 'Відхилено'
    };
    return statuses[status] || status;
};

export default function ReportsTab({ showNotification }) {
    const [startDate, setStartDate] = useState('2026-05-01');
    const [endDate, setEndDate] = useState('2026-06-30');
    const [department, setDepartment] = useState('');
    const [departmentsList, setDepartmentsList] = useState([]);

    const [isReportGenerated, setIsReportGenerated] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await fetch('http://localhost:8080/api/management/departments');
                if (response.ok) {
                    const data = await response.json();
                    setDepartmentsList(data);
                }
            } catch (error) {
                console.error("Помилка завантаження списку відділів:", error);
            }
        };
        fetchDepartments();
    }, []);

    const handleGenerateReport = async () => {
        setIsLoading(true);
        showNotification("📊 Формування звіту...", "info");

        try {
            let url = `http://localhost:8080/api/management/reports?startDate=${startDate}&endDate=${endDate}`;
            if (department) {
                url += `&departmentId=${department}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Помилка сервера: ${response.status}`);
            }

            const data = await response.json();
            setReportData(data || []);
            setIsReportGenerated(true);
            showNotification("✅ Звіт успішно сформовано!", "success");

        } catch (error) {
            console.error("Error fetching report:", error.message);
            showNotification("❌ Помилка при формуванні звіту.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const grandTotalItems = reportData.reduce((sum, req) => sum + Number(req.totalItemsCost || 0), 0);
    const grandTotalTransport = reportData.reduce((sum, req) => sum + Number(req.totalTransportCost || 0), 0);
    const grandTotal = grandTotalItems + grandTotalTransport;

    // Оновлена логіка вивантаження в Excel з шириною колонок
    const handleDownloadExcel = () => {
        if (!reportData || reportData.length === 0) {
            showNotification("Немає даних для завантаження", "error");
            return;
        }

        const exportData = reportData.map((req, index) => {
            const itemsText = req.items.map(i => `• ${i.name} (${i.qty} шт.) х ${formatMoney(i.price)}`).join('\n');
            const transportText = req.items.map(i => `• ${formatMoney(i.transportCost)}`).join('\n');
            const datesText = req.items.map(i => i.date).join('\n');

            return {
                "№": index + 1,
                "Дата запиту": req.requestDate,
                "Для кого": req.customerName,
                "Запит": `${req.title}\n(${req.description})`,
                "Речі (Назва, К-ть, Ціна)": itemsText,
                "Вартість (разом)": formatMoney(req.totalItemsCost),
                "Вартість доставки": `${transportText}\n------------------\nВсього: ${formatMoney(req.totalTransportCost)}`,
                "Статус заявки": translateStatus(req.status),
                "Дата сплати": datesText
            };
        });

        // Додаємо підсумковий рядок
        exportData.push({
            "№": "",
            "Дата запиту": "",
            "Для кого": "",
            "Запит": "",
            "Речі (Назва, К-ть, Ціна)": "ВСЬОГО ВИТРАЧЕНО (речі + доставка):",
            "Вартість (разом)": formatMoney(grandTotal),
            "Вартість доставки": "",
            "Статус заявки": "",
            "Дата сплати": ""
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);

        // Встановлюємо комфортну ширину колонок для Excel
        worksheet['!cols'] = [
            { wch: 5 },   // №
            { wch: 12 },  // Дата
            { wch: 25 },  // Для кого
            { wch: 35 },  // Запит
            { wch: 45 },  // Речі
            { wch: 18 },  // Вартість
            { wch: 20 },  // Доставка
            { wch: 15 },  // Статус
            { wch: 12 }   // Дата сплати
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Звіт");

        const deptName = department ? departmentsList.find(d => d.id === department)?.name : "всі_відділи";
        const fileName = `Звіт_${deptName}_${startDate}_${endDate}.xlsx`;

        XLSX.writeFile(workbook, fileName);
        showNotification("📥 Файл успішно завантажено", "success");
    };

    return (
        <div className="admin-tab-content fade-in">
            <div className="reports-selectors-card" style={{ marginBottom: '24px' }}>
                <h3 className="analytics-title" style={{ marginTop: 0 }}>Параметри звіту</h3>

                <div className="selector-row">
                    <span className="selector-bullet">•</span>
                    <label>Відділ: </label>
                    <select
                        className="admin-select"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                    >
                        <option value="">Всі відділи</option>
                        {departmentsList.map(dept => (
                            <option key={dept.id} value={dept.id}>
                                {dept.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="selector-row" style={{ marginTop: '16px' }}>
                    <span className="selector-bullet">•</span>
                    <label>Період: </label>
                    <span className="date-span">з</span>
                    <input
                        type="date"
                        className="admin-date-input"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                    <span className="date-span">по</span>
                    <input
                        type="date"
                        className="admin-date-input"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                    <button
                        className="btn-primary"
                        style={{ marginLeft: '16px' }}
                        onClick={handleGenerateReport}
                        disabled={isLoading}
                    >
                        {isLoading ? "Завантаження..." : "Згенерувати звіт"}
                    </button>

                    <button
                        className="btn-download-icon"
                        title="Завантажити у форматі Excel"
                        onClick={handleDownloadExcel}
                        disabled={!isReportGenerated || reportData.length === 0}
                    >
                        📥
                    </button>
                </div>
            </div>

            {isReportGenerated && (
                <div className="report-table-container" style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: '16px' }}>
                    <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                        <thead>
                        <tr style={{ borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#475569' }}>
                            <th style={{ padding: '12px 8px', textAlign: 'center' }}>№</th>
                            <th style={{ padding: '12px 8px', textAlign: 'center' }}>Дата запиту</th>
                            <th style={{ padding: '12px 8px', textAlign: 'left' }}>Для кого</th>
                            <th style={{ padding: '12px 8px', textAlign: 'left' }}>Запит</th>
                            <th style={{ padding: '12px 8px', textAlign: 'left' }}>Речі (Назва, К-ть, Ціна)</th>
                            <th style={{ padding: '12px 8px', textAlign: 'right' }}>Вартість (разом)</th>
                            <th style={{ padding: '12px 8px', textAlign: 'right' }}>Доставка</th>
                            <th style={{ padding: '12px 8px', textAlign: 'center' }}>Статус</th>
                            <th style={{ padding: '12px 8px', textAlign: 'center' }}>Дата сплати</th>
                        </tr>
                        </thead>
                        <tbody>
                        {reportData.length > 0 ? (
                            reportData.map((req, index) => (
                                <tr key={req.requestId} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <td style={{ padding: '12px 8px', textAlign: 'center', color: '#64748b' }}>{index + 1}</td>
                                    <td style={{ padding: '12px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>{req.requestDate}</td>
                                    <td style={{ padding: '12px 8px', fontWeight: '500' }}>{req.customerName}</td>
                                    <td style={{ padding: '12px 8px', maxWidth: '200px' }}>
                                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{req.title}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.4' }}>{req.description}</div>
                                    </td>
                                    <td style={{ padding: '12px 8px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {req.items.map((item, i) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '4px' }}>
                                                    <span>{item.name} <span style={{ color: '#64748b' }}>x{item.qty}</span></span>
                                                    <span style={{ fontWeight: '500' }}>{formatMoney(item.price)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>
                                        {formatMoney(req.totalItemsCost)}
                                    </td>
                                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9rem', color: '#64748b', marginBottom: '6px' }}>
                                            {req.items.map((item, i) => (
                                                <span key={i}>{formatMoney(item.transportCost)}</span>
                                            ))}
                                        </div>
                                        <div style={{ fontWeight: '600', color: '#0f172a', borderTop: '1px solid #e2e8f0', paddingTop: '4px' }}>
                                            {formatMoney(req.totalTransportCost)}
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                        <span className={`status-badge status-${req.status?.toLowerCase() || 'pending'}`} style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
                                            {translateStatus(req.status)}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '0.9rem', color: '#64748b' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {req.items.map((item, i) => (
                                                <span key={i}>{item.date}</span>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                                    За обраний період даних не знайдено.
                                </td>
                            </tr>
                        )}
                        </tbody>
                        <tfoot>
                        <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #cbd5e1' }}>
                            <td colSpan="5" style={{ textAlign: 'right', padding: '16px', fontWeight: '700', fontSize: '1.05rem', color: '#334155' }}>
                                Всього витрачено (речі + доставка):
                            </td>
                            <td colSpan="4" style={{ padding: '16px 8px', fontWeight: '800', fontSize: '1.15rem', color: '#dc2626' }}>
                                {formatMoney(grandTotal)}
                            </td>
                        </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
}