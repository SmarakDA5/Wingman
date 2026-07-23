import { useParams, Link, useLocation } from 'react-router-dom';

type Doc = { title: string; updated: string; intro: string; email: string; sections: { h: string; b: string }[] };

const E = 'mrlearnersmarak666@gmail.com';

const DOCS: Record<string, Doc> = {
  'privacy-policy': {
    title: 'Privacy Policy', updated: '2026-07-22', email: E,
    intro: 'Demonstration Privacy Policy for the Wingman student platform — placeholder content for development and review.',
    sections: [
      { h: '1. Information We Collect', b: 'Account details (name, email, password) and profile answers (education, field, GPA, skills, goals, interest level), plus items you like or save.' },
      { h: '2. How We Use It', b: 'To authenticate you, manage your trial/subscription, and group you with similar students to surface relevant opportunities.' },
      { h: '3. Storage & Security', b: 'Passwords are stored only as one-way hashes. Data lives in a managed PostgreSQL database with backend-only access.' },
      { h: '4. Your Rights', b: 'Update your profile anytime; request correction or deletion by emailing the address below.' },
      { h: '5. Cookies', b: 'Only the minimal storage needed to keep you signed in. No ad trackers; we do not sell data.' },
    ],
  },
  'terms-of-service': {
    title: 'Terms of Service', updated: '2026-07-22', email: E,
    intro: 'Demonstration Terms of Service for the Wingman student platform — placeholder content for development and review.',
    sections: [
      { h: '1. Acceptance', b: 'By using Wingman you agree to these terms.' },
      { h: '2. Free Trial', b: 'New accounts get a 7-day trial with full access; continued access afterwards requires an active subscription or approved extension.' },
      { h: '3. Your Account', b: 'Keep credentials secret and profile info accurate. Do not share accounts or misuse the service.' },
      { h: '4. Recommendations', b: 'Listings are aggregated from public sources and matched automatically; always verify details and deadlines on the provider’s site.' },
      { h: '5. Disclaimer', b: 'Provided "as is" without warranties; we do not guarantee placement or outcomes. Liability limited to the maximum extent permitted by law.' },
    ],
  },
  'contact': {
    title: 'Contact Us', updated: '2026-07-22', email: E,
    intro: 'Questions, feedback, or a subscription-extension request? Email the address below and include your Wingman account email.',
    sections: [
      { h: 'Support', b: 'For bugs or account help, email us with the email on your Wingman account so we can find your record.' },
      { h: 'Extensions', b: 'If your trial ended and you need more time, email with subject "Wingman subscription extension".' },
      { h: 'Response Time', b: 'Student project — best-effort, typically a few business days.' },
    ],
  },
};

const ALIAS: Record<string, string> = {
  privacy: 'privacy-policy', 'privacy-policy': 'privacy-policy',
  terms: 'terms-of-service', 'terms-of-service': 'terms-of-service', tos: 'terms-of-service',
  contact: 'contact',
};

export function LegalPage({ slug }: { slug?: string } = {}) {
  const { slug: param } = useParams<{ slug?: string }>();
  const { pathname } = useLocation();
  const raw = (slug ?? param ?? pathname.split('/').filter(Boolean).pop() ?? '').toLowerCase();
  const doc = DOCS[ALIAS[raw] ?? ''];

  if (!doc) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Page Not Found</h1>
          <Link to="/" className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-2xl">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black transition-colors duration-500">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/" className="inline-flex items-center text-purple-600 dark:text-purple-400 mb-4">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </Link>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-1">{doc.title}</h1>
        <p className="text-sm text-gray-500 mb-6">Last updated: {doc.updated}</p>
        <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-lg">
          <p className="text-gray-700 dark:text-gray-300 mb-4">{doc.intro}</p>
          {doc.sections.map((s) => (
            <section key={s.h} className="mt-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{s.h}</h2>
              <p className="mt-1 text-gray-700 dark:text-gray-300" style={{ lineHeight: 1.8 }}>{s.b}</p>
            </section>
          ))}
          <p className="mt-8 text-sm">Email: <a className="font-medium text-blue-600 underline dark:text-blue-400" href={`mailto:${doc.email}`}>{doc.email}</a></p>
        </div>
        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-wrap gap-6 text-sm text-gray-600 dark:text-gray-400">
          <Link to="/privacy-policy" className="hover:text-purple-600 dark:hover:text-purple-400">Privacy Policy</Link>
          <Link to="/terms-of-service" className="hover:text-purple-600 dark:hover:text-purple-400">Terms of Service</Link>
          <Link to="/contact" className="hover:text-purple-600 dark:hover:text-purple-400">Contact</Link>
        </div>
      </div>
    </div>
  );
}

export default LegalPage;
