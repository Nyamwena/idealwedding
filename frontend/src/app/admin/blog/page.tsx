'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';

export default function AdminBlogPage() {
    const { isAdmin } = useAuth();
    const router = useRouter();
    const [posts, setPosts] = useState([]);



    useEffect(() => {
        if (isAdmin) {
            fetch('/api/news')
                .then(res => res.json())
                .then(data => setPosts(data.data || []));
        }
    }, [isAdmin]);


    if ( !isAdmin) return null;

    const breadcrumbItems = [
        { label: 'Admin Dashboard', href: '/admin' },
        { label: 'Blog Management' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
            <Header />

            <main className="container-modern py-16">
                <AdminBreadcrumb items={breadcrumbItems} />

                <div className="flex justify-between items-center mb-10">
                    <h1 className="text-4xl font-bold text-gray-900">
                        Blog <span className="gradient-text">Management</span>
                    </h1>

                    <Link
                        href="/admin/blog/create"
                        className="bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition"
                    >
                        + Create Post
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100">
                        <tr>
                            <th className="p-4">Title</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Published</th>
                            <th className="p-4">Date</th>
                        </tr>
                        </thead>
                        <tbody>
                        {posts.map((post: any) => (
                            <tr key={post.id} className="border-t hover:bg-gray-50">
                                <td className="p-4 font-medium">{post.title}</td>
                                <td className="p-4">{post.category?.name}</td>
                                <td className="p-4">
                                    {post.published ? '✅ Yes' : '❌ No'}
                                </td>
                                <td className="p-4">
                                    {new Date(post.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </main>

            <Footer />
        </div>
    );
}
