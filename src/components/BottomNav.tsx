import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, User, Heart, LogOut } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

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
      `relative flex flex-col items-center justify-center min-h-[44px] min-w-[60px] rounded-xl transition-all duration-300 ${
        isActive !== undefined
          ? isActive
            ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
          : linkIsActive
          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`
    }
  >
    {({ isActive: linkIsActive }) => (
      <motion.div
        initial={false}
        animate={{ scale: (isActive !== undefined ? isActive : linkIsActive) ? 1.1 : 1 }}
        className="flex flex-col items-center gap-1"
      >
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
      </motion.div>
    )}
  </NavLink>
);

export const BottomNav = ({ activeTab, setActiveTab }: BottomNavProps = {}) => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 safe-area-pb"
    >
      <div className="max-w-md mx-auto flex items-center justify-around px-4 py-2">
        <NavItem 
          to="/app/feeds" 
          icon={<Home size={20} />} 
          label="Feeds" 
          isActive={activeTab === 'feeds'}
          onClick={() => setActiveTab?.('feeds')}
        />
        <NavItem 
          to="/app/info" 
          icon={<User size={20} />} 
          label="Profile" 
          isActive={activeTab === 'profile'}
          onClick={() => setActiveTab?.('profile')}
        />
        <NavItem 
          to="/app/likes" 
          icon={<Heart size={20} />} 
          label="Likes" 
          isActive={activeTab === 'likes'}
          onClick={() => setActiveTab?.('likes')}
        />
        
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[60px] rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut size={20} />
          <span className="text-[10px] font-medium">Logout</span>
        </button>
      </div>
    </motion.nav>
  );
};
