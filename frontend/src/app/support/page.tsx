import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function SupportPage() {
  const supportChannels = [
    {
      title: "Live Chat",
      icon: "💬",
      description: "Get instant help from our support team",
      availability: "Available 24/7",
      responseTime: "Usually responds within 2 minutes",
      action: "Start Chat"
    },
    {
      title: "Email Support",
      icon: "📧",
      description: "Send us a detailed message and we'll get back to you",
      availability: "Available 24/7",
      responseTime: "Usually responds within 4 hours",
      action: "Send Email"
    },
    {
      title: "Phone Support",
      icon: "📞",
      description: "Speak directly with our support specialists",
      availability: "Monday - Friday, 9 AM - 6 PM EST",
      responseTime: "Immediate assistance",
      action: "Call Now"
    },
    {
      title: "Help Center",
      icon: "📚",
      description: "Browse our comprehensive help articles and guides",
      availability: "Available 24/7",
      responseTime: "Instant access",
      action: "Browse Articles"
    }
  ];

  const commonIssues = [
    {
      category: "Account Issues",
      issues: [
        "Can't log in to my account",
        "Forgot my password",
        "Need to update my email address",
        "Want to delete my account"
      ]
    },
    {
      category: "Vendor Services",
      issues: [
        "Vendor didn't respond to my inquiry",
        "Need to report a vendor issue",
        "Want to leave a vendor review",
        "Vendor pricing seems incorrect"
      ]
    },
    {
      category: "Payment & Billing",
      issues: [
        "Payment method not working",
        "Need a refund",
        "Subscription renewal issues",
        "Billing questions"
      ]
    },
    {
      category: "Technical Problems",
      issues: [
        "Website not loading properly",
        "Mobile app crashes",
        "Can't upload photos",
        "Search not working"
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
              Contact Support
            </h1>
            <p className="text-xl text-primary-100 max-w-2xl mx-auto">
              We're here to help you with any questions or issues you might have
            </p>
          </div>
        </section>

        {/* Support Channels */}
        <section className="py-16">
          <div className="container-modern">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              How Can We Help You?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {supportChannels.map((channel, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
                  <div className="text-4xl mb-4">{channel.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{channel.title}</h3>
                  <p className="text-gray-600 mb-4">{channel.description}</p>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>🕒</span>
                      <span>{channel.availability}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>⚡</span>
                      <span>{channel.responseTime}</span>
                    </div>
                  </div>
                  
                  <button className="w-full btn-primary btn-md">
                    {channel.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Common Issues */}
        <section className="py-16 bg-gray-50">
          <div className="container-modern">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Common Issues & Solutions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {commonIssues.map((category, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{category.category}</h3>
                  <ul className="space-y-2">
                    {category.issues.map((issue, issueIndex) => (
                      <li key={issueIndex} className="text-gray-600 hover:text-primary-600 cursor-pointer">
                        • {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-16 bg-white">
          <div className="container-modern">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
                Send Us a Message
              </h2>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      className="input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      className="input w-full"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="input w-full"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <select id="subject" name="subject" className="input w-full" required>
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="technical">Technical Support</option>
                    <option value="billing">Billing Question</option>
                    <option value="vendor">Vendor Issue</option>
                    <option value="feature">Feature Request</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    className="input w-full"
                    placeholder="Please describe your issue or question in detail..."
                    required
                  ></textarea>
                </div>
                
                <div className="text-center">
                  <button type="submit" className="btn-primary btn-lg">
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Additional Support Info */}
        <section className="py-16 bg-gray-50">
          <div className="container-modern text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Need Immediate Help?
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              For urgent issues, we recommend using our live chat feature or calling our support line during business hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/help" className="btn-ghost btn-lg">
                Visit Help Center
              </a>
              <a href="/faq" className="btn-ghost btn-lg">
                View FAQs
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
