import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

async function getSingleNews(slug: string) {
    const post = await prisma.news.findUnique({
        where: { slug },
        include: {
            author: {
                select: { firstName: true, lastName: true },
            },
            category: true,
        },
    });

    return post;
}

export default async function SingleNewsPage({
                                                 params,
                                             }: {
    params: { slug: string };
}) {
    const post = await getSingleNews(params.slug);

    if (!post) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
            <Header />

            <main className="pt-24 pb-16">
                <div className="container-modern max-w-3xl">

                    {/* Category */}
                    {post.category && (
                        <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
                            {post.category.name}
                        </span>
                    )}

                    {/* Title */}
                    <h1 className="text-4xl font-bold text-gray-900 mt-4 mb-6">
                        {post.title}
                    </h1>

                    {/* Meta */}
                    <div className="text-gray-500 text-sm mb-8">
                        By {post.author.firstName} {post.author.lastName} •{" "}
                        {new Date(post.createdAt).toDateString()}
                    </div>

                    {/* Image */}
                    {post.imageUrl && (
                        <img
                            src={post.imageUrl}
                            alt={post.title}
                            className="w-full rounded-2xl mb-8"
                        />
                    )}

                    {/* Content */}
                    <div className="prose max-w-none">
                        <p>{post.content}</p>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}