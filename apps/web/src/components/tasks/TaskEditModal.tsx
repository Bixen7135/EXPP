'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, X, Eye, EyeOff } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectOption } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api-client';
import type { Task, UpdateTaskInput } from '@/types';

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onSuccess?: () => void;
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

export function TaskEditModal({ isOpen, onClose, task, onSuccess }: TaskEditModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Form state
  const [text, setText] = useState(task.text);
  const [type, setType] = useState(task.type);
  const [topic, setTopic] = useState(task.topic);
  const [difficulty, setDifficulty] = useState<string>(task.difficulty);
  const [answer, setAnswer] = useState(task.answer || '');
  const [solution, setSolution] = useState(task.solution || '');
  const [explanation, setExplanation] = useState(task.explanation || '');
  const [context, setContext] = useState(task.context || '');
  const [instructions, setInstructions] = useState(task.instructions || '');
  const [learningOutcome, setLearningOutcome] = useState(task.learningOutcome || '');
  const [tags, setTags] = useState<string[]>(task.tags || []);
  const [tagInput, setTagInput] = useState('');

  // Section collapse states
  const [basicInfoExpanded, setBasicInfoExpanded] = useState(true);
  const [contentExpanded, setContentExpanded] = useState(true);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  // Check for unsaved changes
  useEffect(() => {
    const changed =
      text !== task.text ||
      type !== task.type ||
      topic !== task.topic ||
      difficulty !== task.difficulty ||
      answer !== (task.answer || '') ||
      solution !== (task.solution || '') ||
      explanation !== (task.explanation || '') ||
      context !== (task.context || '') ||
      instructions !== (task.instructions || '') ||
      learningOutcome !== (task.learningOutcome || '') ||
      JSON.stringify(tags) !== JSON.stringify(task.tags || []);

    setHasUnsavedChanges(changed);
  }, [
    text,
    type,
    topic,
    difficulty,
    answer,
    solution,
    explanation,
    context,
    instructions,
    learningOutcome,
    tags,
    task,
  ]);

  // Warn before closing with unsaved changes
  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

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

  // Save task
  const handleSave = async () => {
    // Validation
    if (!text.trim()) {
      showToast('Task text is required', 'error');
      return;
    }

    try {
      setLoading(true);

      const updateData: UpdateTaskInput = {
        text,
        type,
        topic,
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        answer: answer || null,
        solution: solution || null,
        explanation: explanation || null,
        context: context || null,
        instructions: instructions || null,
        learningOutcome: learningOutcome || null,
        tags,
      };

      await api.updateTask(task.id, updateData);
      showToast('Task updated successfully', 'success');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to update task:', error);
      showToast('Failed to update task', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Task" size="lg">
      <div className="space-y-4">
        {/* Basic Info Section */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <button
            onClick={() => setBasicInfoExpanded(!basicInfoExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white">Basic Info</h3>
            {basicInfoExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {basicInfoExpanded && (
            <div className="px-4 pb-4 space-y-4">
              <Textarea
                label="Task Text"
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
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <button
            onClick={() => setContentExpanded(!contentExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white">Content</h3>
            {contentExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {contentExpanded && (
            <div className="px-4 pb-4 space-y-4">
              <Textarea
                label="Answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Enter the correct answer..."
                rows={2}
              />

              <div className="relative">
                <Textarea
                  label="Solution"
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder="Detailed solution explanation..."
                  rows={4}
                />
                <button
                  type="button"
                  onClick={() => setShowSolution(!showSolution)}
                  className="absolute top-0 right-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showSolution ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {showSolution && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Solution Preview
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                    {solution || 'No solution provided'}
                  </p>
                </div>
              )}

              <Textarea
                label="Explanation"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Additional explanation for the solution..."
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Advanced Section */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <button
            onClick={() => setAdvancedExpanded(!advancedExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white">Advanced</h3>
            {advancedExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {advancedExpanded && (
            <div className="px-4 pb-4 space-y-4">
              <Textarea
                label="Context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Background information for this task..."
                rows={2}
              />

              <Textarea
                label="Instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Special instructions for answering this task..."
                rows={2}
              />

              <Textarea
                label="Learning Outcome"
                value={learningOutcome}
                onChange={(e) => setLearningOutcome(e.target.value)}
                placeholder="What students will learn from this task..."
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
                    icon={<Plus className="w-4 h-4" />}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={loading}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
