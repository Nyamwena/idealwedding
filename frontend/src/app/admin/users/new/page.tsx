'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";

interface UserFormData {
    firstName: string;
    lastName: string;
    email: string;
    role: "user" | "vendor" | "admin";
    password: string;
    confirmPassword: string;
}

export default function AdminNewUserPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [formData, setFormData] = useState<UserFormData>({
        firstName: "",
        lastName: "",
        email: "",
        role: "user",
        password: "",
        confirmPassword: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    /**
     * 🔐 Protect Route
     */
    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.replace("/login");
            return;
        }

        if (user.role !== "ADMIN") {
            router.replace("/dashboard");
        }
    }, [user, loading, router]);

    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!formData.firstName.trim())
            errors.firstName = "First name is required";

        if (!formData.lastName.trim())
            errors.lastName = "Last name is required";

        if (!formData.email.trim())
            errors.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
            errors.email = "Invalid email address";

        if (!formData.password)
            errors.password = "Password is required";
        else if (formData.password.length < 8)
            errors.password = "Password must be at least 8 characters";

        if (formData.password !== formData.confirmPassword)
            errors.confirmPassword = "Passwords do not match";

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("Authentication required");
            }

            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    role: formData.role.toUpperCase(),
                }),
            });

            const text = await response.text();

            let data;
            try {
                data = JSON.parse(text);
            } catch {
                console.error("Server returned HTML:", text);
                throw new Error("Server returned invalid response");
            }

            if (!response.ok) {
                throw new Error(data.message || "Failed to create user");
            }

            setSuccessMessage("User created successfully!");

            setTimeout(() => {
                router.push("/admin/users");
            }, 1500);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * ⛔ Wait for auth
     */
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    /**
     * ⛔ Block unauthorized
     */
    if (!user || user.role !== "ADMIN") {
        return null;
    }

    const breadcrumbItems = [
        { label: "Admin", href: "/admin" },
        { label: "Users", href: "/admin/users" },
        { label: "New User" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
            <Header />

            <main className="container-modern py-16">
                <AdminBreadcrumb items={breadcrumbItems} />

                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold">
                            Create <span className="gradient-text">New User</span>
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Add a new system user with appropriate permissions.
                        </p>
                    </div>

                    {successMessage && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-700">{successMessage}</p>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700">{error}</p>
                        </div>
                    )}

                    <div className="bg-white shadow-xl rounded-xl p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block mb-2 font-medium">
                                        First Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="form-input w-full"
                                    />
                                    {validationErrors.firstName && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {validationErrors.firstName}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block mb-2 font-medium">
                                        Last Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="form-input w-full"
                                    />
                                    {validationErrors.lastName && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {validationErrors.lastName}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block mb-2 font-medium">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="form-input w-full"
                                />
                                {validationErrors.email && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {validationErrors.email}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block mb-2 font-medium">
                                    Role *
                                </label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="form-select w-full"
                                >
                                    <option value="user">User</option>
                                    <option value="vendor">Vendor</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block mb-2 font-medium">
                                        Password *
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="form-input w-full"
                                    />
                                    {validationErrors.password && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {validationErrors.password}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block mb-2 font-medium">
                                        Confirm Password *
                                    </label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="form-input w-full"
                                    />
                                    {validationErrors.confirmPassword && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {validationErrors.confirmPassword}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-4 pt-6 border-t">
                                <Link href="/admin/users">
                                    <button
                                        type="button"
                                        className="btn-secondary btn-lg"
                                    >
                                        Cancel
                                    </button>
                                </Link>

                                <button
                                    type="submit"
                                    className="btn-primary btn-lg"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Creating..." : "Create User"}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}



