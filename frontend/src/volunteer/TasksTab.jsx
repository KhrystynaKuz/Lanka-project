import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

import { supabase } from '../supabaseClient';

// Компонент тосту
const Toast = ({ message, type, onClose }) => {
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast-item toast-${type}`}>
            <span>{message}</span>
            <button className="toast-close-btn" onClick={onClose}>✕</button>
        </div>
    );
};

// Компонент модального вікна підтвердження
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Так, виконати", cancelText = "Скасувати", isDanger = false }) => {
    if (!isOpen) return null;

    return (
        <div className="custom-confirm-overlay" onClick={onClose} style={{ zIndex: 10001 }}>
            <div className="custom-confirm-card" onClick={(e) => e.stopPropagation()}>
                <div className="custom-confirm-icon">
                    {isDanger ? '⚠️' : '✅'}
                </div>
                <h3 className="custom-confirm-title">{title || "Підтвердження"}</h3>
                <p className="custom-confirm-text">
                    {message || "Ви впевнені, що хочете виконати цю дію?"}
                </p>
                <div className="custom-confirm-actions">
                    <button className="btn-confirm-cancel" onClick={onClose}>
                        {cancelText}
                    </button>
                    <button className={`btn-confirm-execute ${isDanger ? 'danger-action' : ''}`} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function TasksTab() {
    const [tasks, setTasks] = useState([]);
    const [files, setFiles] = useState({});
    const [loading, setLoading] = useState(true);
    const [toasts, setToasts] = useState([]);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        task: null,
        action: null
    });
    const userId = localStorage.getItem('userId');

    const addToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const closeConfirmModal = () => {
        setConfirmModal({ isOpen: false, task: null, action: null });
    };

    useEffect(() => {
        if (userId) fetchTasks();
    }, [userId]);

    const fetchTasks = async () => {
        try {
            const res = await fetch(`http://localhost:8080/api/tasks/volunteer/${userId}`);
            const data = await res.json();
            setTasks(data.filter(t => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS'));
            setLoading(false);
        } catch (err) {
            console.error("Помилка завантаження:", err);
            addToast("🚨 Помилка завантаження завдань", "error");
            setLoading(false);
        }
    };

    const handleFileChange = (taskId, file) => {
        setFiles(prev => ({ ...prev, [taskId]: file }));
        addToast(`📎 Файл "${file.name}" додано до завдання`, "info");
    };

    const uploadToSupabase = async (file, taskId) => {
        const fileExt = file.name.split('.').pop();
        const safeFileName = `report_${Date.now()}.${fileExt}`;
        const filePath = `${taskId}/${safeFileName}`;

        const { data, error } = await supabase.storage
            .from('task-reports')
            .upload(filePath, file, {
                upsert: true
            });

        if (error) {
            console.error("Помилка Supabase:", error);
            throw error;
        }

        const { data: publicUrlData } = supabase.storage
            .from('task-reports')
            .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
    };

    const handleTaskCompletion = async (task) => {
        const file = files[task.id];
        let fileUrls = [];

        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, updating: true } : t));

        try {
            if (file) {
                const url = await uploadToSupabase(file, task.id);
                fileUrls.push(url);
            }

            const response = await fetch(`http://localhost:8080/api/tasks/submit-report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task_id: task.id,
                    author_id: userId,
                    content: "Звіт про виконання",
                    attached_files_urls: fileUrls
                })
            });

            if (response.ok) {
                addToast("✅ Звіт про виконання успішно відправлено!", "success");
                setTasks(prev => prev.filter(t => t.id !== task.id));
                setFiles(prev => {
                    const newFiles = { ...prev };
                    delete newFiles[task.id];
                    return newFiles;
                });
            } else {
                addToast("🚨 Помилка при відправленні звіту", "error");
                setTasks(prev => prev.map(t => t.id === task.id ? { ...t, updating: false } : t));
            }
        } catch (err) {
            console.error("Помилка:", err);
            addToast("🚨 Помилка при відправленні звіту", "error");
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, updating: false } : t));
        }
    };

    const openUpdateStatusModal = (task, newStatus) => {
        let title = "";
        let message = "";
        let confirmText = "";

        if (newStatus === 'IN_PROGRESS') {
            title = "Початок виконання";
            message = "Ви впевнені, що хочете розпочати виконання цього завдання?";
            confirmText = "Так, почати";
        } else if (newStatus === 'CANCELLED') {
            title = "Скасування завдання";
            message = "Ви впевнені, що хочете скасувати це завдання? Його буде переміщено до архіву.";
            confirmText = "Так, скасувати";
        } else {
            title = "Зміна статусу";
            message = `Ви впевнені, що хочете змінити статус завдання на "${newStatus}"?`;
            confirmText = "Так, змінити";
        }

        setConfirmModal({
            isOpen: true,
            task: task,
            action: newStatus,
            title: title,
            message: message,
            confirmText: confirmText,
            isDanger: newStatus === 'CANCELLED'
        });
    };

    const executeUpdateStatus = async () => {
        const { task, action } = confirmModal;

        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: action, updating: true } : t));

        try {
            const response = await fetch(`http://localhost:8080/api/tasks/update-status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...task, status: action })
            });

            if (response.ok) {
                if (action === 'COMPLETED' || action === 'CANCELLED') {
                    addToast(action === 'CANCELLED' ? "📦 Завдання переміщено до архіву" : "✅ Завдання виконано!", "success");
                    setTasks(prev => prev.filter(t => t.id !== task.id));
                } else if (action === 'IN_PROGRESS') {
                    addToast("⚙️ Статус змінено на 'В процесі'", "success");
                    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, updating: false } : t));
                } else {
                    addToast(`✅ Статус змінено на "${action}"`, "success");
                    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, updating: false } : t));
                }
            } else {
                addToast("🚨 Помилка при оновленні статусу", "error");
                setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status, updating: false } : t));
            }
        } catch (err) {
            console.error("Помилка:", err);
            addToast("🚨 Помилка мережі при оновленні статусу", "error");
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status, updating: false } : t));
        } finally {
            closeConfirmModal();
        }
    };

    const handleStatusChange = (task, newStatus) => {
        openUpdateStatusModal(task, newStatus);
    };

    if (loading) return <div className="volunteer-loader">Завантаження...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <div className="toast-notifications-container">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirmModal}
                onConfirm={executeUpdateStatus}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                cancelText="Скасувати"
                isDanger={confirmModal.isDanger}
            />

            {tasks.length > 0 ? (
                tasks.map(task => (
                    <div className={`volunteer-task-card ${task.updating ? 'loading-opacity' : ''}`} key={task.id}>
                        {task.updating && <div className="loading-overlay">Оновлення...</div>}

                        <div className="volunteer-task-header">
                            <h3>ЗАВДАННЯ №{task.id.toString().slice(-4)}</h3>
                            <span className="volunteer-task-link">
                                ЗАЯВКА: {task.requestTitle || `№${task.request_id?.toString().slice(-4)}`}
                            </span>
                        </div>

                        <div className="volunteer-task-body">
                            <p><strong>Опис:</strong> {task.description}</p>

                            <div className="volunteer-status-row">
                                <strong>Статус:</strong>
                                <select
                                    className="volunteer-select"
                                    value={task.status}
                                    onChange={(e) => handleStatusChange(task, e.target.value)}
                                >
                                    <option value="ASSIGNED">Призначено ⏳</option>
                                    <option value="IN_PROGRESS">В процесі ⚙️</option>
                                    <option value="CANCELLED">Скасувати завдання ❌</option>
                                </select>
                            </div>

                            <div className="volunteer-upload-row">
                                <strong>Звітувати про виконання:</strong>
                                <label className="volunteer-upload-btn">
                                    {files[task.id] ? 'Файл обрано' : 'Завантажити 📎'}
                                    <input type="file" style={{ display: 'none' }} onChange={(e) => handleFileChange(task.id, e.target.files[0])} />
                                </label>
                                {files[task.id] && <span className="volunteer-file-badge">{files[task.id].name}</span>}
                            </div>
                        </div>

                        <button className="volunteer-circle-approve-btn" onClick={() => handleTaskCompletion(task)} title="Позначити як виконане">
                            ✓
                        </button>
                    </div>
                ))
            ) : (
                <div className="volunteer-empty-tasks">
                    <p>Наразі нових завдань немає</p>
                    <span>❤️</span>
                </div>
            )}
        </div>
    );
}