import React from 'react';

export default function SiteEditorTab() {
    return (
        <div className="admin-tab-content fade-in site-editor-layout">
            <h2 className="editor-title">Редактор сайту</h2>

            {/* БЛОК 1 */}
            <div className="editor-glass-block">
                <span className="block-badge">Блок 1 : ГОЛОВНА СТОРІНКА</span>
                <div className="input-field-group">
                    <label>Заголовок :</label>
                    <input type="text" defaultValue="ЛАНКА"/>
                </div>
                <div className="input-field-group">
                    <label>Опис :</label>
                    <textarea
                        defaultValue="Ми — волонтерська організація, що створює міцні зв'язки..."/>
                </div>
                <div className="photo-upload-row">
                    <label>Фото :</label>
                    <button className="btn-inline-upload">ЗАВАНТАЖИТИ</button>
                </div>
                <div className="block-footer-save">
                    <button className="btn-update-block">ОНОВИТИ</button>
                </div>
            </div>

            {/* БЛОК 2 */}
            <div className="editor-glass-block">
                <span className="block-badge">Блок 2 : СТОРІНКА ЗБОРІВ</span>
                <h4 className="sub-block-title">Активні збори</h4>
                <div className="table-like-row">
                    <input type="text" placeholder="Назва..." defaultValue="Медикаменти для Бахмута"/>
                    <input type="text" placeholder="Опис..." defaultValue="Збір на такмед"/>
                    <input type="text" placeholder="Посилання..." defaultValue="https://monobank..."/>
                    <span className="qr-placeholder-text">qr code</span>
                    <div className="row-actions">
                        <button className="btn-row-edit">РЕДАГУВАТИ</button>
                        <button className="btn-row-hide">ПРИХОВАТИ</button>
                        <button className="btn-row-delete">✕</button>
                    </div>
                </div>
                <button className="btn-add-new-item">+ опублікувати новий збір на сайт</button>
            </div>

            {/* БЛОК 3 */}
            <div className="editor-glass-block">
                <span className="block-badge">Блок 3 : СТОРІНКА ЗВІТІВ</span>

                <div className="images-sub-group">
                    <label>ЗАВАНТАЖЕНІ ФОТО:</label>
                    <div className="loaded-photos-list">
                        <span className="photo-item-tag">фото1.jpg ✕</span>
                        <span className="photo-item-tag">фото2.png ✕</span>
                    </div>
                    <button className="btn-add-element">+ ДОДАТИ ФОТО</button>
                </div>

                <div className="documents-sub-group">
                    <label>ОФІЦІЙНІ ДОКУМЕНТИ ТА ЗВІТИ :</label>
                    <div className="table-like-row">
                        <input type="text" defaultValue="Фінансовий звіт за Травень"/>
                        <span className="file-attached-badge">звіт.pdf</span>
                        <div className="row-actions">
                            <button className="btn-row-edit">РЕДАГУВАТИ</button>
                            <button className="btn-row-hide">ПРИХОВАТИ</button>
                            <button className="btn-row-delete">✕</button>
                        </div>
                    </div>
                    <button className="btn-add-element" style={{marginTop: '10px'}}>+ ДОДАТИ ДОКУМЕНТ</button>
                </div>

                <div className="block-footer-save">
                    <button className="btn-update-block">ОНОВИТИ</button>
                </div>
            </div>
        </div>
    );
}