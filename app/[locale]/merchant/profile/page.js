
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
        description: '',
        verificationStatus: 'unsubmitted',
        businessRegistrationImage: ''
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
                        description: data.description || '',
                        verificationStatus: data.verificationStatus || 'unsubmitted',
                        businessRegistrationImage: data.businessRegistrationImage || ''
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
                const updatedProfile = await res.json();
                setFormData(updatedProfile);
                setOriginalData(updatedProfile);
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
                            <button className={styles.editBtn} onClick={() => handleEdit(fieldKey)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#666', padding: '8px' }}>
                                <EditIcon />
                            </button>
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
                                justifyContent: 'center',
                                position: 'relative'
                            }}>
                                {formData.shopIcon ? (
                                    <Image src={formData.shopIcon} alt="Shop Icon" fill style={{ objectFit: 'cover' }} />
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

                {/* Verification Section */}
                <div className={styles.profileRow} style={{ display: 'flex', alignItems: 'flex-start', padding: '24px 0', borderBottom: '1px solid #333' }}>
                    <div className={styles.rowLabel} style={{ width: '180px', color: '#888', flexShrink: 0 }}>Verification Status</div>
                    <div className={styles.rowContent} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* Status Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {formData.verificationStatus === 'unsubmitted' && <span style={{ padding: '4px 12px', background: '#333', color: '#ccc', borderRadius: '12px', fontSize: '0.9rem' }}>Unsubmitted</span>}
                            {formData.verificationStatus === 'pending' && <span style={{ padding: '4px 12px', background: 'rgba(234, 179, 8, 0.2)', color: '#facc15', border: '1px solid rgba(234, 179, 8, 0.5)', borderRadius: '12px', fontSize: '0.9rem' }}>Pending Review</span>}
                            {formData.verificationStatus === 'approved' && <span style={{ padding: '4px 12px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.5)', borderRadius: '12px', fontSize: '0.9rem' }}>Verified</span>}
                            {formData.verificationStatus === 'rejected' && <span style={{ padding: '4px 12px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.5)', borderRadius: '12px', fontSize: '0.9rem' }}>Rejected</span>}
                        </div>

                        {/* Upload BR logic */}
                        {(formData.verificationStatus === 'unsubmitted' || formData.verificationStatus === 'rejected') && (
                            <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', padding: '16px' }}>
                                <h4 style={{ margin: '0 0 8px 0', color: '#60a5fa', fontSize: '1rem' }}>Get Verified</h4>
                                <p style={{ margin: '0 0 16px 0', color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                    Upload your Business Registration (BR) certificate to get a Blue Tick next to your shop name. This builds trust with buyers.
                                </p>

                                {editingField === 'brImage' ? (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                        <div style={{ flex: 1 }}>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        if (file.size > 5 * 1024 * 1024) {
                                                            alert('File size must be less than 5MB');
                                                            return;
                                                        }
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            setFormData({ ...formData, businessRegistrationImage: reader.result });
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                                style={{ color: '#fff', marginBottom: '8px', display: 'block' }}
                                            />
                                            {formData.businessRegistrationImage && (
                                                <div style={{ position: 'relative', width: '200px', height: '140px', background: '#000', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
                                                    <Image src={formData.businessRegistrationImage} alt="BR Preview" fill style={{ objectFit: 'cover' }} />
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.editActions} style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => handleSave('brImage')} disabled={isLoading} style={{ padding: '8px 16px', background: '#3b82f6', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                Submit
                                            </button>
                                            <button onClick={handleCancel} disabled={isLoading} style={{ width: '44px', height: '44px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <XIcon />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleEdit('brImage')}
                                        style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #3b82f6', color: '#60a5fa', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                                    >
                                        Upload BR Image
                                    </button>
                                )}
                            </div>
                        )}

                        {(formData.verificationStatus === 'pending' || formData.verificationStatus === 'approved') && formData.businessRegistrationImage && (
                            <div style={{ marginTop: '8px' }}>
                                <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#666' }}>Submitted Document:</p>
                                <div style={{ position: 'relative', width: '150px', height: '100px', background: '#000', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden', opacity: 0.7 }}>
                                    <Image src={formData.businessRegistrationImage} alt="BR Document" fill style={{ objectFit: 'cover' }} />
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
