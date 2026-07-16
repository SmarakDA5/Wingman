import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
}

const NavItem = ({ to, icon }: NavItemProps) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `relative flex items-center justify-center min-h-[44pt] min-w-[44pt] rounded-full transition-all duration-300 ${
        isActive
          ? 'text-white bg-white/20'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/10'
      }`
    }
  >
    {({ isActive }) => (
      <motion.div
        animate={{ 
          scale: isActive ? 1.1 : 1,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="relative z-10 flex items-center justify-center"
      >
        {icon}
      </motion.div>
    )}
  </NavLink>
);

export const BottomNav = () => {
  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 pointer-events-none comfort-container">
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="pointer-events-auto liquid-glass rounded-full shadow-2xl px-6 py-4 flex items-center gap-4 mx-auto max-w-md"
      >
        <NavItem
          to="/app/dashboard"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          }
        />
        <div className="w-px h-8 bg-white/20 dark:bg-white/10" />
        <NavItem
          to="/app/likes"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          }
        />
        <div className="w-px h-8 bg-white/20 dark:bg-white/10" />
        <NavItem
          to="/app/info"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          }
        />
      </motion.nav>
    </div>
  );
};
