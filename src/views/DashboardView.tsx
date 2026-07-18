import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDashboardStore } from '../stores/dashboardStore';
import { useProfileStore } from '../stores/profileStore';
import { ScopeSlider } from '../components/ScopeSlider';
import { EventCard } from '../components/EventCard';
import type { FeedItem } from '../types';

export const DashboardView = () => {
  const navigate = useNavigate();
  const { sliderValue, setSliderValue, initializeData, isInitialized, getFilteredInternships, getFilteredSchemes, getFilteredJobs, getFilteredCourses, toggleLike } = useDashboardStore();
  const { isProfileValid, fetchProfile, isInitialized: isProfileInitialized } = useProfileStore();

  useEffect(() => {
    // Initialize data once on mount - fetch all data without scope filtering
    if (!isInitialized) {
      initializeData();
    }
  }, [isInitialized, initializeData]);

  useEffect(() => {
    // Fetch profile data to check validity
    if (!isProfileInitialized) {
      fetchProfile();
    }
  }, [isProfileInitialized, fetchProfile]);

  // Get filtered items using computed selectors tied to sliderValue
  const internships: FeedItem[] = getFilteredInternships();
  const schemes: FeedItem[] = getFilteredSchemes();
  const jobs: FeedItem[] = getFilteredJobs();
  const courses: FeedItem[] = getFilteredCourses();

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black pb-24 transition-colors duration-500">
      {/* Profile Validity Banner */}
      {!isProfileValid && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-400 p-4 mx-6 mt-4 rounded-xl">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Please complete your profile questions to get recommendations.
            </p>
            <button
              onClick={() => navigate('/app/info')}
              className="text-yellow-700 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-200 text-sm font-semibold underline"
            >
              Complete Profile
            </button>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <div className="glass-card shadow-sm backdrop-blur-xl">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white px-6 py-6">Dashboard</h1>
          <ScopeSlider value={sliderValue} onChange={setSliderValue} />
        </div>

        {/* Hide feed content if profile is not valid */}
        {!isProfileValid ? (
          <div className="px-6 py-12 text-center">
            <div className="liquid-glass rounded-2xl shadow-md p-8">
              <svg className="w-16 h-16 mx-auto text-yellow-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Profile Incomplete
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Complete your profile questions to see personalized recommendations.
              </p>
              <button
                onClick={() => navigate('/app/info')}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Go to Profile
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-6 space-y-8">
        {/* Internships Section */}
        <section>
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-semibold text-gray-900 dark:text-white mb-4"
          >
            Internships
          </motion.h2>
          {internships.length > 0 ? (
            <div className="space-y-4">
              {internships.map((item: FeedItem, index: number) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <EventCard
                    item={item}
                    onLikeToggle={(id: number, isLiked: boolean) => toggleLike(id, 'internships', isLiked)}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No internships found</p>
          )}
        </section>

        {/* Schemes/Scholarships Section */}
        <section>
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl font-semibold text-gray-900 dark:text-white mb-4"
          >
            Schemes & Scholarships
          </motion.h2>
          {schemes.length > 0 ? (
            <div className="space-y-4">
              {schemes.map((item: FeedItem, index: number) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <EventCard
                    item={item}
                    onLikeToggle={(id: number, isLiked: boolean) => toggleLike(id, 'schemes', isLiked)}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No schemes found</p>
          )}
        </section>

        {/* Jobs Section */}
        <section>
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-semibold text-gray-900 dark:text-white mb-4"
          >
            Jobs
          </motion.h2>
          {jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.map((item: FeedItem, index: number) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <EventCard
                    item={item}
                    onLikeToggle={(id: number, isLiked: boolean) => toggleLike(id, 'jobs', isLiked)}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No jobs found</p>
          )}
        </section>

        {/* Courses and Certifications Section */}
        <section>
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl font-semibold text-gray-900 dark:text-white mb-4"
          >
            Courses and Certifications
          </motion.h2>
          {courses.length > 0 ? (
            <div className="space-y-4">
              {courses.map((item: FeedItem, index: number) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <EventCard
                    item={item}
                    onLikeToggle={(id: number, isLiked: boolean) => toggleLike(id, 'courses', isLiked)}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No courses found</p>
          )}
        </section>
          </div>
        )}
      </div>
    </div>
  );
};
