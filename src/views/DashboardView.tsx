import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDashboardStore } from '../stores/dashboardStore';
import { ScopeSlider } from '../components/ScopeSlider';
import { EventCard } from '../components/EventCard';

export const DashboardView = () => {
  const { scope, internships, schemes, jobs, setScope, fetchInternships, fetchSchemes, fetchJobs, toggleLike } = useDashboardStore();

  useEffect(() => {
    fetchInternships();
    fetchSchemes();
    fetchJobs();
  }, [scope]);

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black pb-24 transition-colors duration-500">
      <div className="glass-card shadow-sm backdrop-blur-xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white px-6 py-6">Dashboard</h1>
        <ScopeSlider value={scope} onChange={setScope} />
      </div>

      <div className="px-6 py-6 space-y-8">
      <div className="glass-card shadow-sm backdrop-blur-xl comfort-container">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white py-6">Dashboard</h1>
        <ScopeSlider value={scope} onChange={setScope} />
      </div>

      <div className="comfort-container py-6 space-y-8">
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
              {internships.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <EventCard
                    id={item.id}
                    title={item.title}
                    subtitle={item.company}
                    deadline={item.deadline}
                    isLiked={item.isLiked}
                    applicationUrl={item.applicationUrl}
                    videoUrl={item.videoUrl}
                    onLikeToggle={(id, isLiked) => toggleLike(id, 'internship', isLiked)}
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
              {schemes.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <EventCard
                    id={item.id}
                    title={item.title}
                    subtitle={item.organization}
                    deadline={item.deadline}
                    isLiked={item.isLiked}
                    applicationUrl={item.applicationUrl}
                    videoUrl={item.videoUrl}
                    onLikeToggle={(id, isLiked) => toggleLike(id, 'scheme', isLiked)}
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
              {jobs.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <EventCard
                    id={item.id}
                    title={item.title}
                    subtitle={item.company}
                    deadline={item.deadline}
                    isLiked={item.isLiked}
                    applicationUrl={item.applicationUrl}
                    videoUrl={item.videoUrl}
                    onLikeToggle={(id, isLiked) => toggleLike(id, 'job', isLiked)}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No jobs found</p>
          )}
        </section>
      </div>
    </div>
  );
};
