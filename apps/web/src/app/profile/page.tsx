'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Lock,
  Camera,
  Edit2,
  KeyRound,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Award,
  TrendingUp,
  Clock,
  BookOpen,
  CheckCircle,
  Shield,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-client';
import { PageLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { useToast } from '@/hooks';
import { motion } from 'framer-motion';
import { api } from '@/lib/api-client';
import type { ProfileData, UserStatistics } from '@/lib/api-client';

export default function ProfilePage() {
  const { user, changePassword } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    loadProfile();
    loadStatistics();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await api.getProfile();
      setProfile(data);
      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
      setAvatar(data.avatarUrl || '');
    } catch (error) {
      console.error('Error loading profile:', error);
      showToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const data = await api.getStatistics();
      setStatistics(data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must be less than 5MB', 'error');
      return;
    }

    setAvatarFile(file);

    // Preview image
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      let avatarUrl = avatar;

      // Upload avatar if a new file was selected
      if (avatarFile) {
        setUploadingAvatar(true);
        try {
          const result = await api.uploadAvatar(avatarFile);
          avatarUrl = result.avatarUrl;
          setAvatarFile(null);
        } catch (error) {
          console.error('Error uploading avatar:', error);
          showToast('Failed to upload avatar', 'error');
          setUploadingAvatar(false);
          return;
        } finally {
          setUploadingAvatar(false);
        }
      }

      await api.updateProfile({ firstName, lastName, avatarUrl });
      await loadProfile();
      setIsEditing(false);
      showToast('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    if (password.length > 72) {
      return 'Password must be less than 72 characters';
    }
    return null;
  };

  const handleChangePassword = async () => {
    try {
      setPasswordError('');

      // Validate passwords match
      if (newPassword !== confirmPassword) {
        setPasswordError('New passwords do not match');
        return;
      }

      // Validate password strength
      const passwordValidation = validatePassword(newPassword);
      if (passwordValidation) {
        setPasswordError(passwordValidation);
        return;
      }

      // Check if new password is different from current
      if (currentPassword === newPassword) {
        setPasswordError('New password must be different from current password');
        return;
      }

      // Use auth store method to change password
      await changePassword(currentPassword, newPassword);

      // Reset form and show success message
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
      showToast('Password updated successfully', 'success');
    } catch (error) {
      console.error('Error changing password:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update password';
      setPasswordError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading && !profile) {
    return (
      <PageLayout maxWidth="6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout maxWidth="6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">My Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your profile information and account settings.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
                    {profile?.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={`${profile.firstName} ${profile.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={64} />
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-3 shadow-lg cursor-pointer hover:bg-blue-700 transition-colors">
                      <Camera className="h-5 w-5 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-1">
                  {profile?.firstName} {profile?.lastName}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-center break-all text-sm">
                  {user?.email}
                </p>
                <div className="w-full border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                  <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4 mr-2" />
                    Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    }) : 'N/A'}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Statistics Overview */}
            {statistics && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 mt-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Quick Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Tasks Solved</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {statistics.solvedTasks}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Success Rate</span>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {statistics.successRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Time Spent</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatTime(statistics.totalTimeSpent)}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column - Profile Information & Security */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Profile Information
                </h3>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Edit2 className="w-4 h-4" />}
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="pl-10 w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Enter your first name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="pl-10 w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="pl-10 w-full p-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Email cannot be changed
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsEditing(false);
                        setFirstName(profile?.firstName || '');
                        setLastName(profile?.lastName || '');
                        setAvatar(profile?.avatarUrl || '');
                        setAvatarFile(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      icon={<Save className="w-4 h-4" />}
                      onClick={handleSaveProfile}
                      isLoading={loading || uploadingAvatar}
                    >
                      {uploadingAvatar ? 'Uploading...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">First Name</div>
                      <div className="text-gray-900 dark:text-white font-medium">{profile?.firstName || 'Not set'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Last Name</div>
                      <div className="text-gray-900 dark:text-white font-medium">{profile?.lastName || 'Not set'}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email</div>
                    <div className="text-gray-900 dark:text-white break-all">{user?.email}</div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Member Since</div>
                    <div className="text-gray-900 dark:text-white">
                      {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'N/A'}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Security Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security</h3>
                </div>
                {!isChangingPassword && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<KeyRound className="w-4 h-4" />}
                    onClick={() => setIsChangingPassword(true)}
                  >
                    Change Password
                  </Button>
                )}
              </div>

              {isChangingPassword ? (
                <div className="space-y-4">
                  {passwordError && (
                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md text-sm text-red-600 dark:text-red-200 border border-red-200 dark:border-red-800 flex items-center justify-between">
                      <span>{passwordError}</span>
                      <button
                        onClick={() => setPasswordError('')}
                        className="text-red-600 dark:text-red-200 hover:text-red-800 dark:hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="pl-10 pr-10 w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Enter your current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-10 pr-10 w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Enter your new password (min. 6 characters)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {newPassword && (
                      <p className={`mt-1 text-xs ${newPassword.length >= 6 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {newPassword.length < 6 ? 'Password must be at least 6 characters' : '✓ Password length OK'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 pr-10 w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Confirm your new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {confirmPassword && (
                      <p className={`mt-1 text-xs ${newPassword === confirmPassword ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setPasswordError('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      icon={<KeyRound className="w-4 h-4" />}
                      onClick={handleChangePassword}
                      disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                      isLoading={loading}
                    >
                      Update Password
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 dark:text-gray-400">
                    You can change your password at any time to keep your account secure.
                  </p>
                </div>
              )}
            </motion.div>

            {/* Activity Summary */}
            {statistics && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Activity Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {statistics.solvedTasks}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Tasks Solved</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {statistics.successRate.toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Success Rate</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatTime(statistics.totalTimeSpent)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Time Spent</div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {statistics.totalTaskAttempts}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Total Attempts</div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </PageLayout>
  );
}
