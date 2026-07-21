import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';

interface LegalPageData {
  slug: string;
  title: string;
  content: string;
  version: string;
}

// Hardcoded legal pages since /legal/:slug gateway is not in this n8n cluster
const LEGAL_PAGES: Record<string, LegalPageData> = {
  'privacy-policy': {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    content: `Last Updated: January 2025

1. Introduction
Welcome to our platform. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights.

2. Information We Collect
We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
- Identity Data: includes first name, last name, username or similar identifier.
- Contact Data: includes email address and telephone numbers.
- Technical Data: includes internet protocol (IP) address, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform.
- Usage Data: includes information about how you use our website, products and services.

3. How We Use Your Information
We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
- To provide and maintain our services
- To notify you about changes to our services
- To provide customer support
- To gather analysis or valuable information so that we can improve our services
- To monitor the usage of our services
- To detect, prevent and address technical issues

4. Data Security
We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.

5. Data Retention
We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements.

6. Your Legal Rights
Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:
- Request access to your personal data
- Request correction of your personal data
- Request erasure of your personal data
- Object to processing of your personal data
- Request restriction of processing your personal data
- Request transfer of your personal data

7. Contact Us
If you have any questions about this privacy policy or our privacy practices, please contact us at: mrlearnersmarak666@gmail.com`,
    version: '1.0.0',
  },
  'terms-of-service': {
    slug: 'terms-of-service',
    title: 'Terms of Service',
    content: `Last Updated: January 2025

1. Acceptance of Terms
By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this service.

2. Description of Service
Our platform provides educational content, resources, and related services. We reserve the right to modify, suspend, or discontinue any part of the service at any time without prior notice.

3. User Accounts
To access certain features of the service, you may be required to create an account. You are responsible for:
- Maintaining the confidentiality of your account credentials
- All activities that occur under your account
- Notifying us immediately of any unauthorized use of your account

4. User Conduct
You agree not to:
- Use the service in any way that violates any applicable federal, state, local, or international law or regulation
- Engage in any conduct that restricts or inhibits anyone's use or enjoyment of the service
- Attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of the service
- Use any robot, spider, or other automatic device to access the service

5. Intellectual Property
The service and its original content, features, and functionality are owned by us and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.

6. Disclaimer of Warranties
Your use of the service is at your sole risk. The service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, express or implied, regarding the service.

7. Limitation of Liability
In no event shall we be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.

8. Changes to Terms
We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our service after those revisions become effective, you agree to be bound by the revised terms.

9. Contact Information
For any questions regarding these Terms of Service, please contact us at: mrlearnersmarak666@gmail.com`,
    version: '1.0.0',
  },
  'contact': {
    slug: 'contact',
    title: 'Contact Us',
    content: `Get in Touch

We'd love to hear from you! Whether you have a question, feedback, or just want to say hello, feel free to reach out to us.

Email: mrlearnersmarak666@gmail.com

Business Hours
Monday - Friday: 9:00 AM - 6:00 PM (EST)
Saturday: 10:00 AM - 4:00 PM (EST)
Sunday: Closed

Response Time
We typically respond to all inquiries within 24-48 hours during business days.

What to Include in Your Message
To help us serve you better, please include the following information when contacting us:
- Your name
- A detailed description of your inquiry
- Any relevant account information (if applicable)
- Screenshots or error messages (if reporting an issue)

We appreciate your patience and look forward to assisting you!`,
    version: '1.0.0',
  },
};

const ALIAS: Record<string, string> = {
  privacy: 'privacy-policy',
  'privacy-policy': 'privacy-policy',
  terms: 'terms-of-service',
  'terms-of-service': 'terms-of-service',
  tos: 'terms-of-service',
  contact: 'contact',
};

export const LegalPage = ({ slug: slugProp }: { slug?: string }) => {
  const { slug: slugParam } = useParams<{ slug?: string }>();
  const { pathname } = useLocation();
  const [pageData, setPageData] = useState<LegalPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Resolution order: prop -> route param -> last path segment -> alias map
    const raw = (slugProp ?? slugParam ?? pathname.split('/').filter(Boolean).pop() ?? '').toLowerCase();
    const key = ALIAS[raw] ?? 'privacy-policy';
    const data = LEGAL_PAGES[key];
    if (data?.title && data?.content) {
      setPageData(data);
      setError(null);
    } else {
      setError('Page not found');
    }
    setIsLoading(false);
  }, [slugProp, slugParam, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] dark:bg-black flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Page Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">{error || 'The requested page does not exist.'}</p>
          <Link
            to="/"
            className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black transition-colors duration-500">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 mb-4 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {pageData.title}
          </h1>
          {pageData.version && (
            <p className="text-sm text-gray-500 dark:text-gray-500">Version: {pageData.version}</p>
          )}
        </div>

        {/* Content */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-lg">
          <div
            className="prose prose-gray dark:prose-invert max-w-none"
            style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}
          >
            {pageData.content}
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap gap-6 text-sm text-gray-600 dark:text-gray-400">
            <Link to="/privacy-policy" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              Terms of Service
            </Link>
            <Link to="/contact" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
