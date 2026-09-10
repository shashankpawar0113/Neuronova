import React, { useState, useEffect } from 'react';
import { 
  X, Plus, CheckCircle2, Clock, Trash2, Edit3, Calendar, Pill,
  Utensils, Activity, Droplets, Moon, Bell, AlertCircle, Save
} from 'lucide-react';
import { BACKEND_URL } from '../config/urls';

export interface PatientTask {
  id: string;
  patient_id: string;
  title: string;
  description?: string;
  type: string;
  scheduled_time: string;
  recurrence: string;
  is_active: number;
  grace_period_mins: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskCompletionLog {
  id: string;
  task_id: string;
  patient_id: string;
  scheduled_time: string;
  completed_at: string;
  status: string;
  recorded_by: string;
}

interface TaskManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  currentUserId: string;
}

const TASK_TYPES = [
  { id: 'medication', label: 'Medication', icon: Pill, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { id: 'meal', label: 'Meal & Nutrition', icon: Utensils, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'exercise', label: 'Gentle Exercise', icon: Activity, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'water', label: 'Hydration', icon: Droplets, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'sleep', label: 'Rest & Sleep', icon: Moon, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { id: 'custom', label: 'Other Routine', icon: Bell, color: 'text-purple-600 bg-purple-50 border-purple-200' },
];

export const TaskManagerModal: React.FC<TaskManagerModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  currentUserId,
}) => {
  const [tasks, setTasks] = useState<PatientTask[]>([]);
  const [completions, setCompletions] = useState<TaskCompletionLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('medication');
  const [scheduledTime, setScheduledTime] = useState('08:00');
  const [recurrence, setRecurrence] = useState('daily');
  const [gracePeriodMins, setGracePeriodMins] = useState(30);

  useEffect(() => {
    if (isOpen && patientId) {
      loadTasks();
    }
  }, [isOpen, patientId]);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL || 'http://localhost:5001'}/api/tasks/${patientId}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        setCompletions(data.completions || []);
      }
    } catch (err) {
      console.error('Failed to load patient tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenNewTask = () => {
    setEditingTaskId(null);
    setTitle('');
    setDescription('');
    setType('medication');
    setScheduledTime('08:00');
    setRecurrence('daily');
    setGracePeriodMins(30);
    setIsEditing(true);
  };

  const handleEditTask = (task: PatientTask) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description || '');
    setType(task.type);
    setScheduledTime(task.scheduled_time);
    setRecurrence(task.recurrence);
    setGracePeriodMins(task.grace_period_mins || 30);
    setIsEditing(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const url = editingTaskId 
        ? `${BACKEND_URL || 'http://localhost:5001'}/api/tasks/${editingTaskId}`
        : `${BACKEND_URL || 'http://localhost:5001'}/api/tasks`;

      const method = editingTaskId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          title: title.trim(),
          description: description.trim(),
          type,
          scheduledTime,
          recurrence,
          gracePeriodMins: Number(gracePeriodMins),
          createdBy: currentUserId,
        }),
      });

      if (res.ok) {
        setIsEditing(false);
        loadTasks();
      }
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to remove this scheduled task? Historical completion logs will be preserved.')) {
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL || 'http://localhost:5001'}/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadTasks();
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleToggleTask = async (task: PatientTask) => {
    try {
      const res = await fetch(`${BACKEND_URL || 'http://localhost:5001'}/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: task.is_active ? 0 : 1,
        }),
      });
      if (res.ok) {
        loadTasks();
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-[Plus_Jakarta_Sans]">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-xl font-black text-slate-900 font-[Outfit]">
              Routine & Medication Schedule
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Managing active daily tasks for <span className="text-emerald-700 font-bold">{patientName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isEditing ? (
            /* Task Form */
            <form onSubmit={handleSaveTask} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-sm">
                  {editingTaskId ? 'Edit Scheduled Task' : 'Create New Scheduled Task'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Evening Blood Pressure Tablet"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instructions / Dosage (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Take 1 tablet with lukewarm water after food"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Category Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TASK_TYPES.map((t) => {
                    const Icon = t.icon;
                    const isSelected = type === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setType(t.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                          isSelected
                            ? `${t.color} ring-2 ring-emerald-500`
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Timing row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Scheduled Time
                  </label>
                  <input
                    type="time"
                    required
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Recurrence
                  </label>
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="once">Once</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                    Grace Period (mins)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={gracePeriodMins}
                    onChange={(e) => setGracePeriodMins(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingTaskId ? 'Update Task' : 'Save Task'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">
                  Active Patient Tasks ({tasks.length})
                </h4>
                <p className="text-xs text-slate-500">
                  Voice assistant automatically syncs with these scheduled routines
                </p>
              </div>
              <button
                onClick={handleOpenNewTask}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            </div>
          )}

          {/* Task List */}
          {isLoading ? (
            <div className="text-center py-8 text-xs font-semibold text-slate-400">
              Loading scheduled tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No scheduled tasks yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Add daily medications or routines so the voice assistant can remind the patient and track adherence.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const typeMeta = TASK_TYPES.find((t) => t.id === task.type) || TASK_TYPES[0];
                const Icon = typeMeta.icon;
                const isInactive = !task.is_active;

                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      isInactive 
                        ? 'bg-slate-50/70 border-slate-200 opacity-60' 
                        : 'bg-white border-slate-200/90 shadow-xs hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${typeMeta.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-slate-900 text-sm truncate">
                            {task.title}
                          </h5>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-extrabold uppercase">
                            {task.recurrence}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] font-semibold text-slate-500">
                          <span className="flex items-center gap-1 text-emerald-700 font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            {task.scheduled_time}
                          </span>
                          <span>Grace: {task.grace_period_mins || 30}m</span>
                        </div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleToggleTask(task)}
                        title={task.is_active ? 'Disable task' : 'Enable task'}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          task.is_active
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {task.is_active ? 'Active' : 'Paused'}
                      </button>

                      <button
                        onClick={() => handleEditTask(task)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                        title="Edit Task"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                        title="Delete Task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recent Completion Logs */}
          {completions.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2.5">
                Recent Voice / Manual Task Completions
              </h5>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {completions.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-800">
                        {tasks.find(t => t.id === log.task_id)?.title || 'Scheduled Task'}
                      </span>
                    </div>
                    <span className="text-slate-500 font-medium">
                      {new Date(log.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
