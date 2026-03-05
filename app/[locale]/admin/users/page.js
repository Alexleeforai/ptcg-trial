'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './AdminUsers.module.css';

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // userId being processed

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                console.error('Failed to fetch users:', await res.text());
                alert('Failed to load users. Are you an admin?');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoleUpdate = async (userId, currentRole) => {
        const action = currentRole === 'admin' ? 'revoke' : 'grant';
        const actionText = currentRole === 'admin' ? 'REVOKE admin rights from' : 'GRANT admin rights to';

        if (!confirm(`Are you sure you want to ${actionText} this user?`)) return;

        setActionLoading(userId);
        try {
            const res = await fetch(`/api/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });

            if (res.ok) {
                const updatedUser = await res.json();
                setUsers(users.map(u => u.id === updatedUser.id ? { ...u, role: updatedUser.role } : u));
            } else {
                const errText = await res.text();
                alert(`Error: ${errText}`);
            }
        } catch (error) {
            console.error(`Error updating role for ${userId}:`, error);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className={`container ${styles.page}`}>
            <div className={styles.header}>
                <h1 className={styles.title}>User Management</h1>
                <p className={styles.subtitle}>View registered users and manage their site-wide roles.</p>
            </div>

            {isLoading ? (
                <div className={styles.loading}>Loading users...</div>
            ) : users.length === 0 ? (
                <div className={styles.emptyState}>No users found.</div>
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Joined</th>
                                <th>Role</th>
                                <th align="right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <div className={styles.userInfo}>
                                            <div className={styles.avatar}>
                                                {user.imageUrl ? (
                                                    <Image src={user.imageUrl} alt={user.firstName || 'User'} fill style={{ objectFit: 'cover' }} />
                                                ) : (
                                                    <span>👤</span>
                                                )}
                                            </div>
                                            <div className={styles.userName}>
                                                {user.firstName || ''} {user.lastName || ''}
                                                {(!user.firstName && !user.lastName) && 'Unknown'}
                                            </div>
                                        </div>
                                    </td>
                                    <td>{user.email}</td>
                                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`${styles.roleBadge} ${styles[user.role]}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td align="right">
                                        <button
                                            className={`${styles.actionBtn} ${user.role === 'admin' ? styles.revokeBtn : styles.grantBtn}`}
                                            onClick={() => handleRoleUpdate(user.id, user.role)}
                                            disabled={actionLoading === user.id}
                                        >
                                            {actionLoading === user.id
                                                ? 'Updating...'
                                                : user.role === 'admin'
                                                    ? 'Revoke Admin'
                                                    : 'Make Admin'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
