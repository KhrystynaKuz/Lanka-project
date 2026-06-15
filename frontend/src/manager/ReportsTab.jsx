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

        worksheet['!cols'] = [
            { wch: 5 },
            { wch: 12 },
            { wch: 25 },
            { wch: 35 },
            { wch: 45 },
            { wch: 18 },
            { wch: 20 },
            { wch: 15 },
            { wch: 12 }
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Звіт");

        const deptName = department ? departmentsList.find(d => d.id === department)?.name : "всі_відділи";
        const fileName = `Звіт_${deptName}_${startDate}_${endDate}.xlsx`;

        XLSX.writeFile(workbook, fileName);
        showNotification("📥 Файл успішно завантажено", "success");
    };

    return (
        <div className="admin-tab-content fade-in reports-container">
            {/* Блок заголовку */}
            <div className="reports-header-block">
                <h2 className="reports-title">Фінансові звіти</h2>
                <p className="reports-subtitle">
                    Формування аналітики витрат та експорт даних у формат Excel
                </p>
            </div>

            {/* Панель параметрів та фільтрації */}
            <div className="reports-filter-panel">
                <div className="filter-group">
                    <label className="filter-label">Відділ</label>
                    <select
                        className="reports-select"
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

                <div className="filter-group">
                    <label className="filter-label">Дата початку</label>
                    <input
                        type="date"
                        className="reports-input"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <label className="filter-label">Дата кінця</label>
                    <input
                        type="date"
                        className="reports-input"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>

                <button
                    className="btn-primary-gradient"
                    onClick={handleGenerateReport}
                    disabled={isLoading}
                >
                    {isLoading ? "Завантаження..." : "Згенерувати звіт"}
                </button>
            </div>

            {/* Панель додаткових дій (Експорт) */}
            {isReportGenerated && reportData.length > 0 && (
                <div className="export-btn-wrapper">
                    <button
                        className="btn-secondary-outline"
                        title="Завантажити у форматі Excel"
                        onClick={handleDownloadExcel}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Експорт в Excel
                    </button>
                </div>
            )}

            {/* Таблиця звітів */}
            {isReportGenerated && (
                <div className="table-glass-wrapper">
                    <table className="reports-table">
                        <thead>
                        <tr>
                            <th className="text-center">№</th>
                            <th className="text-center">Дата запиту</th>
                            <th>Для кого</th>
                            <th>Запит</th>
                            <th>Речі (Назва, К-ть, Ціна)</th>
                            <th className="text-right">Вартість (разом)</th>
                            <th className="text-right">Доставка</th>
                            <th className="text-center">Статус</th>
                            <th className="text-center">Дата сплати</th>
                        </tr>
                        </thead>
                        <tbody>
                        {reportData.length > 0 ? (
                            reportData.map((req, index) => (
                                <tr key={req.requestId}>
                                    <td className="text-center text-bold-slate">{index + 1}</td>
                                    <td className="text-center" style={{ whiteSpace: 'nowrap' }}>{req.requestDate}</td>
                                    <td className="text-medium">{req.customerName}</td>
                                    <td className="text-ellipsis">
                                        <div className="text-medium" style={{ marginBottom: '2px' }}>{req.title}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.4' }}>{req.description}</div>
                                    </td>
                                    <td>
                                        <div className="dates-stack" style={{ gap: '6px' }}>
                                            {req.items.map((item, i) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '4px' }}>
                                                    <span>{item.name} <span className="text-bold-slate">x{item.qty}</span></span>
                                                    <span className="text-medium">{formatMoney(item.price)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="text-right text-bold-dark">
                                        {formatMoney(req.totalItemsCost)}
                                    </td>
                                    <td className="text-right">
                                        <div className="dates-stack" style={{ gap: '4px', marginBottom: '6px', textAlign: 'right' }}>
                                            {req.items.map((item, i) => (
                                                <span key={i}>{formatMoney(item.transportCost)}</span>
                                            ))}
                                        </div>
                                        <div className="text-bold-dark" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '4px' }}>
                                            {formatMoney(req.totalTransportCost)}
                                        </div>
                                    </td>
                                    <td className="text-center">
                                        <span className={`status-pill ${
                                            req.status === 'FULFILLED' ? 'status-fulfilled' :
                                                req.status === 'REJECTED' ? 'status-rejected' : 'status-pending'
                                        }`}>
                                            {translateStatus(req.status)}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <div className="dates-stack" style={{ gap: '4px' }}>
                                            {req.items.map((item, i) => (
                                                <span key={i}>{item.date}</span>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="9" className="no-data-cell">
                                    За обраний період даних не знайдено.
                                </td>
                            </tr>
                        )}
                        </tbody>
                        <tfoot>
                        <tr>
                            <td colSpan="5" className="foot-total-label">
                                Всього витрачено (речі + доставка):
                            </td>
                            <td colSpan="4" className="foot-total-amount">
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