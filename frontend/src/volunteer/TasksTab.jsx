import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://dxgywtqqzpyrueostjdy.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4Z3l3dHFxenB5cnVlb3N0amR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNDkxMzQsImV4cCI6MjA5NTYyNTEzNH0.KByZtg1i6nGoHuVdLXAKkvJZmVeA7IqLNsur1xSu8bk');

export default function TasksTab() {
    const [tasks, setTasks] = useState([]);
    const [files, setFiles] = useState({});
    const [loading, setLoading] = useState(true);
    const userId = localStorage.getItem('userId');

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
            setLoading(false);
        }
    };

    const handleFileChange = (taskId, file) => {
        setFiles(prev => ({ ...prev, [taskId]: file }));
    };

    const uploadToSupabase = async (file, taskId) => {
        const fileName = `${taskId}/${file.name}`;

        const { data, error } = await supabase.storage
            .from('task-reports')
            .upload(fileName, file, {
                upsert: true
            });

        if (error) {
            console.error("Помилка Supabase:", error);
            throw error;
        }

        const { data: publicUrlData } = supabase.storage
            .from('task-reports')
            .getPublicUrl(fileName);

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

            await fetch(`http://localhost:8080/api/tasks/submit-report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task_id: task.id,
                    author_id: userId,
                    content: "Звіт про виконання",
                    attached_files_urls: fileUrls
                })
            });

            setTasks(prev => prev.filter(t => t.id !== task.id));
        } catch (err) {
            console.error("Помилка:", err);
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, updating: false } : t));
        }
    };

    const updateStatus = async (task, newStatus) => {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus, updating: true } : t));

        try {
            await fetch(`http://localhost:8080/api/tasks/update-status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...task, status: newStatus })
            });

            if (newStatus === 'COMPLETED' || newStatus === 'CANCELLED') {
                setTasks(prev => prev.filter(t => t.id !== task.id));
            } else {
                setTasks(prev => prev.map(t => t.id === task.id ? { ...t, updating: false } : t));
            }
        } catch (err) {
            console.error("Помилка:", err);
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status, updating: false } : t));
        }
    };

    if (loading) return <div className="volunteer-loader">Завантаження...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            {tasks.length > 0 ? (
                tasks.map(task => (
                    <div className={`volunteer-task-card ${task.updating ? 'loading-opacity' : ''}`} key={task.id}>
                        {task.updating && <div className="loading-overlay">Оновлення...</div>}

                        <div className="volunteer-task-header">
                            <h3>ЗАВДАННЯ №{task.id.toString().slice(-4)}</h3>
                            <span className="volunteer-task-link">Прив'язано до ЗАЯВКИ №{task.request_id?.toString().slice(-4)}</span>
                        </div>

                        <div className="volunteer-task-body">
                            <p><strong>Опис:</strong> {task.description}</p>

                            <div className="volunteer-status-row">
                                <strong>Статус:</strong>
                                <select className="volunteer-select" value={task.status} onChange={(e) => updateStatus(task, e.target.value)}>
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