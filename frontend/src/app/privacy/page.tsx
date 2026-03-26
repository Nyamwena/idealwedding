import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function PrivacyPage() {
  const privacySections = [
    {
      title: "Information We Collect",
      content: [
        "Personal Information: We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us. This may include your name, email address, phone number, wedding date, and other details relevant to wedding planning.",
        "Usage Information: We automatically collect certain information about your use of our services, including your IP address, browser type, device information, pages visited, and time spent on our platform.",
        "Vendor Information: If you're a vendor, we collect business information, licenses, insurance details, and other professional credentials to verify your services.",
        "Payment Information: We collect payment information when you make purchases, though we do not store complete credit card details on our servers."
      ]
    },
    {
      title: "How We Use Your Information",
      content: [
        "Provide Services: We use your information to provide, maintain, and improve our wedding planning services, including connecting you with vendors and managing your wedding projects.",
        "Communication: We use your contact information to send you important updates about your account, respond to your inquiries, and provide customer support.",
        "Personalization: We use your preferences and usage data to personalize your experience and recommend relevant vendors and services.",
        "Security: We use information to detect and prevent fraud, abuse, and other security threats.",
        "Legal Compliance: We may use your information to comply with applicable laws, regulations, and legal processes."
      ]
    },
    {
      title: "Information Sharing and Disclosure",
      content: [
        "Vendors: We share relevant information with vendors you choose to contact or book through our platform, but only with your explicit consent.",
        "Service Providers: We may share information with trusted third-party service providers who help us operate our platform, such as payment processors and hosting services.",
        "Legal Requirements: We may disclose information if required by law or to protect our rights, property, or safety, or that of our users or the public.",
        "Business Transfers: In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the business transaction."
      ]
    },
    {
      title: "Data Security",
      content: [
        "Encryption: We use industry-standard encryption to protect your data both in transit and at rest.",
        "Access Controls: We implement strict access controls to ensure only authorized personnel can access your information.",
        "Regular Audits: We regularly review and update our security practices to protect against unauthorized access, alteration, disclosure, or destruction of your information.",
        "Incident Response: We have procedures in place to respond to security incidents and will notify you if we believe your information has been compromised."
      ]
    },
    {
      title: "Your Rights and Choices",
      content: [
        "Access and Update: You can access and update your personal information through your account settings at any time.",
        "Data Portability: You can request a copy of your data in a portable format.",
        "Deletion: You can request deletion of your account and associated data, subject to certain legal and business requirements.",
        "Marketing Communications: You can opt out of marketing communications while still receiving important service-related messages.",
        "Cookies: You can control cookie settings through your browser preferences."
      ]
    },
    {
      title: "Data Retention",
      content: [
        "Account Data: We retain your account information for as long as your account is active or as needed to provide services.",
        "Usage Data: We retain usage data for analytics and service improvement purposes, typically for 2-3 years.",
        "Legal Requirements: We may retain certain information to comply with legal obligations, resolve disputes, and enforce our agreements.",
        "Deletion: When you delete your account, we will delete or anonymize your personal information within 30 days, except where retention is required by law."
      ]
    },
    {
      title: "International Data Transfers",
      content: [
        "Global Operations: Our services may be accessed from various countries, and your information may be transferred to and processed in countries other than your own.",
        "Adequate Protection: We ensure that any international transfers of your data are protected by appropriate safeguards, such as standard contractual clauses or adequacy decisions.",
        "Compliance: We comply with applicable data protection laws regarding international data transfers."
      ]
    },
    {
      title: "Children's Privacy",
      content: [
        "Age Requirement: Our services are not intended for children under 18 years of age.",
        "No Collection: We do not knowingly collect personal information from children under 18.",
        "Parental Consent: If we become aware that we have collected personal information from a child under 18, we will take steps to delete such information."
      ]
    },
    {
      title: "Changes to This Policy",
      content: [
        "Updates: We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws.",
        "Notification: We will notify you of any material changes by posting the new policy on our website and updating the 'Last Updated' date.",
        "Continued Use: Your continued use of our services after any changes indicates your acceptance of the updated policy.",
        "Review: We encourage you to review this policy periodically to stay informed about how we protect your information."
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
              Privacy Policy
            </h1>
            <p className="text-xl text-primary-100 max-w-2xl mx-auto">
              How we collect, use, and protect your personal information
            </p>
            <p className="text-primary-200 mt-4">
              Last updated: January 15, 2025
            </p>
          </div>
        </section>

        {/* Privacy Policy Content */}
        <section className="py-16">
          <div className="container-modern">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Introduction
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  At Ideal Weddings, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our wedding planning platform and services.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  By using our services, you agree to the collection and use of information in accordance with this policy. If you have any questions about this Privacy Policy, please contact us using the information provided at the end of this document.
                </p>
              </div>

              {privacySections.map((section, index) => (
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
                  Contact Us
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Email:</strong> privacy@idealweddings.com</p>
                  <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                  <p><strong>Address:</strong> 123 Wedding Way, Suite 100, Wedding City, WC 12345</p>
                </div>
                <p className="text-gray-700 leading-relaxed mt-6">
                  We will respond to your inquiry within 48 hours and are committed to addressing any privacy concerns you may have.
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
