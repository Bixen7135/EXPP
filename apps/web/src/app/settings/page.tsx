'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  Monitor,
  Save,
  Loader2,
  Globe,
  CheckCircle,
  X,
  Shield,
} from 'lucide-react';
import { PageLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { useToast } from '@/hooks';
import { motion } from 'framer-motion';
import { api } from '@/lib/api-client';
import type { UserSettings } from '@/lib/api-client';

type Theme = 'light' | 'dark' | 'system';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const { showToast } = useToast();

  // Local state for form
  const [theme, setTheme] = useState<Theme>('system');
  const [language, setLanguageState] = useState('en');
  const [notifications, setNotifications] = useState({
    enabled: true,
    emailNotifications: true,
    taskReminders: true,
  });
  const [privacy, setPrivacy] = useState({
    showProfileToPublic: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const userSettings = await api.getSettings();

      setSettings(userSettings);
      setTheme(userSettings.theme || 'system');
      setLanguageState(userSettings.language || 'en');
      setNotifications({
        enabled: userSettings.notificationsEnabled ?? true,
        emailNotifications: (userSettings.preferences?.emailNotifications as boolean) ?? true,
        taskReminders: (userSettings.preferences?.taskReminders as boolean) ?? true,
      });
      setPrivacy({
        showProfileToPublic: (userSettings.preferences?.showProfileToPublic as boolean) ?? true,
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    setHasChanges(true);
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguageState(newLanguage);
    setHasChanges(true);
  };

  const handleNotificationChange = (key: keyof typeof notifications, value: boolean) => {
    setNotifications((prev) => {
      const updated = { ...prev, [key]: value };
      // If disabling all notifications, also disable the main toggle
      if (key !== 'enabled' && !updated.emailNotifications && !updated.taskReminders) {
        updated.enabled = false;
      }
      // If enabling any notification, enable the main toggle
      if (key !== 'enabled' && (updated.emailNotifications || updated.taskReminders)) {
        updated.enabled = true;
      }
      return updated;
    });
    setHasChanges(true);
  };

  const handlePrivacyChange = (key: keyof typeof privacy, value: boolean) => {
    setPrivacy((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      await api.updateSettings({
        theme,
        language,
        notificationsEnabled: notifications.enabled,
        preferences: {
          email_notifications: notifications.emailNotifications,
          task_reminders: notifications.taskReminders,
          show_profile_to_public: privacy.showProfileToPublic,
        },
      });

      setHasChanges(false);
      showToast('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving settings', error);
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (settings) {
      setTheme(settings.theme || 'system');
      setLanguageState(settings.language || 'en');
      setNotifications({
        enabled: settings.notificationsEnabled ?? true,
        emailNotifications: (settings.preferences?.emailNotifications as boolean) ?? true,
        taskReminders: (settings.preferences?.taskReminders as boolean) ?? true,
      });
      setPrivacy({
        showProfileToPublic: (settings.preferences?.showProfileToPublic as boolean) ?? true,
      });
      setHasChanges(false);
    }
  };

  if (loading) {
    return (
      <PageLayout maxWidth="2xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout maxWidth="2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Customize your application preferences and notifications.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Notifications Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center mb-6">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Enable Notifications</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications for your activities</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notifications.enabled}
                    onChange={(e) => handleNotificationChange('enabled', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Email Notifications</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receive updates via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notifications.emailNotifications && notifications.enabled}
                    disabled={!notifications.enabled}
                    onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                  />
                  <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                    !notifications.enabled
                      ? 'bg-gray-200 dark:bg-gray-700 opacity-50 cursor-not-allowed'
                      : 'bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600'
                  }`}></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Task Reminders</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Remind me about pending tasks</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notifications.taskReminders && notifications.enabled}
                    disabled={!notifications.enabled}
                    onChange={(e) => handleNotificationChange('taskReminders', e.target.checked)}
                  />
                  <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                    !notifications.enabled
                      ? 'bg-gray-200 dark:bg-gray-700 opacity-50 cursor-not-allowed'
                      : 'bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600'
                  }`}></div>
                </label>
              </div>
            </div>
          </motion.div>

          {/* Appearance Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center mb-6">
              <Monitor className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <select
                  value={theme}
                  onChange={(e) => handleThemeChange(e.target.value as Theme)}
                  className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Choose how the application looks
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="en">English</option>
                  <option value="ru">Русский</option>
                  <option value="kk">Қазақша</option>
                </select>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Select your preferred language
                </p>
              </div>
            </div>
          </motion.div>

          {/* Privacy Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center mb-6">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Public Profile</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Allow others to see your profile</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={privacy.showProfileToPublic}
                    onChange={(e) => handlePrivacyChange('showProfileToPublic', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-end gap-3 pt-4"
          >
            {hasChanges && (
              <Button
                variant="ghost"
                onClick={handleReset}
              >
                <X className="w-4 h-4 mr-2" />
                Reset
              </Button>
            )}
            <Button
              variant="primary"
              icon={<Save className="w-4 h-4" />}
              onClick={handleSaveSettings}
              disabled={saving || !hasChanges}
              isLoading={saving}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </motion.div>

          {hasChanges && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center"
            >
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                You have unsaved changes
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </PageLayout>
  );
}
