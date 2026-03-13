'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';

export default function CreateBlogPage() {
    const { isAdmin} = useAuth();
    const router = useRouter();

    const [form, setForm] = useState({
        title: '',
        excerpt: '',
        content: '',
        categoryId: '',
        featured: false,
        published: true,
    });

    const [categories, setCategories] = useState([]);



    useEffect(() => {
        fetch('/api/categories')
            .then(res => res.json())
            .then(data => setCategories(data));
    }, []);

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        const res = await fetch('/api/news', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });

        if (res.ok) {
            router.push('/admin/blog');
        } else {
            alert('Failed to create post');
        }
    };


    if (!isAdmin) return null;

    const breadcrumbItems = [
        { label: 'Admin Dashboard', href: '/admin' },
        { label: 'Blog Management', href: '/admin/blog' },
        { label: 'Create Post' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
            <Header />

            <main className="container-modern py-16">
                <AdminBreadcrumb items={breadcrumbItems} />

                <div className="bg-white rounded-2xl shadow-lg p-10">
                    <h1 className="text-3xl font-bold mb-8">
                        Create <span className="gradient-text">Blog Post</span>
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        <input
                            type="text"
                            placeholder="Title"
                            className="input w-full"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            required
                        />

                        <textarea
                            placeholder="Excerpt"
                            className="input w-full h-24"
                            value={form.excerpt}
                            onChange={e => setForm({ ...form, excerpt: e.target.value })}
                        />

                        <textarea
                            placeholder="Content"
                            className="input w-full h-48"
                            value={form.content}
                            onChange={e => setForm({ ...form, content: e.target.value })}
                            required
                        />

                        <select
                            className="input w-full"
                            value={form.categoryId}
                            onChange={e => setForm({ ...form, categoryId: e.target.value })}
                            required
                        >
                            <option value="">Select Category</option>
                            {categories.map((cat: any) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>

                        <div className="flex gap-6">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={form.featured}
                                    onChange={e =>
                                        setForm({ ...form, featured: e.target.checked })
                                    }
                                />
                                Featured
                            </label>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={form.published}
                                    onChange={e =>
                                        setForm({ ...form, published: e.target.checked })
                                    }
                                />
                                Published
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="bg-primary-600 text-white px-8 py-3 rounded-xl hover:bg-primary-700 transition"
                        >
                            Publish Post
                        </button>
                    </form>
                </div>
            </main>

            <Footer />
        </div>
    );
}
