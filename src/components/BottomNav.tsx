import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, User, Heart } from 'lucide-react';

interface BottomNavProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

const NavItem = ({ to, icon, label, isActive, onClick }: NavItemProps) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive: linkIsActive }) =>
      `relative flex items-center justify-center min-h-[44px] px-4 rounded-full transition-all duration-300 ${
        isActive !== undefined
          ? isActive
            ? 'text-white bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg shadow-purple-500/30'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          : linkIsActive
          ? 'text-white bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg shadow-purple-500/30'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
      }`
    }
  >
    {({ isActive: linkIsActive }) => (
      <motion.div
        initial={false}
        animate={{ scale: (isActive !== undefined ? isActive : linkIsActive) ? 1.05 : 1 }}
        className="flex items-center gap-2"
      >
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </motion.div>
    )}
  </NavLink>
);

export const BottomNav = ({ activeTab, setActiveTab }: BottomNavProps = {}) => {
  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-6 left-0 right-0 z-50 flex justify-center safe-area-pb"
    >
      <div className="liquid-glass rounded-full shadow-2xl px-2 py-2 flex items-center gap-2">
        <NavItem 
          to="/app/feeds" 
          icon={<Home size={18} />} 
          label="Feeds" 
          isActive={activeTab === 'feeds'}
          onClick={() => setActiveTab?.('feeds')}
        />
        <NavItem 
          to="/app/likes" 
          icon={<Heart size={18} />} 
          label="Likes" 
          isActive={activeTab === 'likes'}
          onClick={() => setActiveTab?.('likes')}
        />
        <NavItem 
          to="/app/info" 
          icon={<User size={18} />} 
          label="Profile" 
          isActive={activeTab === 'profile'}
          onClick={() => setActiveTab?.('profile')}
        />
      </div>
    </motion.nav>
  );
};
