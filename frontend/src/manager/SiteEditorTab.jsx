import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function SiteEditorTab() {

    const [homeTitle, setHomeTitle] = useState('');
    const [homeDescription, setHomeDescription] = useState('');
    const [homeImage, setHomeImage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const [fundraisers, setFundraisers] = useState([]);
    const [isFundraisersLoading, setIsFundraisersLoading] = useState(false);
    const [isFundraisersUploading, setIsFundraisersUploading] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('http://localhost:8080/api/site-editor/settings');
                if (response.ok) {
                    const data = await response.json();
                    setHomeTitle(data.home_title || 'ЛАНКА');
                    setHomeDescription(data.home_description || '');
                    setHomeImage(data.home_image || '');
                }
            } catch (error) {
                console.error("Помилка завантаження контенту:", error);
            }
        };

        const fetchFundraisers = async () => {
            setIsFundraisersLoading(true);
            try {
                const response = await fetch('http://localhost:8080/api/site-editor/fundraisers');
                if (response.ok) {
                    const data = await response.json();
                    setFundraisers(data);
                }
            } catch (error) {
                console.error("Помилка завантаження зборів:", error);
            } finally {
                setIsFundraisersLoading(false);
            }
        };

        fetchSettings();
        fetchFundraisers();
    }, []);


    // ЛОГІКА БЛОКУ 1 (ГОЛОВНА СТОРІНКА)
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
            alert("Фото банера успішно завантажено! Натисни 'ОНОВИТИ' нижче для збереження.");
        } catch (error) {
            console.error('Помилка завантаження банера:', error);
            alert('Не вдалося завантажити фото: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveHomeBlock = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:8080/api/site-editor/update-home', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: homeTitle,
                    description: homeDescription,
                    image: homeImage
                })
            });

            if (response.ok) {
                alert("Контент головної сторінки успішно оновлено в БД!");
            } else {
                alert("Помилка сервера при оновленні.");
            }
        } catch (error) {
            console.error("Помилка мережі:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // ЛОГІКА БЛОКУ 2 (СТОРІНКА ЗБОРІВ)
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
    };

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
            alert("QR-код успішно завантажено в хмару! Не забудь натиснути 'ОНОВИТИ СПИСОК ЗБОРІВ'.");
        } catch (error) {
            console.error('Помилка завантаження QR:', error);
            alert('Не вдалося завантажити QR-код: ' + error.message);
        } finally {
            setIsFundraisersUploading(false);
        }
    };

    const handleSaveAllFundraisers = async () => {
        setIsFundraisersLoading(true);
        try {
            const response = await fetch('http://localhost:8080/api/site-editor/fundraisers/save-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fundraisers)
            });

            if (response.ok) {
                alert("Список активних зборів успішно збережено в базі даних!");
                const freshResponse = await fetch('http://localhost:8080/api/site-editor/fundraisers');
                if (freshResponse.ok) {
                    const freshData = await freshResponse.json();
                    setFundraisers(freshData);
                }
            } else {
                alert("Помилка сервера при збереженні зборів.");
            }
        } catch (error) {
            console.error("Помилка мережі:", error);
        } finally {
            setIsFundraisersLoading(false);
        }
    };

    return (
        <div className="admin-tab-content fade-in site-editor-layout">
            <h2 className="editor-title">Редактор сайту</h2>

            {/* БЛОК 1 : ГОЛОВНА СТОРІНКА */}
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
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '5px' }}>Поточне фото сайту:</div>
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

            {/* БЛОК 2 : СТОРІНКА ЗБОРІВ */}
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

            {/* БЛОК 3 : СТОРІНКА ЗВІТІВ */}
            <div className="editor-glass-block">
                <span className="block-badge">Блок 3 : СТОРІНКА ЗВІТІВ</span>
                <div className="images-sub-group">
                    <label>ЗАВАНТАЖЕНІ ФОТО:</label>
                    <div className="loaded-photos-list">
                        <span className="photo-item-tag">фото1.jpg ✕</span>
                    </div>
                    <button className="btn-add-element">+ ДОДАТИ ФОТО</button>
                </div>
                <div className="documents-sub-group" style={{ marginTop: '15px' }}>
                    <label>ОФІЦІЙНІ ДОКУМЕНТИ ТА ЗВІТИ :</label>
                    <button className="btn-add-element">+ ДОДАТИ ДОКУМЕНТ</button>
                </div>
            </div>
        </div>
    );
}