'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog';
import { AdminBulkActions } from '@/components/admin/AdminBulkActions';
import { AdminExport } from '@/components/admin/AdminExport';
import {
    AdminLoadingState,
    AdminTableLoadingState,
} from '@/components/admin/AdminLoadingState';
import {
    AdminInlineError,
    AdminSuccessMessage,
} from '@/components/admin/AdminErrorState';
import Link from "next/link";

interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: 'USER' | 'ADMIN' | 'VENDOR';
    createdAt: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [sortField, setSortField] = useState<keyof User>('createdAt');
    const [sortDirection, setSortDirection] =
        useState<'asc' | 'desc'>('desc');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [selectAll, setSelectAll] = useState(false);

    const [isLoadingData, setIsLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] =
        useState<string | null>(null);

    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        type: 'danger' as 'danger' | 'warning' | 'info',
    });

    const [exportDialog, setExportDialog] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        filterAndSortUsers();
    }, [users, searchTerm, roleFilter, sortField, sortDirection]);

    const loadUsers = async () => {
        setIsLoadingData(true);
        setError(null);

        try {
            const response = await fetch('/api/admin/users');
            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error || 'Failed to load users'
                );
            }

            setUsers(result.data || []);
        } catch {
            setError(
                'Failed to load users. Please try again.'
            );
        } finally {
            setIsLoadingData(false);
        }
    };

    const filterAndSortUsers = () => {
        let filtered = users.filter(
            (u) =>
                (u.firstName
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    u.lastName
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    u.email
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())) &&
                (roleFilter === 'all' ||
                    u.role === roleFilter)
        );

        filtered.sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];

            if (aValue < bValue)
                return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue)
                return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        setFilteredUsers(filtered);
    };

    const handleSort = (field: keyof User) => {
        if (sortField === field) {
            setSortDirection(
                sortDirection === 'asc' ? 'desc' : 'asc'
            );
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleSelectUser = (id: number) => {
        setSelectedUsers((prev) =>
            prev.includes(id)
                ? prev.filter((u) => u !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(
                filteredUsers.map((u) => u.id)
            );
        }
        setSelectAll(!selectAll);
    };

    const handleDeleteUser = (id: number) => {
        const targetUser = users.find(
            (u) => u.id === id
        );

        setConfirmDialog({
            isOpen: true,
            title: 'Delete User',
            message: `Are you sure you want to delete ${targetUser?.firstName} ${targetUser?.lastName}?`,
            type: 'danger',
            onConfirm: async () => {
                setIsProcessing(true);
                try {
                    await fetch(
                        `/api/admin/users/${id}`,
                        { method: 'DELETE' }
                    );

                    setUsers((prev) =>
                        prev.filter(
                            (u) => u.id !== id
                        )
                    );
                    setSelectedUsers((prev) =>
                        prev.filter(
                            (u) => u !== id
                        )
                    );
                    setSuccessMessage(
                        'User deleted successfully'
                    );
                } catch {
                    setError(
                        'Failed to delete user'
                    );
                } finally {
                    setIsProcessing(false);
                    setConfirmDialog((prev) => ({
                        ...prev,
                        isOpen: false,
                    }));
                }
            },
        });
    };

    const handleBulkDelete = () => {
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Selected Users',
            message: `Delete ${selectedUsers.length} selected users?`,
            type: 'danger',
            onConfirm: async () => {
                setIsProcessing(true);
                try {
                    await Promise.all(
                        selectedUsers.map((id) =>
                            fetch(
                                `/api/admin/users/${id}`,
                                {
                                    method:
                                        'DELETE',
                                }
                            )
                        )
                    );

                    setUsers((prev) =>
                        prev.filter(
                            (u) =>
                                !selectedUsers.includes(
                                    u.id
                                )
                        )
                    );
                    setSelectedUsers([]);
                    setSelectAll(false);
                    setSuccessMessage(
                        'Users deleted successfully'
                    );
                } catch {
                    setError(
                        'Bulk delete failed'
                    );
                } finally {
                    setIsProcessing(false);
                    setConfirmDialog((prev) => ({
                        ...prev,
                        isOpen: false,
                    }));
                }
            },
        });
    };

    const totalPages = Math.ceil(
        filteredUsers.length / itemsPerPage
    );
    const startIndex =
        (currentPage - 1) * itemsPerPage;
    const endIndex =
        startIndex + itemsPerPage;
    const paginatedUsers =
        filteredUsers.slice(
            startIndex,
            endIndex
        );

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
            <Header />

            <main className="container-modern py-16">
                <AdminBreadcrumb
                    items={[
                        {
                            label:
                                'Admin Dashboard',
                            href: '/admin',
                        },
                        {
                            label:
                                'User Management',
                        },
                    ]}
                />

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>

                    </div>
                    <div className="flex space-x-3">
                        <Link href="/admin/users/new" className="btn-primary">
                            + Add New User
                        </Link>
                        <Link href="/admin" className="btn-outline">
                            ← Back to Admin Dashboard
                        </Link>
                    </div>
                </div>

                {error && (
                    <AdminInlineError
                        message={error}
                        onDismiss={() =>
                            setError(null)
                        }
                    />
                )}

                {successMessage && (
                    <AdminSuccessMessage
                        message={
                            successMessage
                        }
                        onDismiss={() =>
                            setSuccessMessage(
                                null
                            )
                        }
                    />
                )}

                <div className="bg-white rounded-2xl p-8 shadow-lg">
                    <div className="flex justify-between mb-6">
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="form-input w-64"
                            value={searchTerm}
                            onChange={(e) =>
                                setSearchTerm(
                                    e.target.value
                                )
                            }
                        />

                        <select
                            className="form-select"
                            value={roleFilter}
                            onChange={(e) =>
                                setRoleFilter(
                                    e.target.value
                                )
                            }
                        >
                            <option value="all">
                                All Roles
                            </option>
                            <option value="USER">
                                User
                            </option>
                            <option value="VENDOR">
                                Vendor
                            </option>
                            <option value="ADMIN">
                                Admin
                            </option>
                        </select>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">
                                    <input
                                        type="checkbox"
                                        checked={
                                            selectAll
                                        }
                                        onChange={
                                            handleSelectAll
                                        }
                                    />
                                </th>
                                <th
                                    className="px-6 py-3 cursor-pointer"
                                    onClick={() =>
                                        handleSort(
                                            'firstName'
                                        )
                                    }
                                >
                                    Name
                                </th>
                                <th
                                    className="px-6 py-3 cursor-pointer"
                                    onClick={() =>
                                        handleSort(
                                            'email'
                                        )
                                    }
                                >
                                    Email
                                </th>
                                <th
                                    className="px-6 py-3 cursor-pointer"
                                    onClick={() =>
                                        handleSort(
                                            'role'
                                        )
                                    }
                                >
                                    Role
                                </th>
                                <th
                                    className="px-6 py-3 cursor-pointer"
                                    onClick={() =>
                                        handleSort(
                                            'createdAt'
                                        )
                                    }
                                >
                                    Created
                                </th>
                                <th className="px-6 py-3"></th>
                            </tr>
                            </thead>

                            <tbody className="bg-white divide-y divide-gray-200">
                            {isLoadingData ? (
                                <AdminTableLoadingState
                                    rows={
                                        itemsPerPage
                                    }
                                />
                            ) : (
                                paginatedUsers.map(
                                    (u) => (
                                        <tr
                                            key={
                                                u.id
                                            }
                                        >
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.includes(
                                                        u.id
                                                    )}
                                                    onChange={() =>
                                                        handleSelectUser(
                                                            u.id
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                {
                                                    u.firstName
                                                }{' '}
                                                {
                                                    u.lastName
                                                }
                                            </td>
                                            <td className="px-6 py-4">
                                                {
                                                    u.email
                                                }
                                            </td>
                                            <td className="px-6 py-4">
                                                {
                                                    u.role
                                                }
                                            </td>
                                            <td className="px-6 py-4">
                                                {new Date(
                                                    u.createdAt
                                                ).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() =>
                                                        handleDeleteUser(
                                                            u.id
                                                        )
                                                    }
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                )
                            )}
                            </tbody>
                        </table>
                    </div>

                    <AdminPagination
                        currentPage={
                            currentPage
                        }
                        totalPages={
                            totalPages
                        }
                        totalItems={
                            filteredUsers.length
                        }
                        itemsPerPage={
                            itemsPerPage
                        }
                        onPageChange={
                            setCurrentPage
                        }
                        onItemsPerPageChange={(
                            n
                        ) => {
                            setItemsPerPage(
                                n
                            );
                            setCurrentPage(
                                1
                            );
                        }}
                    />
                </div>
            </main>

            <Footer />

            <AdminBulkActions
                selectedItems={selectedUsers.map(String)}
                totalItems={
                    filteredUsers.length
                }
                actions={[
                    {
                        id: 'delete',
                        label: 'Delete',
                        icon: '🗑️',
                        action:
                        handleBulkDelete,
                        type: 'danger',
                    },
                ]}
                onSelectAll={
                    handleSelectAll
                }
                onClearSelection={() => {
                    setSelectedUsers([]);
                    setSelectAll(false);
                }}
                isVisible={
                    selectedUsers.length > 0
                }
            />

            <AdminConfirmDialog
                isOpen={
                    confirmDialog.isOpen
                }
                title={
                    confirmDialog.title
                }
                message={
                    confirmDialog.message
                }
                type={
                    confirmDialog.type
                }
                onConfirm={
                    confirmDialog.onConfirm
                }
                onCancel={() =>
                    setConfirmDialog(
                        (prev) => ({
                            ...prev,
                            isOpen: false,
                        })
                    )
                }
                isLoading={
                    isProcessing
                }
            />

            <AdminExport
                data={filteredUsers}
                filename="users"
                onExport={async () => {}}
                isVisible={
                    exportDialog
                }
                onClose={() =>
                    setExportDialog(false)
                }
            />
        </div>
    );
}