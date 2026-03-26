import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function TermsPage() {
  const termsSections = [
    {
      title: "Acceptance of Terms",
      content: [
        "By accessing and using Ideal Weddings, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.",
        "These Terms of Service apply to all users of the site, including without limitation users who are browsers, vendors, customers, merchants, and/or contributors of content."
      ]
    },
    {
      title: "Use License",
      content: [
        "Permission is granted to temporarily download one copy of the materials (information or software) on Ideal Weddings's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:",
        "• Modify or copy the materials",
        "• Use the materials for any commercial purpose or for any public display (commercial or non-commercial)",
        "• Attempt to decompile or reverse engineer any software contained on Ideal Weddings's website",
        "• Remove any copyright or other proprietary notations from the materials",
        "• Transfer the materials to another person or 'mirror' the materials on any other server"
      ]
    },
    {
      title: "User Accounts",
      content: [
        "To access certain features of our service, you must create an account. You are responsible for maintaining the confidentiality of your account and password.",
        "You agree to accept responsibility for all activities that occur under your account or password. You may not use anyone else's account at any time.",
        "We reserve the right to terminate accounts, remove or edit content, or cancel orders at our sole discretion."
      ]
    },
    {
      title: "Vendor Services",
      content: [
        "Ideal Weddings acts as a platform connecting couples with wedding vendors. We do not provide vendor services directly and are not responsible for the quality, safety, or legality of vendor services.",
        "Vendors are independent contractors and are not employees or agents of Ideal Weddings. We do not guarantee the performance of any vendor.",
        "All transactions between users and vendors are subject to separate agreements between those parties. Ideal Weddings is not a party to such agreements."
      ]
    },
    {
      title: "Payment Terms",
      content: [
        "Payment for our services is due at the time of purchase. We accept various payment methods as indicated on our website.",
        "Prices for our services are subject to change without notice. We reserve the right to modify or discontinue any service at any time.",
        "Refunds are provided according to our refund policy, which may vary by service type and subscription plan.",
        "Late payments may result in service suspension or termination."
      ]
    },
    {
      title: "Intellectual Property Rights",
      content: [
        "The Service and its original content, features, and functionality are and will remain the exclusive property of Ideal Weddings and its licensors.",
        "The Service is protected by copyright, trademark, and other laws. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.",
        "Users retain ownership of content they submit, but grant us a license to use, modify, and display such content in connection with our services."
      ]
    },
    {
      title: "User Content",
      content: [
        "Users may submit content including reviews, photos, and comments. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute such content.",
        "You represent and warrant that you own or control all rights to the content you submit and that such content does not violate any third-party rights.",
        "We reserve the right to remove any content that violates these terms or is otherwise objectionable."
      ]
    },
    {
      title: "Prohibited Uses",
      content: [
        "You may not use our service for any unlawful purpose or to solicit others to perform unlawful acts.",
        "You may not violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances.",
        "You may not infringe upon or violate our intellectual property rights or the intellectual property rights of others.",
        "You may not harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate based on gender, sexual orientation, religion, ethnicity, race, age, national origin, or disability.",
        "You may not submit false or misleading information or impersonate any person or entity."
      ]
    },
    {
      title: "Limitation of Liability",
      content: [
        "In no event shall Ideal Weddings, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.",
        "Our liability is limited to the amount you paid for our services in the 12 months preceding the claim.",
        "We are not liable for any damages arising from your use of vendor services or third-party content."
      ]
    },
    {
      title: "Disclaimer of Warranties",
      content: [
        "The information on this website is provided on an 'as is' basis. Ideal Weddings makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.",
        "We do not warrant that the service will be uninterrupted, secure, or error-free, or that defects will be corrected."
      ]
    },
    {
      title: "Privacy Policy",
      content: [
        "Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices."
      ]
    },
    {
      title: "Termination",
      content: [
        "We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.",
        "If you wish to terminate your account, you may simply discontinue using the Service or contact us to delete your account.",
        "All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability."
      ]
    },
    {
      title: "Governing Law",
      content: [
        "These Terms shall be interpreted and governed by the laws of the jurisdiction in which Ideal Weddings operates, without regard to its conflict of law provisions.",
        "Any disputes arising from these terms or your use of our services shall be resolved through binding arbitration in accordance with our dispute resolution procedures."
      ]
    },
    {
      title: "Changes to Terms",
      content: [
        "We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.",
        "What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms."
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
              Terms of Service
            </h1>
            <p className="text-xl text-primary-100 max-w-2xl mx-auto">
              The terms and conditions governing your use of Ideal Weddings
            </p>
            <p className="text-primary-200 mt-4">
              Last updated: January 15, 2025
            </p>
          </div>
        </section>

        {/* Terms Content */}
        <section className="py-16">
          <div className="container-modern">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Introduction
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  These Terms of Service ("Terms") govern your use of the Ideal Weddings website and services operated by Ideal Weddings ("we," "us," or "our"). By accessing or using our service, you agree to be bound by these Terms.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  If you disagree with any part of these terms, then you may not access the service. These Terms apply to all visitors, users, and others who access or use the service.
                </p>
              </div>

              {termsSections.map((section, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {section.title}
                  </h2>
                  <div className="space-y-4">
                    {section.content.map((paragraph, paragraphIndex) => (
                      <p key={paragraphIndex} className="text-gray-700 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              ))}

              {/* Contact Information */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Contact Information
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Email:</strong> legal@idealweddings.com</p>
                  <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                  <p><strong>Address:</strong> 123 Wedding Way, Suite 100, Wedding City, WC 12345</p>
                </div>
                <p className="text-gray-700 leading-relaxed mt-6">
                  We're here to help clarify any questions you may have about these terms and your use of our services.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
