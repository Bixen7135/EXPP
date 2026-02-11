'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Save,
  X,
  GripVertical,
  Plus,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  BarChart3,
} from 'lucide-react';
import { Navigation } from '@/components/layout/Navigation';
import { PageLayout } from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectOption } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { TaskEditModal } from '@/components/tasks/TaskEditModal';
import { TaskCreateModal } from '@/components/tasks/TaskCreateModal';
import { TaskSelector } from '@/components/tasks/TaskSelector';
import { SheetAnalytics } from '@/components/sheets/SheetAnalytics';
import { useAuth } from '@/lib/auth-client';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api-client';
import type { Task, SheetWithTasks, UpdateSheetInput } from '@/types';

const TOPICS: SelectOption[] = [
  { value: 'math', label: 'Mathematics' },
  { value: 'physics', label: 'Physics' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'biology', label: 'Biology' },
  { value: 'history', label: 'History' },
  { value: 'geography', label: 'Geography' },
  { value: 'literature', label: 'Literature' },
  { value: 'computer-science', label: 'Computer Science' },
  { value: 'economics', label: 'Economics' },
  { value: 'other', label: 'Other' },
];

export default function SheetEditPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const sheetId = params.id as string;

  // Sheet state
  const [sheet, setSheet] = useState<SheetWithTasks | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Edit state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [taskOrder, setTaskOrder] = useState<string[]>([]);

  // Modal states
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  // Drag state
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // Fetch sheet data
  useEffect(() => {
    if (user && sheetId) {
      fetchSheet();
    }
  }, [user, sheetId]);

  const fetchSheet = async () => {
    try {
      setLoading(true);
      const data = await api.getSheet(sheetId);
      const sheetData = data.sheet as SheetWithTasks;
      setSheet(sheetData);
      setTitle(sheetData.title);
      setDescription(sheetData.description || '');
      setTags(sheetData.tags || []);
      setTaskOrder(sheetData.tasks.map((t) => t.id));
    } catch (error) {
      console.error('Failed to fetch sheet:', error);
      showToast('Failed to load sheet', 'error');
      router.push('/sheets');
    } finally {
      setLoading(false);
    }
  };

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Track unsaved changes
  useEffect(() => {
    if (!sheet) return;

    const changed =
      title !== sheet.title ||
      description !== (sheet.description || '') ||
      JSON.stringify(tags) !== JSON.stringify(sheet.tags || []) ||
      JSON.stringify(taskOrder) !== JSON.stringify(sheet.tasks.map((t) => t.id));

    setHasUnsavedChanges(changed);
  }, [title, description, tags, taskOrder, sheet]);

  // Add tag
  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Toggle task expansion
  const toggleTaskExpansion = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null) return;
  };

  const handleDrop = (index: number) => {
    if (draggedItemIndex === null) return;

    const newOrder = [...taskOrder];
    const [draggedItem] = newOrder.splice(draggedItemIndex, 1);
    newOrder.splice(index, 0, draggedItem);

    setTaskOrder(newOrder);
    setDraggedItemIndex(null);
    setHasUnsavedChanges(true);
  };

  // Add tasks from selector
  const handleAddTasks = async (taskIds: string[]) => {
    try {
      setLoading(true);
      await api.updateSheet(sheetId, {
        tasks: [...taskOrder, ...taskIds],
      } as UpdateSheetInput);

      setTaskOrder([...taskOrder, ...taskIds]);
      showToast(`${taskIds.length} task(s) added to sheet`, 'success');
      await fetchSheet();
    } catch (error) {
      console.error('Failed to add tasks:', error);
      showToast('Failed to add tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Remove task from sheet
  const handleRemoveTask = async (taskId: string) => {
    try {
      const newOrder = taskOrder.filter((id) => id !== taskId);
      await api.updateSheet(sheetId, {
        tasks: newOrder,
      } as UpdateSheetInput);

      setTaskOrder(newOrder);
      setShowDeleteModal(null);
      showToast('Task removed from sheet', 'success');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to remove task:', error);
      showToast('Failed to remove task', 'error');
    }
  };

  // Save sheet changes
  const handleSave = async () => {
    if (!title.trim()) {
      showToast('Title is required', 'error');
      return;
    }

    try {
      setSaving(true);
      await api.updateSheet(sheetId, {
        title,
        description: description || null,
        tags,
        tasks: taskOrder,
      } as UpdateSheetInput);

      // Create version after saving
      await api.createSheetVersion(sheetId);

      showToast('Sheet saved successfully', 'success');
      setHasUnsavedChanges(false);
      await fetchSheet();
    } catch (error) {
      console.error('Failed to save sheet:', error);
      showToast('Failed to save sheet', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Redirect back to sheet view
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push(`/sheets/${sheetId}`);
      }
    } else {
      router.push(`/sheets/${sheetId}`);
    }
  };

  // Get task by ID
  const getTaskById = (taskId: string) => {
    return sheet?.tasks.find((t) => t.id === taskId);
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Navigation />
        <PageLayout maxWidth="6xl">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          </div>
        </PageLayout>
      </>
    );
  }

  if (!sheet) {
    return (
      <>
        <Navigation />
        <PageLayout maxWidth="6xl">
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Sheet not found
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              The sheet you're looking for doesn't exist or you don't have access to it.
            </p>
          </div>
        </PageLayout>
      </>
    );
  }

  const orderedTasks = taskOrder
    .map((id) => getTaskById(id))
    .filter((t): t is Task => t !== undefined);

  return (
    <>
      <Navigation />

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-2 text-center z-40">
          <span className="font-medium">You have unsaved changes</span>
        </div>
      )}

      <PageLayout maxWidth="6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Edit Sheet
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {taskOrder.length} task{taskOrder.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowAnalyticsModal(true)}
                title="View analytics"
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                isLoading={saving}
                icon={<Save className="w-4 h-4" />}
              >
                Save Changes
              </Button>
            </div>
          </div>

          {/* Sheet Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Sheet Information
            </h2>

            <div className="space-y-4">
              <Input
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter sheet title..."
                className="text-lg"
              />

              <Textarea
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter sheet description..."
                rows={3}
              />

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-sm"
                    >
                      #{tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-600 dark:hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add a tag..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddTag}
                  >
                    Add Tag
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Tasks Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Tasks
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCreateModal(true)}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Create Task
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowTaskSelector(true)}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Add from Library
                </Button>
              </div>
            </div>

            {/* Task List with Drag and Drop */}
            <div className="space-y-2">
              {orderedTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={() => handleDrop(index)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`
                    bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600
                    ${draggedItemIndex === index ? 'opacity-50' : ''}
                  `}
                >
                  <div className="flex items-start gap-3 p-4">
                    {/* Drag Handle */}
                    <div className="cursor-grab active:cursor-grabbing text-gray-400 mt-1">
                      <GripVertical className="w-5 h-5" />
                    </div>

                    {/* Task Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white flex-1">
                          {task.text}
                        </p>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => toggleTaskExpansion(task.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            {expandedTasks.has(task.id) ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setEditingTask(task)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteModal(task.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {expandedTasks.has(task.id) && (
                        <div className="space-y-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex flex-wrap gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
                              {task.difficulty}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs capitalize">
                              {task.type}
                            </span>
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs capitalize">
                              {task.topic}
                            </span>
                            {task.tags?.map((tag) => (
                              <span key={tag} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs">
                                #{tag}
                              </span>
                            ))}
                          </div>

                          {task.solution && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                Solution
                              </h4>
                              <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                                {task.solution}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {orderedTasks.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p className="mb-4">No tasks in this sheet yet.</p>
                  <p className="text-sm">Add tasks from the library or create new ones.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </PageLayout>

      {/* Task Selector Modal */}
      <TaskSelector
        isOpen={showTaskSelector}
        onClose={() => setShowTaskSelector(false)}
        onAddTasks={handleAddTasks}
        excludeTaskIds={taskOrder}
      />

      {/* Task Edit Modal */}
      {editingTask && (
        <TaskEditModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          task={editingTask}
          onSuccess={fetchSheet}
        />
      )}

      {/* Task Create Modal */}
      <TaskCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchSheet}
        sheetId={sheetId}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!showDeleteModal}
        onClose={() => setShowDeleteModal(null)}
        title="Remove Task"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to remove this task from the sheet? This action can be
            undone by re-adding the task.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteModal(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={() => showDeleteModal && handleRemoveTask(showDeleteModal)}
              isLoading={saving}
            >
              Remove
            </Button>
          </div>
        </div>
      </Modal>

      {/* Analytics Modal */}
      <SheetAnalytics
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
        sheet={sheet}
      />
    </>
  );
}
