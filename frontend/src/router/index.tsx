import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { PageLoader } from '@/components/common/PageLoader';

// Pages
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Profile } from '@/pages/Profile';
import { Settings } from '@/pages/Settings';
import { TaskCompletion } from '@/pages/TaskCompletion';
import { ErrorPage } from '@/pages/ErrorPage';
import { Statistics } from '@/components/auth/Statistics';

// Lazy loaded pages
const TaskForm = lazy(() => import('@/pages/TaskForm').then(module => ({
  default: module.TaskForm
})));

const TaskLibrary = lazy(() => import('@/pages/TaskLibrary').then(module => ({
  default: module.TaskLibrary
})));

const TaskPreview = lazy(() => import('@/pages/TaskPreview').then(module => ({
  default: module.TaskPreview
})));

const SheetsLibrary = lazy(() => import('@/pages/SheetsLibrary').then(module => ({
  default: module.SheetsLibrary
})));

const SheetView = lazy(() => import('@/pages/SheetView').then(module => ({
  default: module.SheetView
})));

const SheetEdit = lazy(() => import('@/pages/SheetEdit').then(module => ({
  default: module.SheetEdit
})));

export const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        
        <Route path="/generate-task" element={
          <ProtectedRoute>
            <TaskForm />
          </ProtectedRoute>
        } />
        
        <Route path="/task-preview" element={
          <ProtectedRoute>
            <TaskPreview />
          </ProtectedRoute>
        } />
        
        <Route path="/library" element={
          <ProtectedRoute>
            <TaskLibrary />
          </ProtectedRoute>
        } />
        
        <Route path="/task-completion" element={<TaskCompletion />} />
        
        <Route path="/sheets" element={
          <ProtectedRoute>
            <SheetsLibrary />
          </ProtectedRoute>
        } />
        
        <Route path="/sheets/:id" element={
          <ProtectedRoute>
            <SheetView />
          </ProtectedRoute>
        } />
        
        <Route path="/sheets/:id/edit" element={
          <ProtectedRoute>
            <SheetEdit />
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
        
        <Route path="/statistics" element={
          <ProtectedRoute>
            <Statistics />
          </ProtectedRoute>
        } />
        
        <Route path="/error" element={<ErrorPage />} />
      </Routes>
    </Suspense>
  );
};

