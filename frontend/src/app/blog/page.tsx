import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { prisma } from "@/lib/prisma";

function getExcerpt(content: string, maxLength = 150) {
    if (!content) return "";
    const plainText = content.replace(/<[^>]*>/g, "");
    return plainText.length > maxLength
        ? plainText.substring(0, maxLength) + "..."
        : plainText;
}

async function getNews(page = 1) {
    const limit = 6;
    const skip = (page - 1) * limit;

    const [news, total] = await Promise.all([
        prisma.news.findMany({
            where: { published: true },
            include: {
                author: { select: { firstName: true, lastName: true } },
                category: true,
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.news.count({ where: { published: true } }),
    ]);

    return {
        data: news,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}

export default async function BlogPage({
                                           searchParams,
                                       }: {
    searchParams: { page?: string };
}) {
    const currentPage = Number(searchParams?.page) || 1;
    const { data, meta } = await getNews(currentPage);

    const featuredPost = data[0];
    const otherPosts = data.slice(1);

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
            <Header />

            <main className="pt-20">

                {/* ===== Hero Section ===== */}
                <section className="py-20 bg-gradient-to-r from-primary-700 to-secondary-600 text-white">
                    <div className="container-modern text-center">
                        <h1 className="text-5xl font-bold mb-6 tracking-tight">
                            Latest News & Insights
                        </h1>
                        <p className="text-lg text-primary-100 max-w-2xl mx-auto">
                            Stay informed with our latest updates, stories, and expert insights.
                        </p>
                    </div>
                </section>

                {/* ===== Featured Article ===== */}
                {featuredPost && (
                    <section className="py-16">
                        <div className="container-modern">
                            <div className="bg-white rounded-3xl shadow-xl overflow-hidden grid md:grid-cols-2 transition hover:shadow-2xl">

                                <div className="bg-gradient-to-br from-primary-200 to-secondary-200 min-h-[300px]" />

                                <div className="p-10 flex flex-col justify-center">
                                    <span className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-3">
                                        Featured
                                    </span>

                                    <h2 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                                        {featuredPost.title}
                                    </h2>

                                    <p className="text-gray-600 mb-6">
                                        {getExcerpt(featuredPost.content)}
                                    </p>

                                    <Link
                                        href={`/blog/${featuredPost.slug}`}
                                        className="inline-block bg-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700 transition"
                                    >
                                        Read Full Article →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ===== News Grid ===== */}
                <section className="pb-20">
                    <div className="container-modern">

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {otherPosts.map((post: any) => (
                                <article
                                    key={post.id}
                                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                                >
                                    <div className="bg-gradient-to-br from-primary-100 to-secondary-100 h-48" />

                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-3 text-sm text-gray-500">
                                            <span>{post.category?.name}</span>
                                            <span>
                                                {new Date(post.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition">
                                            {post.title}
                                        </h3>

                                        <p className="text-gray-600 mb-5 line-clamp-3">
                                            {getExcerpt(post.content)}
                                        </p>

                                        <Link
                                            href={`/blog/${post.slug}`}
                                            className="text-primary-600 font-semibold hover:underline"
                                        >
                                            Read More →
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {/* ===== Pagination ===== */}
                        <div className="flex justify-center items-center gap-6 mt-16">
                            {currentPage > 1 && (
                                <Link
                                    href={`/blog?page=${currentPage - 1}`}
                                    className="px-5 py-2 bg-white shadow rounded-lg hover:bg-gray-100"
                                >
                                    ← Previous
                                </Link>
                            )}

                            <span className="px-6 py-2 bg-primary-600 text-white rounded-xl">
                                Page {meta.page} of {meta.totalPages}
                            </span>

                            {currentPage < meta.totalPages && (
                                <Link
                                    href={`/blog?page=${currentPage + 1}`}
                                    className="px-5 py-2 bg-white shadow rounded-lg hover:bg-gray-100"
                                >
                                    Next →
                                </Link>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}