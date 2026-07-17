import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDashboardStore } from '../stores/dashboardStore';
import { ScopeSlider } from '../components/ScopeSlider';
import { EventCard } from '../components/EventCard';
import type { FeedItem } from '../types';

export const DashboardView = () => {
  const { sliderValue, setSliderValue, initializeData, isInitialized, getFilteredInternships, getFilteredSchemes, getFilteredJobs, getFilteredCourses, toggleLike } = useDashboardStore();

  useEffect(() => {
    // Initialize data once on mount - fetch all data without scope filtering
    if (!isInitialized) {
      initializeData();
    }
  }, [isInitialized, initializeData]);

  // Get filtered items using computed selectors tied to sliderValue
  const internships: FeedItem[] = getFilteredInternships();
  const schemes: FeedItem[] = getFilteredSchemes();
  const jobs: FeedItem[] = getFilteredJobs();
  const courses: FeedItem[] = getFilteredCourses();

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black pb-24 transition-colors duration-500">
      <div className="max-w-2xl mx-auto">
        <div className="glass-card shadow-sm backdrop-blur-xl">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white px-6 py-6">Dashboard</h1>
          <ScopeSlider value={sliderValue} onChange={setSliderValue} />
        </div>

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
    </div>
  </div>
  );
};
