'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type NavItemType = {
  path: string;
  icon: React.ReactNode;
  label: string;
  requiresAuth: boolean;
} | {
  type: 'dropdown';
  icon: React.ReactNode;
  label: string;
  items: { path: string; label: string; requiresAuth: boolean }[];
  requiresAuth: boolean;
};

export const Navigation = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGenerateMenuOpen, setIsGenerateMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userFullName, setUserFullName] = useState<string>('');

  const user = session?.user || null;

  const navItems: NavItemType[] = [
    {
      path: '/',
      label: 'Home',
      icon: <Home className="h-5 w-5" />,
      requiresAuth: false
    },
    {
      path: '/generate-task',
      label: 'Generate Task',
      icon: <ClipboardList className="h-5 w-5" />,
      requiresAuth: true
    },
    {
      path: '/tasks',
      label: 'Task Library',
      icon: <Library className="h-5 w-5" />,
      requiresAuth: true
    },
    {
      path: '/sheets',
      label: 'Task Sheets',
      icon: <Layers className="h-5 w-5" />,
      requiresAuth: true
    },
  ];

  const userMenuItems = [
    {
      path: '/profile',
      label: 'Profile',
      icon: <User className="h-4 w-4" />,
    },
    {
      path: '/statistics',
      label: 'Statistics',
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const response = await fetch('/api/profile');
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              const firstName = (data.data.firstName || '').trim();
              const lastName = (data.data.lastName || '').trim();
              const fullName = `${firstName} ${lastName}`.trim();
              setUserFullName(fullName || user.email || '');
            }
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          setUserFullName(user.email || '');
        }
      } else {
        setUserFullName('');
      }
    };

    fetchProfile();
  }, [user]);

  const NavItem = ({ path, icon, label, requiresAuth }: {
    path: string;
    icon: React.ReactNode;
    label: string;
    requiresAuth: boolean;
  }) => {
    if (requiresAuth && !user) return null;

    const isActive = pathname === path || (path !== '/' && pathname.startsWith(path));

    return (
      <Link
        href={path}
        className={cn(
          "flex items-center px-4 py-2 rounded-full transition-colors",
          isActive
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
        )}
      >
        {icon}
        <span className="ml-2">{label}</span>
      </Link>
    );
  };

  const handleProfileClick = useCallback(() => {
    setShowProfileMenu(false);
    setIsMobileMenuOpen(false);
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut({ callbackUrl: '/auth/signin' });
      setShowProfileMenu(false);
      setIsMobileMenuOpen(false);
      showToast('Successfully signed out', 'success');
    } catch (error) {
      console.error('Error signing out:', error);
      showToast('Failed to sign out. Please try again.', 'error');
    }
  }, [showToast]);

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 transform transition-all duration-200 hover:scale-105">
              <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-blue-600 dark:bg-blue-500 rounded-xl">
                <GraduationCap className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent hidden sm:inline">
                EXPP
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-4 ml-12">
              {navItems.map((item, index) => (
                'type' in item ? null : (
                  <NavItem key={index} {...item} />
                )
              ))}
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-full transform transition-all duration-200 hover:scale-105 hover:shadow-md",
                    pathname === '/profile'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  <User className="w-5 h-5" />
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
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50"
                    >
                      {userMenuItems.map((item, index) => (
                        <Link
                          key={index}
                          href={item.path}
                          onClick={handleProfileClick}
                          className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                        >
                          {item.icon}
                          <span className="ml-2">{item.label}</span>
                        </Link>
                      ))}

                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="ml-2">Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-4 ml-8">
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-full hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden"
            >
              <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                {navItems.map((item, index) => {
                  if ('type' in item) return null;
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={index}
                      href={item.path}
                      className={cn(
                        "flex items-center px-3 py-2 rounded-md text-base font-medium",
                        isActive
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.icon}
                      <span className="ml-3">{item.label}</span>
                    </Link>
                  );
                })}

                {user && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    {userMenuItems.map((item, index) => (
                      <Link
                        key={index}
                        href={item.path}
                        className={cn(
                          "flex items-center px-3 py-2 rounded-md text-base font-medium",
                          pathname === item.path
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.icon}
                        <span className="ml-3">{item.path === '/profile' ? userFullName || 'Profile' : item.label}</span>
                      </Link>
                    ))}
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="ml-3">Sign Out</span>
                    </button>
                  </div>
                )}

                {!user && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 flex flex-col gap-2">
                    <Link
                      href="/auth/signin"
                      className="block w-full px-3 py-2 text-center rounded-md text-base font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/signin"
                      className="block w-full px-3 py-2 text-center rounded-md text-base font-medium bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
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
