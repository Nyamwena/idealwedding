'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const faqCategories = [
    {
      title: "General Questions",
      icon: "❓",
      items: [
        {
          question: "What is Ideal Weddings?",
          answer: "Ideal Weddings is a comprehensive wedding planning platform that helps couples plan their perfect wedding by connecting them with vendors, managing guest lists, tracking budgets, and providing planning tools."
        },
        {
          question: "How much does it cost to use Ideal Weddings?",
          answer: "We offer various pricing plans to suit different needs. Check our pricing page for detailed information about our plans and what's included in each."
        },
        {
          question: "Is Ideal Weddings available internationally?",
          answer: "Currently, we're available in select regions. Contact our support team to check availability in your area."
        }
      ]
    },
    {
      title: "Account & Security",
      icon: "🔐",
      items: [
        {
          question: "How do I create an account?",
          answer: "Simply click the 'Get Started' button on our homepage and follow the registration process. You'll need to provide your email address and create a password."
        },
        {
          question: "Is my personal information secure?",
          answer: "Yes, we take security seriously. All data is encrypted, and we follow industry best practices to protect your personal information."
        },
        {
          question: "Can I delete my account?",
          answer: "Yes, you can delete your account at any time from your account settings. Please note that this action is irreversible."
        }
      ]
    },
    {
      title: "Vendor Services",
      icon: "👥",
      items: [
        {
          question: "How do I find vendors on the platform?",
          answer: "You can search for vendors by category, location, or specific services. Each vendor profile includes reviews, pricing, and contact information."
        },
        {
          question: "Are all vendors verified?",
          answer: "We verify all vendors before they can list on our platform. This includes background checks and verification of business licenses."
        },
        {
          question: "Can I book vendors directly through Ideal Weddings?",
          answer: "Yes, you can book many vendors directly through our platform. For others, we provide contact information so you can reach out directly."
        }
      ]
    },
    {
      title: "Wedding Planning Tools",
      icon: "📋",
      items: [
        {
          question: "What planning tools are available?",
          answer: "We offer guest list management, budget tracking, timeline creation, vendor management, and more. All tools are designed to make wedding planning easier and more organized."
        },
        {
          question: "Can I collaborate with others on my wedding plan?",
          answer: "Yes! You can invite family members, wedding planners, or other collaborators to help with your wedding planning."
        },
        {
          question: "Is there a mobile app available?",
          answer: "Yes, we have mobile apps for both iOS and Android devices, so you can plan your wedding on the go."
        }
      ]
    },
    {
      title: "Payment & Billing",
      icon: "💳",
      items: [
        {
          question: "What payment methods do you accept?",
          answer: "We accept all major credit cards, PayPal, and bank transfers for annual plans."
        },
        {
          question: "Can I cancel my subscription?",
          answer: "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your current billing period."
        },
        {
          question: "Do you offer refunds?",
          answer: "We offer a 30-day money-back guarantee for new subscribers. Contact our support team if you're not satisfied with our service."
        }
      ]
    },
    {
      title: "Technical Support",
      icon: "🔧",
      items: [
        {
          question: "What browsers are supported?",
          answer: "We support all modern browsers including Chrome, Firefox, Safari, and Edge. For the best experience, we recommend using the latest version."
        },
        {
          question: "How do I get technical support?",
          answer: "You can contact our technical support team through the help center, email, or live chat during business hours."
        },
        {
          question: "Is there a user manual or tutorial?",
          answer: "Yes, we provide comprehensive tutorials and guides in our help center to help you get started and make the most of our platform."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
          <div className="container-modern text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-primary-100 max-w-2xl mx-auto">
              Find answers to the most common questions about Ideal Weddings
            </p>
          </div>
        </section>

        {/* FAQ Categories */}
        <section className="py-16">
          <div className="container-modern">
            <div className="space-y-12">
              {faqCategories.map((category, categoryIndex) => (
                <div key={categoryIndex} className="bg-white rounded-2xl shadow-lg p-8">
                  <div className="flex items-center gap-4 mb-8">
                    <span className="text-4xl">{category.icon}</span>
                    <h2 className="text-2xl font-bold text-gray-900">{category.title}</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {category.items.map((item, itemIndex) => {
                      const globalIndex = categoryIndex * 100 + itemIndex;
                      const isOpen = openItems.includes(globalIndex);
                      
                      return (
                        <div key={itemIndex} className="border border-gray-200 rounded-xl overflow-hidden">
                          <button
                            onClick={() => toggleItem(globalIndex)}
                            className="w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between"
                          >
                            <span className="font-semibold text-gray-900">{item.question}</span>
                            <span className="text-gray-500 text-xl">
                              {isOpen ? '−' : '+'}
                            </span>
                          </button>
                          
                          {isOpen && (
                            <div className="px-6 py-4 bg-white border-t border-gray-200">
                              <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Still Need Help */}
        <section className="py-16 bg-gray-50">
          <div className="container-modern text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Still Have Questions?
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Can't find what you're looking for? Our support team is here to help you with any questions or concerns.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/help" className="btn-primary btn-lg">
                Visit Help Center
              </a>
              <a href="/contact" className="btn-ghost btn-lg">
                Contact Support
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
