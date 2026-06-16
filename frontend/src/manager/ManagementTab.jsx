import React, {useState, useEffect} from 'react';
import './Manager.css';

/**
 * Головний компонент вкладки "Керування" для адміністратора/менеджера.
 * Відповідає за верифікацію користувачів, управління відділами,
 * волонтерами, замовниками та документами.
 *
 * @component
 * @param {Object} props - Властивості компонента.
 * @param {Function} props.showNotification - Функція для показу сповіщень.
 * @returns {JSX.Element} Рендер вкладки керування.
 */
export default function ManagementTab({showNotification}) {
    const API_BASE_URL = 'http://localhost:8080';

    const [verificationList, setVerificationList] = useState([]);
    const [userDocs, setUserDocs] = useState({});

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [activeDocId, setActiveDocId] = useState(null);
    const [activeUserId, setActiveUserId] = useState(null);

    const [customerSearch, setCustomerSearch] = useState('');
    const [expandedUser, setExpandedUser] = useState(null);

    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddDeptModal, setShowAddDeptModal] = useState(false);
    const [newDeptName, setNewDeptName] = useState('');
    const [newDeptDescription, setNewDeptDescription] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [deptSearch, setDeptSearch] = useState('');

    const [selectedDept, setSelectedDept] = useState(null);

    const [volunteers, setVolunteers] = useState([]);
    const [showAddVolModal, setShowAddVolModal] = useState(false);
    const [allAvailableVolunteers, setAllAvailableVolunteers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [viewingVol, setViewingVol] = useState(null);
    const [volunteersLoading, setVolunteersLoading] = useState(false);
    const [volSearchTerm, setVolSearchTerm] = useState("");

    const [customers, setCustomers] = useState([]);
    const [viewingCustomer, setViewingCustomer] = useState(null);

    const [pendingDocs, setPendingDocs] = useState([]);
    const [isInitialVerification, setIsInitialVerification] = useState(false);

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        text: '',
        icon: '⚠️',
        onConfirm: null
    });

    /**
     * Завантажує список користувачів, які очікують верифікації.
     *
     * @async
     * @returns {Promise<void>}
     */
    const fetchPendingUsers = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/management/volunteers/pending');
            if (!response.ok) throw new Error("Помилка завантаження черги");
            const data = await response.json();
            setVerificationList(data);
        } catch (err) {
            console.error("Помилка завантаження черги верифікації:", err);
        }
    };

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    /**
     * Завантажує список документів, які очікують перевірки.
     *
     * @async
     * @returns {Promise<void>}
     */
    const fetchPendingDocuments = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/management/documents/pending-all');
            if (!response.ok) throw new Error("Помилка завантаження документів");
            const data = await response.json();
            setPendingDocs(data);
        } catch (err) {
            console.error("Помилка:", err);
        }
    };

    useEffect(() => {
        fetchPendingDocuments();
    }, []);

    /**
     * Закриває модальне вікно підтвердження.
     */
    const closeConfirmModal = () => {
        setConfirmModal({
            isOpen: false,
            title: '',
            text: '',
            icon: '⚠️',
            onConfirm: null
        });
    };

    /**
     * Завантажує список замовників з бекенду.
     *
     * @async
     * @returns {Promise<void>}
     */
    const fetchCustomers = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/management/customers');

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Помилка завантаження замовників');
            }

            const data = await response.json();
            setCustomers(data);
        } catch (err) {
            console.error("Помилка завантаження замовників:", err.message);
            if (showNotification) showNotification(`🚨 ${err.message}`, "error");
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        /**
         * Завантажує список відділів з бекенду.
         *
         * @async
         * @returns {Promise<void>}
         */
        const fetchDepartments = async () => {
            setLoading(true);
            try {
                const response = await fetch('http://localhost:8080/api/management/departments');
                if (!response.ok) throw new Error('Помилка сервера');
                const data = await response.json();
                setDepartments(data);
            } catch (error) {
                console.error("Помилка:", error);
                if (showNotification) showNotification("🚨 Помилка завантаження відділів", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchDepartments();
    }, []);

    useEffect(() => {
        /**
         * Завантажує список волонтерів (всіх або для конкретного відділу).
         *
         * @async
         * @returns {Promise<void>}
         */
        const fetchVolunteers = async () => {
            setVolunteersLoading(true);
            let url = 'http://localhost:8080/api/management/volunteers';

            if (selectedDept) {
                url = `http://localhost:8080/api/management/departments/${selectedDept.id}/volunteers`;
            }

            try {
                const response = await fetch(url);
                const data = await response.json();
                setVolunteers(data);
            } catch (error) {
                console.error("Помилка завантаження волонтерів:", error);
                if (showNotification) showNotification("🚨 Помилка завантаження волонтерів", "error");
            } finally {
                setVolunteersLoading(false);
            }
        };

        fetchVolunteers();
    }, [selectedDept]);

    /**
     * Розгортає/згортає список документів користувача.
     *
     * @param {string|number} userId - Ідентифікатор користувача.
     * @returns {Promise<void>}
     */
    const toggleDocs = async (userId) => {
        if (expandedUser === userId) {
            setExpandedUser(null);
        } else {
            if (!userDocs[userId]) {
                try {
                    const response = await fetch(`http://localhost:8080/api/management/documents/${userId}`);
                    const data = await response.json();
                    setUserDocs(prev => ({...prev, [userId]: data}));
                } catch (err) {
                    console.error("Помилка завантаження документів", err);
                }
            }
            setExpandedUser(userId);
        }
    };

    /**
     * Отримує ім'я файлу з URL-посилання.
     *
     * @param {string} url - URL-посилання на файл.
     * @returns {string} Ім'я файлу або "Без назви".
     */
    const getFileNameFromUrl = (url) => {
        if (!url) return "Без назви";
        const decodedUrl = decodeURIComponent(url);
        const fileName = decodedUrl.substring(decodedUrl.lastIndexOf('/') + 1);
        return fileName;
    };

    /**
     * Затверджує документ.
     *
     * @param {string|number} docId - Ідентифікатор документа.
     * @returns {Promise<void>}
     */
    const handleApprove = async (docId) => {
        const success = await sendDocStatus(docId, 'APPROVED', null);
        if (success) {
            setUserDocs(prev => {
                const newDocs = {...prev};
                for (const userId in newDocs) {
                    newDocs[userId] = newDocs[userId].map(doc =>
                        doc.id === docId ? {...doc, status: 'APPROVED'} : doc
                    );
                }
                return newDocs;
            });
        }
    };

    /**
     * Відкриває модальне вікно для введення причини відхилення документа.
     *
     * @param {string|number} docId - Ідентифікатор документа.
     */
    const handleReject = (docId) => {
        setActiveDocId(docId);
        setShowRejectModal(true);
    };

    /**
     * Відкриває модальне вікно для введення причини відхилення документа.
     *
     * @param {string|number} docId - Ідентифікатор документа.
     */
    const handleRejectClick = (docId) => {
        setActiveDocId(docId);
        setShowRejectModal(true);
    };

    /**
     * Надсилає причину відхилення документа на бекенд.
     *
     * @async
     * @returns {Promise<void>}
     */
    const handleSendRejectReason = async () => {
        const endpoint = isInitialVerification
            ? `${API_BASE_URL}/api/management/documents/reject`
            : `${API_BASE_URL}/api/management/documents/reject-verified`;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    docId: activeDocId,
                    userId: activeUserId,
                    reason: rejectReason
                })
            });

            if (response.ok) {
                showNotification("Документ відхилено", "success");
                setShowRejectModal(false);
                setRejectReason("");

                if (isInitialVerification) {
                    fetchPendingUsers();
                } else {
                    fetchPendingDocuments();
                }
            }
        } catch (err) {
            showNotification("Помилка", "error");
        }
    };

    /**
     * Надсилає новий статус документа на бекенд.
     *
     * @async
     * @param {string|number} docId - Ідентифікатор документа.
     * @param {string} status - Новий статус ('APPROVED' або 'REJECTED').
     * @param {string|null} reason - Причина відхилення (якщо є).
     * @returns {Promise<boolean>} true, якщо операція успішна.
     */
    const sendDocStatus = async (docId, status, reason) => {
        try {
            const response = await fetch('http://localhost:8080/api/management/documents/status', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({docId, status, reason})
            });
            if (response.ok) {
                showNotification("Статус оновлено!", "success");
                return true;
            }
            return false;
        } catch (err) {
            showNotification("Помилка оновлення", "error");
            return false;
        }
    };

    /**
     * Додає новий відділ до системи.
     *
     * @async
     * @returns {Promise<void>}
     */
    const handleAddDepartment = async () => {
        if (!newDeptName.trim()) return;

        const newDeptData = {
            name: newDeptName,
            description: newDeptDescription
        };

        try {
            const response = await fetch('http://localhost:8080/api/management/departments/add', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(newDeptData)
            });

            if (response.ok) {
                const createdDept = await response.json();
                setDepartments(prev => [...prev, createdDept]);

                setNewDeptName('');
                setNewDeptDescription('');
                setShowAddDeptModal(false);
                if (showNotification) showNotification("✅ Відділ успішно створено!", "success");
            } else {
                const errorText = await response.text();
                console.error("Помилка сервера:", errorText);
                if (showNotification) showNotification(`🚨 Не вдалося створити відділ: ${errorText}`, "error");
            }
        } catch (error) {
            console.error("Помилка мережі:", error);
            if (showNotification) showNotification("🚨 Помилка мережі. Перевірте з'єднання.", "error");
        }
    };

    /**
     * Відкриває модальне вікно для підтвердження видалення відділу.
     */
    const handleDeleteDepartmentClick = () => {
        if (!editingDept || !editingDept.id) return;

        setConfirmModal({
            isOpen: true,
            title: 'Видалення відділу',
            text: 'Ви впевнені, що хочете видалити цей відділ? Цю дію не можна скасувати.',
            icon: '🗑️',
            onConfirm: () => executeDeleteDepartment()
        });
    };

    /**
     * Виконує видалення відділу з бекенду.
     *
     * @async
     * @returns {Promise<void>}
     */
    const executeDeleteDepartment = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/management/departments/${editingDept.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setDepartments(departments.filter(d => d.id !== editingDept.id));
                setIsEditModalOpen(false);
                setEditingDept(null);
                if (showNotification) showNotification("🗑️ Відділ успішно видалено", "success");
            } else {
                if (showNotification) showNotification("🚨 Помилка при видаленні відділу", "error");
            }
        } catch (error) {
            console.error("Помилка мережі:", error);
        } finally {
            closeConfirmModal();
        }
    };

    /**
     * Зберігає зміни відділу на бекенді.
     *
     * @async
     * @returns {Promise<void>}
     */
    const handleSaveDepartment = async () => {
        if (!editingDept) return;

        try {
            const response = await fetch('http://localhost:8080/api/management/departments/update', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(editingDept)
            });

            if (response.ok) {
                setDepartments(departments.map(d => d.id === editingDept.id ? editingDept : d));
                setIsEditModalOpen(false);
                if (showNotification) showNotification("💾 Зміни відділу збережено", "success");
            }
        } catch (error) {
            console.error("Помилка при збереженні:", error);
        }
    };

    /**
     * Відкриває модальне вікно для підтвердження призначення координатора відділу.
     *
     * @param {string|number} deptId - Ідентифікатор відділу.
     * @param {string|number} userId - Ідентифікатор користувача.
     */
    const handleSetCoordinatorClick = (deptId, userId) => {
        if (!userId) return;

        setConfirmModal({
            isOpen: true,
            title: 'Призначення координатора',
            text: 'Ви впевнені, що хочете призначити нового координатора для цього відділу?',
            icon: '👤',
            onConfirm: () => executeSetCoordinator(deptId, userId)
        });
    };

    /**
     * Виконує призначення координатора відділу.
     *
     * @async
     * @param {string|number} deptId - Ідентифікатор відділу.
     * @param {string|number} userId - Ідентифікатор користувача.
     * @returns {Promise<void>}
     */
    const executeSetCoordinator = async (deptId, userId) => {
        try {
            const response = await fetch(`http://localhost:8080/api/management/departments/${deptId}/set-coordinator`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(userId)
            });

            if (response.ok) {
                const data = await response.json();
                if (showNotification) showNotification(`✅ ${data.message}`, "success");

                setEditingDept(prev => ({
                    ...prev,
                    coordinatorId: userId
                }));

                const volunteersResponse = await fetch('http://localhost:8080/api/management/volunteers');
                if (volunteersResponse.ok) {
                    const updatedVolunteers = await volunteersResponse.json();
                    setVolunteers(updatedVolunteers);
                }
            }
        } catch (error) {
            console.error("Помилка мережі:", error);
        } finally {
            closeConfirmModal();
        }
    };

    /**
     * Відкриває модальне вікно для додавання волонтера до відділу.
     *
     * @param {Object} dept - Об'єкт відділу.
     * @returns {Promise<void>}
     */
    const handleOpenAddVolModal = async (dept) => {
        setSelectedDept(dept);

        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/management/departments/${dept.id}/volunteers/available`);

            if (!response.ok) throw new Error("Помилка завантаження");

            const data = await response.json();
            setAllAvailableVolunteers(data);
            setShowAddVolModal(true);
        } catch (error) {
            console.error("Помилка при отриманні волонтерів:", error);
            if (showNotification) showNotification("🚨 Помилка: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    /**
     * Додає волонтера до відділу.
     *
     * @async
     * @returns {Promise<void>}
     */
    const handleAddVolunteerToDept = async () => {
        if (!selectedUserId || !selectedDept) return;

        try {
            const response = await fetch(`http://localhost:8080/api/management/departments/${selectedDept.id}/add-volunteer`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(selectedUserId)
            });

            if (response.ok) {
                const addedVol = allAvailableVolunteers.find(v => v.id === selectedUserId);
                if (addedVol) {
                    setVolunteers(prev => [...prev, addedVol]);
                }
                setShowAddVolModal(false);
                if (showNotification) showNotification("👤 Волонтера успішно додано до відділу!", "success");
            } else {
                if (showNotification) showNotification("🚨 Не вдалося додати волонтера", "error");
            }
        } catch (error) {
            console.error("Помилка мережі:", error);
        }
    };

    /**
     * Відкриває модальне вікно з детальною інформацією про волонтера.
     *
     * @param {Object} vol - Об'єкт волонтера.
     * @returns {Promise<void>}
     */
    const handleOpenVolInfo = async (vol) => {
        try {
            const response = await fetch(`http://localhost:8080/api/management/volunteers/${vol.id}/details`);
            const data = await response.json();
            setViewingVol(data);
        } catch (error) {
            console.error("Помилка завантаження деталей:", error);
            if (showNotification) showNotification("🚨 Помилка завантаження деталей волонтера", "error");
        }
    };

    /**
     * Відкриває модальне вікно з детальною інформацією про замовника.
     *
     * @param {Object} customer - Об'єкт замовника.
     * @returns {Promise<void>}
     */
    const handleOpenCustomerInfo = async (customer) => {
        try {
            const response = await fetch(`http://localhost:8080/api/management/customers/${customer.id}/details`);
            if (!response.ok) throw new Error('Не вдалося завантажити деталі');
            const data = await response.json();

            setViewingCustomer(data);
        } catch (error) {
            console.error("Помилка завантаження деталей замовника:", error);
            if (showNotification) showNotification("🚨 Помилка завантаження деталей", "error");
        }
    };

    /**
     * Відкриває модальне вікно редагування відділу та завантажує координатора.
     *
     * @param {Object} dept - Об'єкт відділу.
     * @returns {Promise<void>}
     */
    const handleDeptClick = async (dept) => {
        setSelectedDept(dept);

        setShowAddVolModal(false);

        try {
            const response = await fetch(`http://localhost:8080/api/management/departments/${dept.id}/coordinator`);
            let coordId = null;

            if (response.ok) {
                const text = await response.text();
                if (text && text !== "") {
                    coordId = text.replace(/"/g, '');
                }
            }
            setEditingDept({...dept, coordinatorId: coordId});
            setIsEditModalOpen(true);
        } catch (e) {
            console.error("Помилка завантаження координатора:", e);
            setEditingDept({...dept, coordinatorId: null});
            setIsEditModalOpen(true);
        }
    };

    /**
     * Відкриває модальне вікно для підтвердження видалення волонтера з відділу.
     *
     * @param {string|number} userId - Ідентифікатор волонтера.
     */
    const handleRemoveVolunteerClick = (userId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Видалення волонтера',
            text: 'Ви впевнені, що хочете видалити волонтера з цього відділу?',
            icon: '⚠️',
            onConfirm: () => executeRemoveVolunteer(userId)
        });
    };

    /**
     * Оновлює статус документа зі списку очікування.
     *
     * @param {string|number} docId - Ідентифікатор документа.
     * @param {string} status - Новий статус.
     * @returns {Promise<void>}
     */
    const handleUpdateDocStatus = async (docId, status) => {
        const success = await sendDocStatus(docId, status, null);
        if (success) {
            setPendingDocs(prev => prev.filter(d => d.id !== docId));
        }
    };

    /**
     * Виконує видалення волонтера з відділу.
     *
     * @async
     * @param {string|number} userId - Ідентифікатор волонтера.
     * @returns {Promise<void>}
     */
    const executeRemoveVolunteer = async (userId) => {
        try {
            const response = await fetch(`http://localhost:8080/api/management/departments/${selectedDept.id}/remove-volunteer?userId=${userId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setVolunteers(prev => prev.filter(v => v.id !== userId));
                if (showNotification) showNotification("👤 Волонтера видалено з відділу", "success");
            }
        } catch (error) {
            console.error("Мережева помилка:", error);
        } finally {
            closeConfirmModal();
        }
    };

    const filteredDepartments = departments.filter(dept =>
        dept.name.toLowerCase().startsWith(deptSearch.toLowerCase())
    );

    const filteredVolunteers = volunteers.filter(vol =>
        vol.last_name.toLowerCase().startsWith(volSearchTerm.toLowerCase()) ||
        vol.first_name.toLowerCase().startsWith(volSearchTerm.toLowerCase())
    );

    return (
        <div className="admin-tab-content fade-in">

            <div className="glass-sub-section" style={{marginBottom: '25px'}}>
                <h3 className="tab-title" style={{fontSize: '20px', marginBottom: '15px'}}>Верифікація</h3>

                <div className="verification-table-header" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr 1fr 1fr',
                    padding: '10px 20px',
                    color: '#1e40af',
                    fontWeight: 'bold',
                    fontSize: '14px'
                }}>
                    <span>Код та користувач</span>
                    <span>ПІБ / Додаткова інформація</span>
                    <span>Документи</span>
                    <span style={{textAlign: 'right'}}>Дата створення</span>
                </div>

                <div className="verification-list-container">
                    {verificationList.length > 0 ? (
                        verificationList.map(item => {
                            const {user, department_id} = item;
                            const deptName = departments.find(d => d.id === department_id)?.name;

                            return (
                                <div key={user.id} className="verif-row-wrapper"
                                     style={{borderBottom: '1px solid rgba(30, 58, 138, 0.1)', marginBottom: '10px'}}>

                                    <div className="verification-row" style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 2fr 1fr 1fr',
                                        padding: '15px 20px',
                                        alignItems: 'center',
                                        background: 'rgba(255, 255, 255, 0.3)',
                                        borderRadius: '10px'
                                    }}>
                                        <span style={{fontWeight: '600', color: '#4b5563'}}>
                                            {user.id.substring(0, 8)}...
                                        </span>

                                        <div style={{display: 'flex', flexDirection: 'column'}}>
                                            <span style={{fontWeight: '700', color: '#1e3a8a'}}>
                                                {user.last_name} {user.first_name}
                                            </span>

                                            <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                                                <span style={{fontSize: '12px', color: '#6b7280'}}>{user.role}</span>

                                                {user.role === 'VOLUNTEER' && deptName && (
                                                    <span style={{
                                                        fontSize: '10px',
                                                        color: '#1d4ed8',
                                                        background: '#eff6ff',
                                                        padding: '1px 6px',
                                                        borderRadius: '4px',
                                                        fontWeight: '600',
                                                        border: '1px solid #dbeafe'
                                                    }}>Бажаний відділ: {deptName}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div onClick={() => toggleDocs(user.id)} style={{
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px'
                                        }}>
                                            <div style={{
                                                border: '1px solid #1e3a8a',
                                                borderRadius: '4px',
                                                padding: '2px 8px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                color: '#1e3a8a'
                                            }}>
                                                Переглянути документи {expandedUser === user.id ? '˄' : '⌄'}
                                            </div>
                                        </div>

                                        <div style={{
                                            textAlign: 'right',
                                            fontSize: '12px',
                                            color: '#6b7280',
                                            fontWeight: '500'
                                        }}>
                                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                                        </div>
                                    </div>

                                    {expandedUser === user.id && (
                                        <div className="docs-dropdown fade-in" style={{
                                            padding: '10px 40px',
                                            background: 'rgba(30, 58, 138, 0.05)',
                                            borderRadius: '0 0 10px 10px'
                                        }}>
                                            {userDocs[user.id] && userDocs[user.id].length > 0 ? (
                                                userDocs[user.id].map((doc, index) => (
                                                    <div key={index} style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        padding: '5px 0',
                                                        fontSize: '13px',
                                                        alignItems: 'center'
                                                    }}>
                                                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                                                           style={{
                                                               color: '#2563eb',
                                                               textDecoration: 'underline',
                                                               fontWeight: '500'
                                                           }}>
                                                            📄 {getFileNameFromUrl(doc.file_url)}
                                                        </a>

                                                        {doc.status === 'PENDING' || !doc.status ? (
                                                            <div style={{display: 'flex', gap: '10px'}}>
                                                                <button
                                                                    style={{
                                                                        background: 'none',
                                                                        border: 'none',
                                                                        color: '#16a34a',
                                                                        cursor: 'pointer',
                                                                        fontWeight: 'bold'
                                                                    }}
                                                                    onClick={() => handleApprove(doc.id)}
                                                                >Затвердити
                                                                </button>

                                                                <button
                                                                    style={{
                                                                        background: 'none',
                                                                        border: 'none',
                                                                        color: '#dc2626',
                                                                        cursor: 'pointer',
                                                                        fontWeight: 'bold'
                                                                    }}
                                                                    onClick={() => {
                                                                        setIsInitialVerification(true);
                                                                        setActiveDocId(doc.id);
                                                                        setActiveUserId(user.id);
                                                                        setShowRejectModal(true);
                                                                    }}
                                                                >Відхилити
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span style={{
                                                                fontWeight: '600',
                                                                color: doc.status === 'APPROVED' ? '#16a34a' : '#ef4444'
                                                            }}>
                                                                {doc.status === 'APPROVED' ? '✅ Затверджено' : '❌ Відхилено'}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <p style={{fontSize: '12px', color: '#9ca3af'}}>
                                                    {userDocs[user.id] ? 'Документів немає' : 'Завантаження документів...'}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div style={{padding: '40px', textAlign: 'center', color: '#6b7280'}}>
                            <p>На даний момент нових користувачів на верифікацію немає.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="glass-sub-section" style={{marginBottom: '25px'}}>
                <h3 className="tab-title" style={{fontSize: '20px', marginBottom: '15px'}}>Нові документи</h3>

                <div className="verification-list-container">
                    {pendingDocs.length > 0 ? (
                        pendingDocs.map(doc => (
                            <div key={doc.id} className="verification-row" style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr auto auto',
                                padding: '15px 20px',
                                marginBottom: '10px',
                                background: 'rgba(255, 255, 255, 0.4)',
                                borderRadius: '10px',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <span style={{fontWeight: '700', color: '#1e3a8a'}}>{doc.user_name}</span>
                                    <div style={{fontSize: '13px', color: '#6b7280'}}>
                                        <a href={doc.file_url} target="_blank"
                                           rel="noopener noreferrer">📄 {doc.title}</a>
                                    </div>
                                </div>

                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        gap: '12px',
                                        paddingRight: '20px'
                                    }}
                                >
                                    <button
                                        className="doc-action-btn approve"
                                        onClick={() => handleApprove(doc.id)}
                                    >
                                        Затвердити
                                    </button>

                                    <button
                                        className="doc-action-btn reject"
                                        onClick={() => {
                                            setIsInitialVerification(false);
                                            setActiveDocId(doc.id);
                                            setActiveUserId(doc.user_id);
                                            setShowRejectModal(true);
                                        }}
                                    >
                                        Відхилити
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={{padding: '15px', color: '#6b7280'}}>Нових документів немає.</p>
                    )}
                </div>
            </div>

            <div className="grid-split-sections"
                 style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start'}}>

                <div className="glass-sub-section"
                     style={{display: 'flex', flexDirection: 'column', minHeight: '300px'}}>
                    <div className="sub-section-header">
                        <h3>ВІДДІЛИ</h3>
                        <div className="search-bar-mini">
                            <input
                                type="text"
                                placeholder="Пошук відділу..."
                                value={deptSearch}
                                onChange={(e) => setDeptSearch(e.target.value)}
                            /> 🔍
                        </div>
                    </div>

                    <div className="list-items-box" style={{flex: 1, padding: '10px 0'}}>
                        {filteredDepartments.length > 0 ? (
                            filteredDepartments.map((dept) => (
                                <div
                                    key={dept.id}
                                    className="list-item"
                                    onClick={() => handleDeptClick(dept)}
                                    style={{
                                        cursor: 'pointer',
                                        background: selectedDept?.id === dept.id ? 'rgba(30, 58, 138, 0.2)' : 'transparent',
                                        transition: 'background 0.2s ease'
                                    }}
                                >
                                    {dept.name}
                                </div>
                            ))
                        ) : (
                            <div style={{padding: '10px', color: '#6b7280'}}>Нічого не знайдено</div>
                        )}
                    </div>
                    <button
                        className="btn-add-new-item"
                        style={{marginTop: '15px'}}
                        onClick={() => setShowAddDeptModal(true)}
                    >
                        Додати відділ
                    </button>

                    {showAddDeptModal && (
                        <div className="modal-overlay" style={{
                            zIndex: 2000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0, 0, 0, 0.15)',
                            backdropFilter: 'blur(4px)'
                        }}>
                            <div className="modal-content" style={{
                                width: '480px',
                                padding: 0,
                                background: '#fff',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                                border: 'none'
                            }}>
                                <div className="modal-header" style={{
                                    background: '#3b82f6',
                                    padding: '20px 24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    border: 'none'
                                }}>
                                    <h3 style={{
                                        margin: 0,
                                        color: '#fff',
                                        fontSize: '20px',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}>
                                        📁 Створити відділ
                                    </h3>
                                    <button className="modal-close" onClick={() => setShowAddDeptModal(false)} style={{
                                        background: 'rgba(255,255,255,0.2)',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        color: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}>✕
                                    </button>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    flex: 1,
                                    flexDirection: 'column',
                                    gap: '18px',
                                    padding: '24px'
                                }}>
                                    <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                                        <label style={{fontSize: '14px', fontWeight: '600', color: '#1e3a8a'}}>Назва
                                            відділу:</label>
                                        <input
                                            type="text"
                                            className="main-search-input"
                                            style={{
                                                width: '100%',
                                                padding: '14px 16px',
                                                boxSizing: 'border-box',
                                                background: '#f0f7ff',
                                                border: '1px solid #cbd5e1',
                                                borderRadius: '14px',
                                                fontSize: '15px'
                                            }}
                                            placeholder="Введіть назву..."
                                            value={newDeptName}
                                            onChange={(e) => setNewDeptName(e.target.value)}
                                        />
                                    </div>

                                    <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                                        <label style={{fontSize: '14px', fontWeight: '600', color: '#1e3a8a'}}>Короткий
                                            опис:</label>
                                        <textarea
                                            className="main-search-input"
                                            style={{
                                                width: '100%',
                                                height: '120px',
                                                padding: '14px 16px',
                                                boxSizing: 'border-box',
                                                resize: 'none',
                                                background: '#f0f7ff',
                                                border: '1px solid #cbd5e1',
                                                borderRadius: '14px',
                                                fontSize: '15px'
                                            }}
                                            placeholder="Опишіть діяльність відділу..."
                                            value={newDeptDescription}
                                            onChange={(e) => setNewDeptDescription(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    gap: '12px',
                                    justifyContent: 'center',
                                    padding: '0 24px 24px 24px'
                                }}>
                                    <button style={{
                                        background: '#3b82f6',
                                        padding: '12px 32px',
                                        cursor: 'pointer',
                                        border: 'none',
                                        color: '#fff',
                                        borderRadius: '14px',
                                        fontSize: '15px',
                                        fontWeight: '600'
                                    }} onClick={handleAddDepartment}>Зберегти
                                    </button>
                                    <button style={{
                                        background: '#eff6ff',
                                        padding: '12px 32px',
                                        cursor: 'pointer',
                                        border: '1px solid #bfdbfe',
                                        color: '#1e40af',
                                        borderRadius: '14px',
                                        fontSize: '15px',
                                        fontWeight: '600'
                                    }} onClick={() => setShowAddDeptModal(false)}>Скасувати
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {isEditModalOpen && editingDept && (
                        <div className="modal-overlay" style={{
                            zIndex: 2000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0, 0, 0, 0.15)',
                            backdropFilter: 'blur(4px)'
                        }}>
                            <div className="modal-content" style={{
                                width: '480px',
                                padding: 0,
                                background: '#fff',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                                border: 'none'
                            }}>
                                <div className="modal-header" style={{
                                    background: '#3b82f6',
                                    padding: '20px 24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    border: 'none'
                                }}>
                                    <h3 style={{margin: 0, color: '#fff', fontSize: '20px', fontWeight: '600'}}>✏️
                                        Редагування відділу</h3>
                                    <button className="modal-close" onClick={() => setIsEditModalOpen(false)} style={{
                                        background: 'rgba(255,255,255,0.2)',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        color: '#fff',
                                        cursor: 'pointer'
                                    }}>✕
                                    </button>
                                </div>

                                <div style={{display: 'flex', flexDirection: 'column', gap: '18px', padding: '24px'}}>
                                    <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                                        <label style={{fontSize: '14px', fontWeight: '600', color: '#1e3a8a'}}>Назва
                                            відділу:</label>
                                        <input type="text" className="main-search-input" style={{
                                            width: '100%',
                                            padding: '14px 16px',
                                            boxSizing: 'border-box',
                                            background: '#f0f7ff',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '14px'
                                        }} value={editingDept.name} onChange={(e) => setEditingDept({
                                            ...editingDept,
                                            name: e.target.value
                                        })}/>
                                    </div>

                                    <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                                        <label style={{fontSize: '14px', fontWeight: '600', color: '#1e3a8a'}}>Короткий
                                            опис:</label>
                                        <textarea className="main-search-input" style={{
                                            width: '100%',
                                            height: '80px',
                                            padding: '14px 16px',
                                            boxSizing: 'border-box',
                                            resize: 'none',
                                            background: '#f0f7ff',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '14px'
                                        }} value={editingDept.description} onChange={(e) => setEditingDept({
                                            ...editingDept,
                                            description: e.target.value
                                        })}/>
                                    </div>

                                    <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                                        <label style={{fontSize: '14px', fontWeight: '600', color: '#1e3a8a'}}>Призначити
                                            координатора:</label>
                                        <select
                                            className="main-search-input"
                                            style={{
                                                width: '100%',
                                                padding: '14px 16px',
                                                cursor: volunteers.length === 0 ? 'not-allowed' : 'pointer',
                                                background: volunteers.length === 0 ? '#f3f4f6' : '#f0f7ff',
                                                border: '1px solid #cbd5e1',
                                                borderRadius: '14px',
                                                color: volunteers.length === 0 ? '#9ca3af' : '#1f2937'
                                            }}
                                            value={editingDept.coordinatorId || ""}
                                            onChange={(e) => handleSetCoordinatorClick(editingDept.id, e.target.value)}
                                            disabled={volunteers.length === 0}
                                        >
                                            <option value="" disabled>
                                                {volunteers.length === 0 ? "📌 Немає волонтерів для призначення" : "Оберіть координатора"}
                                            </option>
                                            {volunteers.map(vol => (
                                                <option key={vol.id} value={vol.id}>
                                                    {vol.last_name} {vol.first_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    gap: '12px',
                                    justifyContent: 'space-between',
                                    padding: '0 24px 24px 24px'
                                }}>
                                    <button onClick={handleDeleteDepartmentClick} style={{
                                        background: '#fef2f2',
                                        color: '#dc2626',
                                        border: '1px solid #fca5a5',
                                        padding: '12px 20px',
                                        borderRadius: '14px',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}>Видалити
                                    </button>
                                    <div style={{display: 'flex', gap: '12px'}}>
                                        <button onClick={() => setIsEditModalOpen(false)} style={{
                                            background: '#eff6ff',
                                            border: '1px solid #bfdbfe',
                                            color: '#1e40af',
                                            padding: '12px 28px',
                                            borderRadius: '14px',
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}>Скасувати
                                        </button>
                                        <button onClick={handleSaveDepartment} style={{
                                            background: '#3b82f6',
                                            color: 'white',
                                            border: 'none',
                                            padding: '12px 28px',
                                            borderRadius: '14px',
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}>Зберегти
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="glass-sub-section"
                     style={{display: 'flex', flexDirection: 'column', minHeight: '300px'}}>
                    <div className="sub-section-header">
                        <h3>
                            {selectedDept ? `ВОЛОНТЕРИ: ${selectedDept.name}` : "ВСІ ВОЛОНТЕРИ"}
                        </h3>

                        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                            {selectedDept && (
                                <button onClick={() => setSelectedDept(null)} style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#1e3a8a',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    textDecoration: 'underline'
                                }}>
                                    [ Показати всіх ]
                                </button>
                            )}

                            <div className="search-bar-mini">
                                <input
                                    type="text"
                                    placeholder="Пошук волонтера..."
                                    value={volSearchTerm}
                                    onChange={(e) => setVolSearchTerm(e.target.value)}
                                /> 🔍
                            </div>
                        </div>
                    </div>

                    <div className="list-items-box" style={{flex: 1, padding: '10px 0'}}>
                        {volunteersLoading ? (
                            <div style={{padding: '20px', textAlign: 'center'}}>Завантаження...</div>
                        ) : (
                            filteredVolunteers.length > 0 ? (
                                filteredVolunteers.map(vol => (
                                    <div key={vol.id} className="vol-list-item" onClick={() => handleOpenVolInfo(vol)}>
                                        <span>{vol.last_name} {vol.first_name}</span>
                                        {selectedDept && (
                                            <button className="btn-delete-vol" onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveVolunteerClick(vol.id);
                                            }}>✕</button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div style={{padding: '20px', color: '#6b7280', textAlign: 'center'}}>
                                    {volSearchTerm ? "Нічого не знайдено" : "У цьому відділі поки немає волонтерів"}
                                </div>
                            )
                        )}
                    </div>

                    {selectedDept && (
                        <button className="btn-add-new-item" onClick={() => handleOpenAddVolModal(selectedDept)}>
                            Додати до відділу
                        </button>
                    )}

                    {showAddVolModal && (
                        <div className="modal-overlay" style={{
                            zIndex: 2000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0, 0, 0, 0.15)',
                            backdropFilter: 'blur(4px)'
                        }}>
                            <div className="modal-content" style={{
                                width: '480px',
                                padding: 0,
                                background: '#fff',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                            }}>
                                <div className="modal-header" style={{
                                    background: '#3b82f6',
                                    padding: '20px 24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <h3 style={{margin: 0, color: '#fff', fontSize: '18px', fontWeight: '600'}}>➕ Додати
                                        волонтера до відділу</h3>
                                    <button className="modal-close" onClick={() => setShowAddVolModal(false)} style={{
                                        background: 'rgba(255,255,255,0.2)',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        color: '#fff',
                                        cursor: 'pointer'
                                    }}>✕
                                    </button>
                                </div>
                                <div style={{padding: '24px', display: 'flex', flexDirection: 'column', gap: '15px'}}>
                                    <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                                        <label style={{fontSize: '14px', fontWeight: '600', color: '#1e3a8a'}}>Оберіть
                                            волонтера зі списку:</label>
                                        <select
                                            className="main-search-input"
                                            value={selectedUserId}
                                            onChange={(e) => setSelectedUserId(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '14px 16px',
                                                background: '#f0f7ff',
                                                border: '1px solid #cbd5e1',
                                                borderRadius: '14px',
                                                cursor: 'pointer',
                                                fontSize: '15px'
                                            }}
                                        >
                                            <option value="">Виберіть волонтера</option>
                                            {allAvailableVolunteers.length === 0 ? (
                                                <option value="" disabled>Немає доступних волонтерів</option>
                                            ) : (
                                                allAvailableVolunteers.map(v => (
                                                    <option key={v.id} value={v.id}>
                                                        {v.last_name} {v.first_name}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                        {allAvailableVolunteers.length === 0 && (
                                            <div style={{
                                                fontSize: '13px',
                                                color: '#dc2626',
                                                marginTop: '8px',
                                                textAlign: 'center'
                                            }}>
                                                ⚠️ Немає доступних волонтерів для додавання
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    gap: '12px',
                                    justifyContent: 'center',
                                    padding: '0 24px 24px 24px'
                                }}>
                                    <button onClick={handleAddVolunteerToDept}
                                            disabled={!selectedUserId || allAvailableVolunteers.length === 0} style={{
                                        background: selectedUserId && allAvailableVolunteers.length > 0 ? '#3b82f6' : '#94a3b8',
                                        color: 'white',
                                        border: 'none',
                                        padding: '12px 28px',
                                        borderRadius: '14px',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        cursor: selectedUserId && allAvailableVolunteers.length > 0 ? 'pointer' : 'not-allowed'
                                    }}>Додати
                                    </button>
                                    <button onClick={() => setShowAddVolModal(false)} style={{
                                        background: '#eff6ff',
                                        border: '1px solid #bfdbfe',
                                        color: '#1e40af',
                                        padding: '12px 28px',
                                        borderRadius: '14px',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}>Скасувати
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {viewingVol && (
                        <div className="modal-overlay" style={{
                            zIndex: 2000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0, 0, 0, 0.15)',
                            backdropFilter: 'blur(4px)'
                        }}>
                            <div className="modal-content" style={{
                                width: '520px',
                                padding: 0,
                                background: '#fff',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                            }}>
                                <div className="modal-header" style={{
                                    background: '#3b82f6',
                                    padding: '20px 24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <h3 style={{margin: 0, color: '#fff', fontSize: '20px', fontWeight: '600'}}>📄
                                        Розширена інформація</h3>
                                    <button onClick={() => setViewingVol(null)} style={{
                                        background: 'rgba(255,255,255,0.2)',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        color: '#fff',
                                        cursor: 'pointer'
                                    }}>✕
                                    </button>
                                </div>

                                <div style={{padding: '24px'}}>
                                    <div style={{
                                        background: '#f0f7ff',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '18px',
                                        padding: '8px 16px'
                                    }}>
                                        <p style={{margin: '10px 0', fontSize: '15px'}}><strong>👤
                                            ПІБ:</strong> {viewingVol.user.last_name} {viewingVol.user.first_name} {viewingVol.user.patronymic}
                                        </p>
                                        <p style={{margin: '10px 0', fontSize: '15px'}}><strong>✉️
                                            Email:</strong> {viewingVol.user.email}</p>
                                        <p style={{margin: '10px 0', fontSize: '15px'}}><strong>📞
                                            Телефон:</strong> {viewingVol.user.phone_number}</p>
                                        <p style={{margin: '10px 0', fontSize: '15px'}}><strong>🎂
                                            Д.Н.:</strong> {viewingVol.user.dob}</p>
                                        <p style={{margin: '10px 0', fontSize: '15px'}}><strong>⭐ Роль:</strong> <span
                                            style={{
                                                background: viewingVol.user.role === 'COORDINATOR' ? '#f59e0b' : '#3b82f6',
                                                color: '#fff',
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                fontSize: '12px'
                                            }}>{viewingVol.user.role === 'COORDINATOR' ? 'Координатор' : 'Волонтер'}</span>
                                        </p>
                                    </div>

                                    <h4 style={{margin: '20px 0 10px 0', color: '#1e3a8a'}}>📂 Документи волонтера</h4>
                                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                        {viewingVol.documents && viewingVol.documents.length > 0 ? (
                                            viewingVol.documents.map(doc => (
                                                <div key={doc.id} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    background: '#f8fafc',
                                                    border: '1px solid #e2e8f0',
                                                    padding: '12px 16px',
                                                    borderRadius: '12px',
                                                    alignItems: 'center'
                                                }}>
                                                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                                                       style={{
                                                           color: '#2563eb',
                                                           textDecoration: 'underline',
                                                           fontWeight: '500',
                                                           fontSize: '14px'
                                                       }}>
                                                        📄 {getFileNameFromUrl(doc.file_url)}
                                                    </a>
                                                    <span style={{
                                                        fontWeight: '700',
                                                        fontSize: '12px',
                                                        color: doc.status === 'APPROVED' ? 'green' : (doc.status === 'REJECTED' ? 'red' : 'orange')
                                                    }}>
                                                        {doc.status}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{
                                                padding: '12px',
                                                border: '1px dashed #cbd5e1',
                                                textAlign: 'center',
                                                borderRadius: '12px',
                                                color: '#64748b'
                                            }}>Документи відсутні</div>
                                        )}
                                    </div>
                                </div>
                                <div style={{display: 'flex', justifyContent: 'center', padding: '0 24px 24px 24px'}}>
                                    <button onClick={() => setViewingVol(null)} style={{
                                        background: '#eff6ff',
                                        border: '1px solid #bfdbfe',
                                        color: '#1e40af',
                                        padding: '12px 40px',
                                        borderRadius: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}>Закрити
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showRejectModal && (
                <div className="custom-reject-overlay">
                    <div className="custom-reject-card">
                        <div className="custom-reject-header">
                            <h3 className="custom-reject-title">🛑 Причина відмови</h3>
                            <button className="custom-reject-close" onClick={() => setShowRejectModal(false)}>✕</button>
                        </div>
                        <div className="custom-reject-body">
                            <textarea
                                className="custom-reject-textarea"
                                placeholder="Вкажіть, що саме не так із наданими документами..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            />
                        </div>
                        <div className="custom-reject-actions">
                            <button className="btn-reject-submit" onClick={handleSendRejectReason}>Відправити</button>
                            <button className="btn-reject-cancel" onClick={() => setShowRejectModal(false)}>Скасувати
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmModal.isOpen && (
                <div className="custom-confirm-overlay">
                    <div className="custom-confirm-card">
                        <div className="custom-confirm-icon">{confirmModal.icon}</div>
                        <h3 className="custom-confirm-title">{confirmModal.title}</h3>
                        <p className="custom-confirm-text">{confirmModal.text}</p>
                        <div className="custom-confirm-actions">
                            <button className="btn-confirm-cancel" onClick={closeConfirmModal}>Скасувати</button>
                            <button
                                className={`btn-confirm-execute ${confirmModal.title.toLowerCase().includes('видал') ? 'danger-action' : ''}`}
                                onClick={confirmModal.onConfirm}
                            >
                                Так, виконати
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="glass-sub-section" style={{marginTop: '40px', marginBottom: '25px', padding: '20px'}}>
                <div className="sub-section-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px'
                }}>
                    <h3>ЗАМОВНИКИ
                        ({customers.filter(c => c.last_name?.toLowerCase().startsWith(customerSearch.toLowerCase())).length})</h3>

                    <div className="search-bar-mini">
                        <input
                            type="text"
                            placeholder="Пошук (за прізвищем)..."
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                outline: 'none',
                                width: '200px'
                            }}
                        /> 🔍
                    </div>
                </div>

                <div className="list-items-box" style={{padding: '10px 0', maxHeight: '300px', overflowY: 'auto'}}>
                    {customers
                        .filter(c => c.last_name?.toLowerCase().startsWith(customerSearch.toLowerCase()))
                        .map(customer => (
                            <div
                                key={customer.id}
                                className="list-item"
                                onClick={() => handleOpenCustomerInfo(customer)}
                                style={{cursor: 'pointer', padding: '10px', borderBottom: '1px solid #f1f5f9'}}
                            >
                                {customer.last_name} {customer.first_name}
                            </div>
                        ))
                    }
                </div>

                {viewingCustomer && (
                    <div className="modal-overlay" style={{
                        zIndex: 2000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0, 0, 0, 0.15)',
                        backdropFilter: 'blur(4px)'
                    }}>
                        <div className="modal-content" style={{
                            width: '520px',
                            padding: 0,
                            background: '#fff',
                            borderRadius: '24px',
                            overflow: 'hidden',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                        }}>
                            <div className="modal-header" style={{
                                background: '#3b82f6',
                                padding: '20px 24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <h3 style={{margin: 0, color: '#fff', fontSize: '20px', fontWeight: '600'}}>👤 Профіль
                                    замовника</h3>
                                <button onClick={() => setViewingCustomer(null)} style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    color: '#fff',
                                    cursor: 'pointer'
                                }}>✕
                                </button>
                            </div>

                            <div style={{padding: '24px'}}>
                                <div style={{
                                    background: '#f0f7ff',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '18px',
                                    padding: '16px'
                                }}>
                                    <p style={{margin: '10px 0', fontSize: '15px'}}><strong>👤
                                        ПІБ:</strong> {viewingCustomer.user.last_name} {viewingCustomer.user.first_name} {viewingCustomer.user.patronymic}
                                    </p>
                                    <p style={{margin: '10px 0', fontSize: '15px'}}><strong>📞
                                        Телефон:</strong> {viewingCustomer.user.phone_number || 'Не вказано'}</p>
                                    <p style={{margin: '10px 0', fontSize: '15px'}}><strong>🎂 Дата
                                        народження:</strong> {viewingCustomer.user.dob || 'Не вказано'}</p>
                                    <p style={{margin: '10px 0', fontSize: '15px'}}><strong>✉️
                                        Email:</strong> {viewingCustomer.user.email}</p>
                                </div>

                                <h4 style={{margin: '20px 0 10px 0', color: '#1e3a8a'}}>📂 Документи замовника</h4>
                                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                    {viewingCustomer.documents && viewingCustomer.documents.length > 0 ? (
                                        viewingCustomer.documents.map(doc => (
                                            <div key={doc.id} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                background: '#f8fafc',
                                                border: '1px solid #e2e8f0',
                                                padding: '12px 16px',
                                                borderRadius: '12px',
                                                alignItems: 'center'
                                            }}>
                                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                                                   style={{
                                                       color: '#2563eb',
                                                       textDecoration: 'underline',
                                                       fontWeight: '500',
                                                       fontSize: '14px'
                                                   }}>
                                                    📄 {getFileNameFromUrl(doc.file_url)}
                                                </a>
                                                <span style={{
                                                    fontWeight: '700',
                                                    fontSize: '12px',
                                                    color: doc.status === 'APPROVED' ? 'green' : (doc.status === 'REJECTED' ? 'red' : 'orange')
                                                }}>
                                                    {doc.status}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{
                                            padding: '12px',
                                            border: '1px dashed #cbd5e1',
                                            textAlign: 'center',
                                            borderRadius: '12px',
                                            color: '#64748b'
                                        }}>Документи відсутні</div>
                                    )}
                                </div>
                            </div>

                            <div style={{display: 'flex', justifyContent: 'center', padding: '0 24px 24px 24px'}}>
                                <button onClick={() => setViewingCustomer(null)} style={{
                                    background: '#eff6ff',
                                    border: '1px solid #bfdbfe',
                                    color: '#1e40af',
                                    padding: '12px 40px',
                                    borderRadius: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}>Закрити
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}