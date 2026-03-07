'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './AdminVerifications.module.css';

export default function AdminVerificationsPage() {
    const [applications, setApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // 'pending', 'approved', 'rejected', 'all'
    const [actionLoading, setActionLoading] = useState(null); // merchantId being processed
    const [expandedImage, setExpandedImage] = useState(null);

    useEffect(() => {
        fetchApplications();
    }, [filter]);

    const fetchApplications = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/verifications?status=${filter}`);
            if (res.ok) {
                const data = await res.json();
                setApplications(data);
            } else {
                console.error('Failed to fetch applications:', await res.text());
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (merchantId, action) => {
        if (!confirm(`Are you sure you want to ${action} this verification?`)) return;

        setActionLoading(merchantId);
        try {
            const res = await fetch(`/api/admin/verifications/${merchantId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });

            if (res.ok) {
                // Remove from list if we're filtering, or update status if showing all
                if (filter === 'pending') {
                    setApplications(apps => apps.filter(a => a._id !== merchantId));
                } else {
                    fetchApplications(); // Refresh to catch updated status
                }
            } else {
                alert(`Error: ${await res.text()}`);
            }
        } catch (error) {
            console.error(`Error processing ${action}:`, error);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className={`container ${styles.page}`}>
            <div className={styles.header}>
                <h1 className={styles.title}>Merchant Verifications</h1>
                <p className={styles.subtitle}>Review Business Registration uploads and assign the Blue Tick.</p>
            </div>

            <div className={styles.filterTabs}>
                {['pending', 'approved', 'rejected', 'all'].map(status => (
                    <button
                        key={status}
                        className={`${styles.tabBtn} ${filter === status ? styles.activeTab : ''}`}
                        onClick={() => setFilter(status)}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className={styles.loading}>Loading applications...</div>
            ) : applications.length === 0 ? (
                <div className={styles.emptyState}>No {filter} applications found.</div>
            ) : (
                <div className={styles.grid}>
                    {applications.map(app => (
                        <div key={app._id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div className={styles.avatar}>
                                        {app.shopIcon ? (
                                            <Image src={app.shopIcon} alt={app.shopName} fill style={{ objectFit: 'cover' }} />
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"></path><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path><path d="M2 7h20"></path><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"></path></svg>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className={styles.shopName}>{app.shopName}</h3>
                                        <p className={styles.shopEmail}>{app.email}</p>
                                    </div>
                                </div>
                                <span className={`${styles.statusBadge} ${styles[app.verificationStatus]}`}>
                                    {app.verificationStatus}
                                </span>
                            </div>

                            <div className={styles.cardBody}>
                                <h4>Business Registration Document</h4>
                                {app.businessRegistrationImage ? (
                                    <div
                                        className={styles.imageWrapper}
                                        onClick={() => setExpandedImage(app.businessRegistrationImage)}
                                    >
                                        <Image
                                            src={app.businessRegistrationImage}
                                            alt={`BR of ${app.shopName}`}
                                            fill
                                            style={{ objectFit: 'cover' }}
                                        />
                                        <div className={styles.expandOverlay}>
                                            <span>Click to expand</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className={styles.noImage}>No document uploaded.</p>
                                )}
                            </div>

                            <div className={styles.cardFooter}>
                                <button
                                    className={`${styles.actionBtn} ${styles.approveBtn}`}
                                    onClick={() => handleAction(app._id, 'approve')}
                                    disabled={actionLoading === app._id || app.verificationStatus === 'approved'}
                                >
                                    {actionLoading === app._id ? 'Processing...' : 'Approve'}
                                </button>
                                <button
                                    className={`${styles.actionBtn} ${styles.rejectBtn}`}
                                    onClick={() => handleAction(app._id, 'reject')}
                                    disabled={actionLoading === app._id || app.verificationStatus === 'rejected'}
                                >
                                    {actionLoading === app._id ? 'Processing...' : 'Reject'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )
            }

            {/* Image Modal */}
            {
                expandedImage && (
                    <div className={styles.modalOverlay} onClick={() => setExpandedImage(null)}>
                        <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                            <button className={styles.closeModal} onClick={() => setExpandedImage(null)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={expandedImage} alt="Expanded BR" className={styles.fullImage} />
                        </div>
                    </div>
                )
            }
        </div >
    );
}
