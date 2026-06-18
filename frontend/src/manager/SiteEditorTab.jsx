import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { API_BASE_URL } from '../App';
/**
 * Компонент сповіщення (тосту), яке автоматично зникає через 4 секунди.
 *
 * @component
 * @param {Object} props - Властивості компонента.
 * @param {string} props.message - Текст сповіщення.
 * @param {string} props.type - Тип сповіщення ('info', 'success', 'error', 'warning').
 * @param {Function} props.onClose - Функція закриття сповіщення.
 * @returns {JSX.Element} Рендер тосту.
 */
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
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

/**
 * Головний компонент вкладки "Редактор сайту" для адміністратора.
 * Дозволяє керувати вмістом головної сторінки, списком зборів та звітами.
 *
 * @component
 * @returns {JSX.Element} Рендер редактора сайту.
 */
export default function SiteEditorTab() {

    const [homeTitle, setHomeTitle] = useState('');
    const [homeDescription, setHomeDescription] = useState('');
    const [homeImage, setHomeImage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const [fundraisers, setFundraisers] = useState([]);
    const [isFundraisersLoading, setIsFundraisersLoading] = useState(false);
    const [isFundraisersUploading, setIsFundraisersUploading] = useState(false);

    const [reportPhotos, setReportPhotos] = useState([]);
    const [reportDocs, setReportDocs] = useState([]);
    const [isReportsUploading, setIsReportsUploading] = useState(false);

    const [toasts, setToasts] = useState([]);

    /**
     * Додає нове сповіщення до списку.
     *
     * @param {string} message - Текст сповіщення.
     * @param {string} [type='info'] - Тип сповіщення.
     */
    const addToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    /**
     * Видаляє сповіщення зі списку за ідентифікатором.
     *
     * @param {number} id - Ідентифікатор сповіщення.
     */
    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    useEffect(() => {
        /**
         * Завантажує всі дані для редактора: налаштування головної сторінки,
         * список зборів та звіти.
         *
         * @async
         * @returns {Promise<void>}
         */
        const fetchAllData = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/site-editor/settings`);
                if (res.ok) {
                    const data = await res.json();
                    setHomeTitle(data.home_title || 'ЛАНКА');
                    setHomeDescription(data.home_description || '');
                    setHomeImage(data.home_image || '');
                }
            } catch (e) { console.error("Settings error", e); addToast("🚨 Помилка завантаження налаштувань", "error"); }

            try {
                const res = await fetch(`${API_BASE_URL}/api/site-editor/fundraisers`);
                if (res.ok) setFundraisers(await res.json());
            } catch (e) { console.error("Fundraisers error", e); addToast("🚨 Помилка завантаження зборів", "error"); }

            try {
                const res = await fetch(`${API_BASE_URL}/api/site-editor/reports`);
                if (res.ok) {
                    const data = await res.json();
                    setReportPhotos(data.filter(r => r.type === 'photo'));
                    setReportDocs(data.filter(r => r.type === 'doc'));
                }
            } catch (e) { console.error("Reports error", e); addToast("🚨 Помилка завантаження звітів", "error"); }
        };

        fetchAllData();
    }, []);

    /**
     * Обробляє вибір файлу для банера головної сторінки.
     * Завантажує зображення до Supabase та оновлює стан.
     *
     * @async
     * @param {Event} event - Подія вибору файлу.
     * @returns {Promise<void>}
     */
    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `banner_${Date.now()}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from('site-images')
                .upload(fileName, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('site-images')
                .getPublicUrl(fileName);

            setHomeImage(publicUrl);
            addToast("🖼️ Фото банера завантажено! Натисніть 'ОНОВИТИ' для збереження", "success");
        } catch (error) {
            console.error('Помилка завантаження банера:', error);
            addToast(`🚨 Не вдалося завантажити фото: ${error.message}`, "error");
        } finally {
            setIsUploading(false);
        }
    };

    /**
     * Зберігає налаштування головного блоку на бекенді.
     *
     * @async
     * @returns {Promise<void>}
     */
    const handleSaveHomeBlock = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/site-editor/update-home`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: homeTitle,
                    description: homeDescription,
                    image: homeImage
                })
            });

            if (response.ok) {
                addToast("✨ Головний блок успішно оновлено!", "success");
            } else {
                addToast("🚨 Помилка збереження налаштувань.", "error");
            }
        } catch (error) {
            console.error("Помилка мережі:", error);
            addToast("🚨 Помилка з'єднання з сервером.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Додає новий порожній збір до списку для редагування.
     */
    const handleAddNewFundraiser = () => {
        const newFundraiser = {
            id: null,
            title: '',
            description: '',
            link: '',
            qr_code_url: '',
            is_hidden: false,
            _frontId: Date.now()
        };
        setFundraisers(prev => [...prev, newFundraiser]);
        addToast("📎 Додано новий збір. Заповніть поля та збережіть", "info");
    };

    /**
     * Завантажує QR-код для збору до Supabase.
     *
     * @async
     * @param {Event} event - Подія вибору файлу.
     * @param {number} index - Індекс збору в списку.
     * @returns {Promise<void>}
     */
    const handleQrUpload = async (event, index) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsFundraisersUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `qr_${Date.now()}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from('site-images')
                .upload(fileName, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('site-images')
                .getPublicUrl(fileName);

            setFundraisers(prev => prev.map((f, i) => i === index ? { ...f, qr_code_url: publicUrl } : f));
            addToast("🖼️ QR-код завантажено! Не забудьте зберегти список зборів", "success");
        } catch (error) {
            console.error('Помилка завантаження QR:', error);
            addToast(`🚨 Не вдалося завантажити QR-код: ${error.message}`, "error");
        } finally {
            setIsFundraisersUploading(false);
        }
    };

    /**
     * Зберігає всі збори на бекенді.
     *
     * @async
     * @returns {Promise<void>}
     */
    const handleSaveAllFundraisers = async () => {
        setIsFundraisersLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/site-editor/fundraisers/save-all`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fundraisers)
            });

            if (response.ok) {
                addToast("💰 Актуальні збори успішно синхронізовано та збережено!", "success");
                const freshResponse = await fetch(`${API_BASE_URL}/api/site-editor/fundraisers`);
                if (freshResponse.ok) {
                    const freshData = await freshResponse.json();
                    setFundraisers(freshData);
                }
            } else {
                addToast("🚨 Помилка при збереженні зборів.", "error");
            }
        } catch (error) {
            console.error("Помилка мережі:", error);
            addToast("🚨 Помилка з'єднання з сервером.", "error");
        } finally {
            setIsFundraisersLoading(false);
        }
    };

    /**
     * Завантажує файл звіту до Supabase.
     * Перевіряє, щоб назва файлу не містила кириличних символів.
     *
     * @async
     * @param {Event} event - Подія вибору файлу.
     * @param {string} type - Тип файлу ('photo' або 'doc').
     * @returns {Promise<void>}
     */
    const handleUploadReport = async (event, type) => {
        const file = event.target.files[0];
        if (!file) return;

        const cyrillicPattern = /[а-яёієїґ]/i;

        if (cyrillicPattern.test(file.name)) {
            alert("Помилка: Назва файлу не може містити кириличні літери. Будь ласка, перейменуйте файл на латиницю.");
            return;
        }

        setIsReportsUploading(true);
        try {
            const fileName = `${type}_${Date.now()}_${file.name}`;

            const { error } = await supabase.storage
                .from('site-reports')
                .upload(fileName, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('site-reports')
                .getPublicUrl(fileName);

            const newEntry = { name: file.name, url: publicUrl, type: type };

            if (type === 'photo') {
                setReportPhotos(prev => [...prev, newEntry]);
                addToast(`📎 Файл "${file.name}" додано до черги відправки`, "info");
            } else {
                setReportDocs(prev => [...prev, newEntry]);
                addToast(`📎 Файл "${file.name}" додано до черги відправки`, "info");
            }

        } catch (error) {
            addToast(`🚨 Помилка завантаження: ${error.message}`, "error");
        } finally {
            setIsReportsUploading(false);
        }
    };

    /**
     * Зберігає всі звіти (фото та документи) на бекенді.
     *
     * @async
     * @returns {Promise<void>}
     */
    const handleSaveReports = async () => {
        setIsReportsUploading(true);

        const dataToSave = [
            ...reportPhotos.map(p => ({ ...p, type: 'photo' })),
            ...reportDocs.map(d => ({ ...d, type: 'doc' }))
        ];

        try {
            const res = await fetch(`${API_BASE_URL}/api/site-editor/reports/save-all`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSave)
            });

            if (res.ok) {
                addToast("📊 Звітність успішно завантажена на сайт!", "success");
            } else {
                const errorText = await res.text();
                addToast(`🚨 Сталася помилка при завантаженні звітів: ${errorText}`, "error");
            }
        } catch (e) {
            console.error("Network error:", e);
            addToast("🚨 Не вдалося зв'язатися з сервером.", "error");
        } finally {
            setIsReportsUploading(false);
        }
    };

    return (
        <div className="admin-tab-content fade-in site-editor-layout">
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

            <h2 className="editor-title">Редактор сайту</h2>

            <div className="editor-glass-block">
                <span className="block-badge">Блок 1 : ГОЛОВНА СТОРІНКА</span>

                <div className="input-field-group">
                    <label>Заголовок :</label>
                    <input
                        type="text"
                        value={homeTitle}
                        onChange={(e) => setHomeTitle(e.target.value)}
                        disabled={isLoading}
                    />
                </div>

                <div className="input-field-group" style={{ marginTop: '15px' }}>
                    <label>Опис :</label>
                    <textarea
                        value={homeDescription}
                        onChange={(e) => setHomeDescription(e.target.value)}
                        disabled={isLoading}
                        style={{ height: '100px', resize: 'vertical' }}
                    />
                </div>

                <div className="photo-upload-row" style={{ marginTop: '15px' }}>
                    <label>Фото банера :</label>
                    <input
                        type="file"
                        id="banner-upload"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={isUploading || isLoading}
                        style={{ display: 'none' }}
                    />
                    <label htmlFor="banner-upload" className="btn-inline-upload" style={{ cursor: 'pointer', display: 'inline-block' }}>
                        {isUploading ? 'ЗАВАНТАЖЕННЯ...' : 'ОБРАТИ ФАЙЛ З ПК'}
                    </label>
                </div>

                {homeImage && (
                    <div style={{ marginTop: '15px', textAlign: 'left' }}>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '5px' }}>Поточне photo сайту:</div>
                        <img
                            src={homeImage}
                            alt="Прев'ю банера"
                            style={{ maxWidth: '200px', maxHeight: '120px', borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                    </div>
                )}

                <div className="block-footer-save" style={{ marginTop: '20px' }}>
                    <button className="btn-update-block" onClick={handleSaveHomeBlock} disabled={isLoading || isUploading}>
                        {isLoading ? 'ЗБЕРЕЖЕННЯ...' : 'ОНОВИТИ'}
                    </button>
                </div>
            </div>

            <div className="editor-glass-block">
                <span className="block-badge">Блок 2 : СТОРІНКА ЗБОРІВ</span>
                <h4 className="sub-block-title">Активні збори</h4>

                {isFundraisersLoading && <div style={{ color: '#fff', marginBottom: '10px' }}>Завантаження списку зборів...</div>}

                {fundraisers.map((fundraiser, index) => (
                    <div key={fundraiser.id || fundraiser._frontId || index} className="table-like-row" style={{ marginTop: '15px', opacity: fundraiser.is_hidden ? 0.5 : 1 }}>
                        <input
                            type="text"
                            placeholder="Назва..."
                            value={fundraiser.title}
                            onChange={(e) => setFundraisers(prev => prev.map((f, i) => i === index ? { ...f, title: e.target.value } : f))}
                        />
                        <input
                            type="text"
                            placeholder="Опис..."
                            value={fundraiser.description}
                            onChange={(e) => setFundraisers(prev => prev.map((f, i) => i === index ? { ...f, description: e.target.value } : f))}
                        />
                        <input
                            type="text"
                            placeholder="Посилання..."
                            value={fundraiser.link}
                            onChange={(e) => setFundraisers(prev => prev.map((f, i) => i === index ? { ...f, link: e.target.value } : f))}
                        />

                        <div className="qr-upload-zone" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="file"
                                id={`qr-file-${index}`}
                                accept="image/*"
                                onChange={(e) => handleQrUpload(e, index)}
                                style={{ display: 'none' }}
                            />
                            {fundraiser.qr_code_url ? (
                                <img src={fundraiser.qr_code_url} alt="QR-код" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                            ) : (
                                <span className="qr-placeholder-text" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>немає QR</span>
                            )}
                            <label htmlFor={`qr-file-${index}`} className="btn-row-edit" style={{ cursor: 'pointer', fontSize: '11px', padding: '4px 8px' }}>
                                + QR
                            </label>
                        </div>

                        <div className="row-actions">
                            <button
                                className="btn-row-hide"
                                style={{ backgroundColor: fundraiser.is_hidden ? '#6c757d' : '' }}
                                onClick={() => setFundraisers(prev => prev.map((f, i) => i === index ? { ...f, is_hidden: !f.is_hidden } : f))}
                            >
                                {fundraiser.is_hidden ? 'ПОКАЗАТИ' : 'ПРИХОВАТИ'}
                            </button>
                            <button className="btn-row-delete" onClick={() => setFundraisers(prev => prev.filter((_, i) => i !== index))}>✕</button>
                        </div>
                    </div>
                ))}

                <button className="btn-add-new-item" onClick={handleAddNewFundraiser} style={{ marginTop: '20px' }}>
                    + опублікувати новий збір на сайт
                </button>

                <div className="block-footer-save" style={{ marginTop: '20px' }}>
                    <button className="btn-update-block" onClick={handleSaveAllFundraisers} disabled={isFundraisersLoading || isFundraisersUploading}>
                        {isFundraisersLoading ? 'ЗБЕРЕЖЕННЯ...' : 'ОНОВИТИ СПИСОК ЗБОРІВ'}
                    </button>
                </div>
            </div>

            <div className="editor-glass-block">
                <span className="block-badge">Блок 3 : СТОРІНКА ЗВІТІВ</span>

                <div className="images-sub-group" style={{ marginTop: '15px' }}>
                    <label>ФОТО:</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                        {reportPhotos.map((item, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '6px', fontSize: '12px' }}>
                                {item.name}
                                <button onClick={() => setReportPhotos(prev => prev.filter((_, idx) => idx !== i))} style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer' }}>✕</button>
                            </div>
                        ))}
                    </div>

                    <input type="file" id="photo-report" onChange={(e) => handleUploadReport(e, 'photo')} style={{display: 'none'}} />
                    <label
                        htmlFor="photo-report"
                        className="btn-inline-upload"
                        style={{
                            cursor: 'pointer',
                            display: 'inline-block',
                            width: 'max-content',
                            textTransform: 'uppercase',
                            transition: 'opacity 0.2s ease'
                        }}
                        onMouseOver={(e) => e.target.style.opacity = '0.8'}
                        onMouseOut={(e) => e.target.style.opacity = '1'}
                    >
                        + ДОДАТИ ФОТО
                    </label>
                </div>

                <div className="documents-sub-group" style={{ marginTop: '20px' }}>
                    <label>ДОКУМЕНТИ:</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                        {reportDocs.map((item, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '6px', fontSize: '12px' }}>
                                {item.name}
                                <button onClick={() => setReportDocs(prev => prev.filter((_, idx) => idx !== i))} style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer' }}>✕</button>
                            </div>
                        ))}
                    </div>

                    <input type="file" id="doc-report" onChange={(e) => handleUploadReport(e, 'doc')} style={{display: 'none'}} />
                    <label
                        htmlFor="doc-report"
                        className="btn-inline-upload"
                        style={{
                            cursor: 'pointer',
                            display: 'inline-block',
                            width: 'max-content',
                            textTransform: 'uppercase',
                            transition: 'opacity 0.2s ease'
                        }}
                        onMouseOver={(e) => e.target.style.opacity = '0.8'}
                        onMouseOut={(e) => e.target.style.opacity = '1'}
                    >
                        + ДОДАТИ ДОКУМЕНТ
                    </label>
                </div>

                <div className="block-footer-save">
                    <button className="btn-update-block" onClick={handleSaveReports} disabled={isReportsUploading}>
                        {isReportsUploading ? 'ЗБЕРЕЖЕННЯ...' : 'ОНОВИТИ'}
                    </button>
                </div>
            </div>
        </div>
    );
}