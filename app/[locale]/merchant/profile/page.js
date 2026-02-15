
'use client';

import { useState, useEffect } from 'react';
import styles from '../Merchant.module.css';

// Simple SVG Icons
const EditIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const SaveIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
    </svg>
);

const XIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

export default function MerchantProfilePage() {
    const [isLoading, setIsLoading] = useState(false);
    const [editingField, setEditingField] = useState(null); // 'shopName', 'email', 'phone', etc.
    const [formData, setFormData] = useState({
        shopName: '',
        email: '',
        phone: '',
        instagram: '',
        shopIcon: '',
        address: '',
        description: ''
    });
    // Backup for cancel
    const [originalData, setOriginalData] = useState({});

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/merchant/profile');
            if (res.ok) {
                const data = await res.json();
                if (data) {
                    const cleanData = {
                        shopName: data.shopName || '',
                        email: data.email || '',
                        phone: data.phone || '',
                        instagram: data.instagram || '',
                        shopIcon: data.shopIcon || '',
                        address: data.address || '',
                        description: data.description || ''
                    };
                    setFormData(cleanData);
                    setOriginalData(cleanData);
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const handleEdit = (field) => {
        setEditingField(field);
    };

    const handleCancel = () => {
        setFormData(originalData); // Revert
        setEditingField(null);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (field) => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/merchant/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                // Success
                setOriginalData(formData);
                setEditingField(null);
            } else {
                const errorText = await res.text();
                alert(`Failed to update profile: ${errorText}`);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to render a field row
    const renderRow = (label, fieldKey, type = 'text', isTextArea = false) => {
        const isEditing = editingField === fieldKey;
        const value = formData[fieldKey];

        return (
            <div className={styles.profileRow} style={{ display: 'flex', alignItems: 'flex-start', padding: '24px 0', borderBottom: '1px solid #333' }}>
                <div className={styles.rowLabel} style={{ width: '180px', color: '#888', paddingTop: '10px', flexShrink: 0 }}>{label}</div>
                <div className={styles.rowContent} style={{ flex: 1 }}>
                    {isEditing ? (
                        <div className={styles.editContainer} style={{ display: 'flex', gap: '12px', width: '100%' }}>
                            {isTextArea ? (
                                <textarea
                                    name={fieldKey}
                                    value={value}
                                    onChange={handleChange}
                                    style={{
                                        flex: 1,
                                        padding: '16px',
                                        fontSize: '1.2rem',
                                        background: '#000',
                                        border: '1px solid #3b82f6',
                                        color: 'white',
                                        borderRadius: '8px',
                                        minHeight: '150px'
                                    }}
                                />
                            ) : (
                                <input
                                    type={type}
                                    name={fieldKey}
                                    value={value}
                                    onChange={handleChange}
                                    style={{
                                        flex: 1,
                                        padding: '16px',
                                        fontSize: '1.2rem',
                                        background: '#000',
                                        border: '1px solid #3b82f6',
                                        color: 'white',
                                        borderRadius: '8px'
                                    }}
                                />
                            )}
                            <div className={styles.editActions} style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleSave(fieldKey)} disabled={isLoading} style={{ width: '44px', height: '44px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <SaveIcon />
                                </button>
                                <button onClick={handleCancel} disabled={isLoading} style={{ width: '44px', height: '44px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <XIcon />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.displayContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'transparent', borderRadius: '8px' }}>
                            <div className={styles.displayText} style={{ fontSize: '1.1rem', color: 'white', flex: 1, marginRight: '16px' }}>{value || <span className={styles.placeholder}>-</span>}</div>
                            {/* Shop Name is immutable/special in this context ? User asked "except shop name" */}
                            {fieldKey !== 'shopName' && (
                                <button className={styles.editBtn} onClick={() => handleEdit(fieldKey)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#666', padding: '8px' }}>
                                    <EditIcon />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className={`container ${styles.page}`}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Company Profile</h1>
                    <p className={styles.subtitle}>Update your shop details and settings.</p>
                </div>
            </div>

            <div className={styles.profileSection}>
                {/* Shop Icon */}
                <div className={styles.profileRow} style={{ display: 'flex', alignItems: 'center', padding: '24px 0', borderBottom: '1px solid #333' }}>
                    <div className={styles.rowLabel} style={{ width: '180px', color: '#888', flexShrink: 0 }}>Shop Icon</div>
                    <div className={styles.rowContent} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: '1px solid #333',
                                background: '#111',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {formData.shopIcon ? (
                                    <img src={formData.shopIcon} alt="Shop Icon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ color: '#444', fontSize: '2rem' }}>🏪</span>
                                )}
                            </div>

                            {editingField === 'shopIcon' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                if (file.size > 2 * 1024 * 1024) {
                                                    alert('File size must be less than 2MB');
                                                    return;
                                                }
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setFormData({ ...formData, shopIcon: reader.result });
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        style={{ color: '#fff' }}
                                    />
                                    <p style={{ fontSize: '0.8rem', color: '#666' }}>Max 2MB. JPG, PNG, GIF.</p>
                                </div>
                            ) : null}
                        </div>

                        {editingField === 'shopIcon' ? (
                            <div className={styles.editActions} style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleSave('shopIcon')} disabled={isLoading} style={{ width: '44px', height: '44px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <SaveIcon />
                                </button>
                                <button onClick={handleCancel} disabled={isLoading} style={{ width: '44px', height: '44px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <XIcon />
                                </button>
                            </div>
                        ) : (
                            <button className={styles.editBtn} onClick={() => handleEdit('shopIcon')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#666', padding: '8px' }}>
                                <EditIcon />
                            </button>
                        )}
                    </div>
                </div>

                {renderRow('Shop Name', 'shopName')}
                {renderRow('Contact Email', 'email', 'email')}
                {renderRow('Phone / WhatsApp', 'phone', 'text')}
                {renderRow('Instagram', 'instagram', 'text')}
                {renderRow('Address', 'address', 'text', true)}
                {renderRow('Description', 'description', 'text', true)}
            </div>
        </div>
    );
}
