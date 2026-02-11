'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectOption } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api-client';
import type { BulkTasksInput } from '@/types';

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  sheetId?: string; // If provided, add task to this sheet
}

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

const TYPES: SelectOption[] = [
  { value: 'choice', label: 'Multiple Choice' },
  { value: 'text', label: 'Text Answer' },
  { value: 'numeric', label: 'Numeric' },
  { value: 'true-false', label: 'True/False' },
];

const DIFFICULTIES: SelectOption[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export function TaskCreateModal({ isOpen, onClose, onSuccess, sheetId }: TaskCreateModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  // Form state
  const [text, setText] = useState('');
  const [type, setType] = useState('text');
  const [topic, setTopic] = useState('other');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [answer, setAnswer] = useState('');
  const [solution, setSolution] = useState('');
  const [explanation, setExplanation] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [showPreview, setShowPreview] = useState(false);

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

  // Clear form
  const handleClear = () => {
    setText('');
    setType('text');
    setTopic('other');
    setDifficulty('medium');
    setAnswer('');
    setSolution('');
    setExplanation('');
    setTags([]);
    setTagInput('');
    setShowPreview(false);
  };

  // Create task
  const handleCreate = async () => {
    // Validation
    if (!text.trim()) {
      showToast('Task text is required', 'error');
      return;
    }

    try {
      setLoading(true);

      const taskData: BulkTasksInput['tasks'][0] = {
        text,
        type,
        topic,
        difficulty,
        answer: answer || null,
        solution: solution || null,
        explanation: explanation || null,
        tags,
      };

      await api.createTasks({ tasks: [taskData] });
      showToast('Task created successfully', 'success');
      handleClear();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
      showToast('Failed to create task', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Get difficulty badge color
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Task" size="lg">
      <div className="space-y-4">
        {/* Toggle Preview */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Edit' : 'Preview'}
          </Button>
        </div>

        {showPreview ? (
          // Preview Mode
          <div className="space-y-4">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {text || 'Task text will appear here...'}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(difficulty)}`}>
                  {difficulty}
                </span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs capitalize">
                  {type}
                </span>
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs capitalize">
                  {topic}
                </span>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Edit Mode
          <div className="space-y-4">
            <Textarea
              label="Task Text *"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter the question or task..."
              rows={3}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Type"
                options={TYPES}
                value={type}
                onChange={setType}
                placeholder="Select type"
              />

              <Select
                label="Topic"
                options={TOPICS}
                value={topic}
                onChange={setTopic}
                placeholder="Select topic"
              />

              <Select
                label="Difficulty"
                options={DIFFICULTIES}
                value={difficulty as string}
                onChange={(value) => setDifficulty(value as 'easy' | 'medium' | 'hard')}
                placeholder="Select difficulty"
              />
            </div>

            <Textarea
              label="Answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter the correct answer..."
              rows={2}
            />

            <Textarea
              label="Solution"
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              placeholder="Detailed solution explanation..."
              rows={3}
            />

            <Textarea
              label="Explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Additional explanation for the solution..."
              rows={2}
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
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-600 dark:hover:text-red-400"
                    >
                      ×
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
        )}

        {/* Actions */}
        <div className="flex justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" onClick={handleClear} disabled={loading}>
            Clear
          </Button>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleCreate} isLoading={loading}>
              Create Task
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
