import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  ClipboardList, 
  Library, 
  Menu, 
  X,
  ChevronDown,
  GraduationCap,
  User,
  LogOut,
  Settings,
  TrendingUp,
  Layers,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguageStore } from '@/store/languageStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/services/supabase';
import { useToast } from '@/components/Toast';

type NavItemType = {
  path: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  className?: string;
  requiresAuth: boolean;
} | {
  type: 'dropdown';
  icon: React.ReactNode;
  label: string;
  items: { path: string; label: string; }[];
  requiresAuth: boolean;
};

export const Navigation = () => {
  const { t } = useLanguageStore();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGenerateMenuOpen, setIsGenerateMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuthStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userFullName, setUserFullName] = useState<string>('');

  const isTaskPreviewPage = location.pathname === '/task-preview';
  const isGenerateActive = location.pathname.includes('/generate-') || isTaskPreviewPage;
  const isProfileActive = location.pathname === '/profile';

  // Feature flag: Hide study groups in testing mode
  const ENABLE_STUDY_GROUPS = false; // Set to true to enable study groups
  // Feature flag: Hide statistics in testing mode
  const ENABLE_STATISTICS = true; // Set to true to enable statistics

  const navItems: NavItemType[] = [
    {
      path: '/',
      label: t('nav.home'),
      icon: <Home className="h-5 w-5" />,
      isActive: location.pathname === '/',
      className: 'transform transition-all duration-200 hover:scale-105 hover:shadow-md',
      requiresAuth: false
    },
    {
      path: '/generate-task',
      label: t('nav.generateTask'),
      icon: <ClipboardList className="h-5 w-5" />,
      isActive: location.pathname === '/generate-task' || location.pathname === '/task-preview',
      className: 'transform transition-all duration-200 hover:scale-105 hover:shadow-md',
      requiresAuth: true
    },
    {
      path: '/library',
      label: t('nav.library'),
      icon: <Library className="h-5 w-5" />,
      isActive: location.pathname === '/library',
      className: 'transform transition-all duration-200 hover:scale-105 hover:shadow-md',
      requiresAuth: true
    },
    {
      path: '/sheets',
      label: 'Task Sheets',
      icon: <Layers className="h-5 w-5" />,
      isActive: location.pathname.startsWith('/sheets'),
      className: 'transform transition-all duration-200 hover:scale-105 hover:shadow-md',
      requiresAuth: true
    },
    // Study Groups - Hidden in testing mode
    ...(ENABLE_STUDY_GROUPS ? [{
      path: '/study-groups',
      label: 'Study Groups',
      icon: <Users className="h-5 w-5" />,
      isActive: location.pathname === '/study-groups',
      className: 'transform transition-all duration-200 hover:scale-105 hover:shadow-md',
      requiresAuth: true
    }] : [])
  ];

  const userMenuItems = [
    {
      path: '/profile',
      label: 'Profile',
      icon: <User className="h-4 w-4" />
    },
    // Statistics - Hidden in testing mode
    ...(ENABLE_STATISTICS ? [{
      path: '/statistics',
      label: 'Statistics',
      icon: <TrendingUp className="h-4 w-4" />
    }] : []),
    {
      path: '/settings',
      label: 'Settings',
      icon: <Settings className="h-4 w-4" />
    }
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', user.id)
            .single();
          
          if (error) {
            console.error('Error fetching profile:', error);
            setUserFullName('');
            return;
          }
          
          if (data) {
            // Trim and check if we have actual name values
            const firstName = (data.first_name || '').trim();
            const lastName = (data.last_name || '').trim();
            const fullName = `${firstName} ${lastName}`.trim();
            
            // Only set if we have a non-empty name
            setUserFullName(fullName || '');
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          setUserFullName('');
        }
      } else {
        setUserFullName('');
      }
    };

    fetchProfile();
  }, [user]);

  const NavItem = ({ path, icon, label, isActive, className = '', requiresAuth }: { 
    path: string; 
    icon: React.ReactNode; 
    label: string; 
    isActive?: boolean;
    className?: string;
    requiresAuth: boolean;
  }) => {
    if (requiresAuth && !user) return null;
    
    const shouldHighlight = isActive || (path === '/generate-task' && isTaskPreviewPage);
    return (
      <NavLink
        to={path}
        className={`flex items-center px-4 py-2 rounded-full transition-colors ${
          shouldHighlight
            ? 'bg-primary/10 text-primary' 
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
        } ${className}`}
      >
        {icon}
        <span className="ml-2">{label}</span>
      </NavLink>
    );
  };

  const handleProfileClick = () => {
    setShowProfileMenu(false);
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowProfileMenu(false);
      setIsMobileMenuOpen(false);
      showToast('Successfully signed out', 'success');
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      showToast('Failed to sign out. Please try again.', 'error');
    }
  };

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 transform transition-all duration-25 hover:scale-110">
              <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-primary rounded-xl">
                <GraduationCap className="w-6 h-6 md:w-8 md:h-8 text-primary-foreground" />
              </div>
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 
                             bg-clip-text text-transparent hidden sm:inline">
                EXPP
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-4 ml-12">
              {navItems.map((item, index) => 
                'type' in item ? (
                  <div key={index} className="relative">
                    <button
                      onClick={() => setIsGenerateMenuOpen(!isGenerateMenuOpen)}
                      className={`flex items-center px-4 py-2 rounded-full transition-colors ${
                        isGenerateActive 
                          ? 'bg-primary/10 text-primary' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                    >
                      {item.icon}
                      <span className="ml-2">{item.label}</span>
                      <ChevronDown className={`ml-2 w-4 h-4 transition-transform ${
                        isGenerateMenuOpen ? 'transform rotate-180' : ''
                      }`} />
                    </button>

                    <AnimatePresence>
                      {isGenerateMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute left-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg py-1 z-50"
                        >
                          {item.items.map((subItem, subIndex) => (
                            <NavLink
                              key={subIndex}
                              to={subItem.path}
                              className={({ isActive }) =>
                                `block px-4 py-2 text-sm ${
                                  isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-accent'
                                }`
                              }
                              onClick={() => setIsGenerateMenuOpen(false)}
                            >
                              {subItem.label}
                            </NavLink>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <NavItem key={index} {...item} />
                )
              )}
            </div>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transform transition-all duration-200 hover:scale-105 hover:shadow-md ${
                    isProfileActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <User className={`w-5 h-5 ${isProfileActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="hidden sm:inline">
                    {userFullName || 'Profile'}
                  </span>
                </button>
                
                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg py-1 z-50"
                    >
                      {userMenuItems.map((item, index) => (
                        <Link
                          key={index}
                          to={item.path}
                          onClick={handleProfileClick}
                          className="block px-4 py-2 text-muted-foreground hover:bg-accent"
                        >
                          <div className="flex items-center">
                            {item.icon}
                            <span className="ml-2">{item.label}</span>
                          </div>
                        </Link>
                      ))}
                      
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <div className="flex items-center">
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </div>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-4 ml-8">
                <Link
                  to="/login"
                  className="px-4 py-2 text-muted-foreground hover:text-foreground rounded-full"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-full
                           hover:bg-primary/90 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden"
            >
              <div className="px-2 pt-2 pb-3 space-y-1 bg-background border-t border-border">
                {navItems.map((item, index) => 
                  'type' in item ? (
                    <div key={index} className="relative">
                      <button
                        onClick={() => setIsGenerateMenuOpen(!isGenerateMenuOpen)}
                        className="w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
                      >
                        {item.icon}
                        <span className="ml-3">{item.label}</span>
                        <ChevronDown className={`ml-auto w-4 h-4 transition-transform ${
                          isGenerateMenuOpen ? 'transform rotate-180' : ''
                        }`} />
                      </button>
                      {isGenerateMenuOpen && (
                        <div className="pl-4 space-y-1">
                          {item.items.map((subItem, subIndex) => (
                            <NavLink
                              key={subIndex}
                              to={subItem.path}
                              className={({ isActive }) =>
                                `block px-3 py-2 rounded-md text-base font-medium ${
                                  isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-accent'
                                }`
                              }
                              onClick={() => {
                                setIsGenerateMenuOpen(false);
                                setIsMobileMenuOpen(false);
                              }}
                            >
                              {subItem.label}
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <NavLink
                      key={index}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-2 rounded-md text-base font-medium ${
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-accent'
                        }`
                      }
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.icon}
                      <span className="ml-3">{item.label}</span>
                    </NavLink>
                  )
                )}
                
                {user && (
                  <div className="border-t border-border pt-4 mt-4">
                    {userMenuItems.map((item, index) => (
                      <NavLink
                        key={index}
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center px-3 py-2 rounded-md text-base font-medium ${
                            isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'
                          }`
                        }
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.icon}
                        <span className="ml-3">{item.path === '/profile' ? userFullName || 'Profile' : item.label}</span>
                      </NavLink>
                    ))}
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-red-500 hover:bg-red-500/10"
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="ml-3">{t('nav.signOut')}</span>
                    </button>
                  </div>
                )}

                {!user && (
                  <div className="border-t border-border pt-4 mt-4 flex flex-col gap-2">
                    <Link
                      to="/login"
                      className="block w-full px-3 py-2 text-center rounded-md text-base font-medium
                               text-muted-foreground hover:text-foreground hover:bg-accent"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="block w-full px-3 py-2 text-center rounded-md text-base font-medium
                               bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};