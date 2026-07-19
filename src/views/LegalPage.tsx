import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import webhooks from '../services/api';

interface LegalPageData {
  slug: string;
  title: string;
  content: string;
  version: string;
}

export const LegalPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [pageData, setPageData] = useState<LegalPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLegalPage = async () => {
      if (!slug) {
        setError('Invalid page');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await webhooks.fetchLegalPage(slug);
        const data = Array.isArray(result) ? result[0] : result;
        
        if (data?.title && data?.content) {
          setPageData(data);
        } else {
          setError('Page not found');
        }
      } catch (err) {
        console.error('Failed to fetch legal page:', err);
        setError('Failed to load page content');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLegalPage();
  }, [slug]);

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
