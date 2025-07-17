
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "../components/auth/AuthProvider";
import { Task } from "@/api/entities";
import { TaskCompletion } from "@/api/entities";
import { User } from "@/api/entities";
import { File } from "@/api/entities";
import { Message } from "@/api/entities";
import { Project } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Clock,
  AlertTriangle,
  Calendar,
  User as UserIcon,
  Upload,
  MessageSquare,
  LayoutGrid,
  CalendarDays,
  Trash2,
  X
} from "lucide-react";
import {
  format,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  eachQuarterOfInterval,
  addDays,
  subMonths,
  subWeeks,
  addWeeks,
} from "date-fns";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

import TaskCard from "../components/tasks/TaskCard";
import AddTaskDialog from "../components/tasks/AddTaskDialog";
import TaskDetailModal from "../components/tasks/TaskDetailModal";
import TaskQuickActions from "../components/tasks/TaskQuickActions";
import TaskCalendarView from "../components/tasks/TaskCalendarView";
import CalendarExport from "../components/tasks/CalendarExport";
import DateRangePicker from "../components/tasks/DateRangePicker";

const getPeriodIdentifier = (date, frequency) => {
  // Ensure date is a Date object
  const d = new Date(date);
  switch (frequency) {
    case 'daily':
      return format(d, 'yyyy-MM-dd');
    case 'weekly':
      return format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    case 'monthly':
      return format(startOfMonth(d), 'yyyy-MM');
    case 'quarterly':
      return format(startOfQuarter(d), 'yyyy-Qq');
    case 'one-time':
    default:
      return null;
  }
};

export default function Tasks() {
  const { currentUser, isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [taskCompletions, setTaskCompletions] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [files, setFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProject, setFilterProject] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterPartner, setFilterPartner] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [dateRange, setDateRange] = useState({ 
    from: startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }),
    to: addWeeks(new Date(), 2)
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage] = useState(12); // 12 tasks per page for a 3-column grid
  const tasksGridRef = useRef(null);

  useEffect(() => {
    if(currentUser){
        loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [tasksData, taskCompletionsData, usersData, projectsData, filesData, messagesData] = await Promise.all([
        Task.list("-created_date"),
        TaskCompletion.list("-completion_date"),
        User.list(),
        Project.list(),
        File.list("-created_date"),
        Message.list("-created_date")
      ]);

      // Ensure all arrays are actually arrays
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setTaskCompletions(Array.isArray(taskCompletionsData) ? taskCompletionsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setFiles(Array.isArray(filesData) ? filesData : []);
      setMessages(Array.isArray(messagesData) ? messagesData : []);
    } catch (error) {
      console.error("Error loading tasks data:", error);
      // Set empty arrays on error
      setTasks([]);
      setTaskCompletions([]);
      setUsers([]);
      setProjects([]);
      setFiles([]);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async (taskData) => {
    try {
      await Task.create(taskData);
      loadData();
      setShowAddDialog(false);
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handleUpdateTask = async (taskId, taskData) => {
    if (!isAdmin) {
      alert("You don't have permission to update tasks.");
      return;
    }
    const taskInstance = selectedTask; // We need the full instance object
    
    // If it's a recurring task instance and we're completing it
    if (taskInstance?.isInstance && taskData.status === 'completed') {
      const completionData = {
        period_type: taskInstance.frequency,
        period_identifier: getPeriodIdentifier(new Date(taskInstance.instanceDate), taskInstance.frequency),
        completion_date: format(new Date(), 'yyyy-MM-dd'),
        status: 'completed'
      };
      await handlePeriodComplete(taskInstance, completionData);
      setShowDetailModal(false);
      setSelectedTask(null);
    } else {
      // For one-time tasks or other edits to master tasks
      const targetTaskId = selectedTask?.templateId || taskId;
      try {
        await Task.update(targetTaskId, taskData);
        loadData();
        setShowDetailModal(false);
        setSelectedTask(null);
      } catch (error) {
        console.error("Error updating task:", error);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (!isAdmin) {
      alert("You don't have permission to delete tasks.");
      return;
    }
    
    // Get the actual master task IDs for recurring tasks
    const tasksToDelete = selectedTasks.map(selectedId => {
        const displayableTask = displayableTasks.find(t => t.id === selectedId);
        if (!displayableTask) return null;
        
        // If it's a recurring task instance, get the template ID
        if (displayableTask.isInstance) {
            return displayableTask.templateId;
        }
        
        // If it's a one-time task, use the task ID directly
        return displayableTask.id;
    }).filter(id => id !== null);

    // Remove duplicates (multiple instances of the same recurring task)
    const uniqueTasksToDelete = [...new Set(tasksToDelete)];

    if (uniqueTasksToDelete.length === 0) {
        alert("No tasks selected for deletion.");
        return;
    }

    if (window.confirm(`Are you sure you want to delete ${uniqueTasksToDelete.length} task(s)? This will remove the task template and all its instances. This action cannot be undone.`)) {
      try {
        await Promise.all(uniqueTasksToDelete.map(taskId => Task.delete(taskId)));
        setSelectedTasks([]);
        setShowBulkActions(false);
        loadData();
      } catch (error) {
        console.error("Error deleting tasks:", error);
        alert("Failed to delete some tasks. Please try again.");
      }
    }
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    if (!isAdmin) {
      alert("You don't have permission to update tasks.");
      return;
    }
    try {
      await Promise.all(selectedTasks.map(async (selectedTaskId) => {
          const displayableTask = displayableTasks.find(t => t.id === selectedTaskId);
          if (!displayableTask) return;

          if (displayableTask.isInstance) {
              const periodIdentifier = getPeriodIdentifier(new Date(displayableTask.instanceDate), displayableTask.frequency);
              const existingCompletion = taskCompletions.find(
                c => c.task_id === displayableTask.templateId && c.period_identifier === periodIdentifier
              );

              if (newStatus === 'completed' || newStatus === 'in_progress') {
                  if (existingCompletion) {
                    // Update existing completion record
                    await TaskCompletion.update(existingCompletion.id, { status: newStatus });
                  } else {
                    // Create new completion record
                    await TaskCompletion.create({
                        task_id: displayableTask.templateId,
                        period_identifier: periodIdentifier,
                        completion_date: format(new Date(), 'yyyy-MM-dd'),
                        completed_by: currentUser?.email || "Unknown User",
                        status: newStatus,
                        period_type: displayableTask.frequency
                    });
                  }
              } else { // e.g., 'pending' or 'overdue' which means removing completion record
                  if (existingCompletion) {
                    await TaskCompletion.delete(existingCompletion.id);
                  }
              }
          } else {
              // For one-time tasks or master recurring tasks
              await Task.update(displayableTask.id, { status: newStatus });
          }
      }));
      setSelectedTasks([]);
      setShowBulkActions(false);
      loadData();
    } catch (error) {
      console.error("Error updating task status:", error);
      alert("Failed to update some tasks. Please try again.");
    }
  };

  const handleTaskSelection = (taskId) => {
    setSelectedTasks(prev => {
      const newSelection = prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId];
      setShowBulkActions(newSelection.length > 0);
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    if (selectedTasks.length === filteredTasks.length && filteredTasks.length > 0) {
      setSelectedTasks([]);
      setShowBulkActions(false);
    } else {
      setSelectedTasks(filteredTasks.map(t => t.id));
      setShowBulkActions(filteredTasks.length > 0);
    }
  };

  const handleTaskCompletion = async (task, newStatus) => {
    // This is the smart handler. It checks if the task is a recurring instance or a one-time task.
    if (task.isInstance) {
      // For recurring instances, we create or update a `TaskCompletion` record.
      try {
        const completionData = {
          period_type: task.frequency,
          period_identifier: getPeriodIdentifier(new Date(task.instanceDate), task.frequency),
          completion_date: format(new Date(), 'yyyy-MM-dd'),
          status: newStatus,
        };
        // Re-use the existing period completion logic which is already correct.
        await handlePeriodComplete(task, completionData);
      } catch (error) {
        console.error("Error updating recurring task status:", error);
        alert("Failed to update task status.");
      }
    } else {
      // For one-time tasks, we update the task entity directly.
      try {
        await Task.update(task.id, { status: newStatus });
        loadData();
      } catch (error) {
        console.error("Error updating one-time task status:", error);
        alert("Failed to update task status. Please try again.");
      }
    }
  };

  const handlePeriodComplete = async (task, completionData) => {
    try {
      console.log("Attempting to complete task period:", task.title, completionData);
      
      // Check if a completion record already exists
      const existingCompletion = taskCompletions.find(
        c => c.task_id === (task.templateId || task.id) && c.period_identifier === completionData.period_identifier
      );

      if (existingCompletion) {
        console.log("Updating existing completion record");
        await TaskCompletion.update(existingCompletion.id, { 
          status: completionData.status,
          completion_date: completionData.completion_date
        });
      } else {
        console.log("Creating new completion record");
        await TaskCompletion.create({
          task_id: task.templateId || task.id,
          ...completionData,
          completed_by: currentUser?.email || "Unknown User"
        });
      }
      
      console.log("Completion successful, reloading data");
      loadData();
    } catch (error) {
      console.error("Error completing task period:", error);
      alert("Failed to complete task. Please try again.");
    }
  };

  const handleFileUpload = async (file, taskId) => {
    const targetTaskId = displayableTasks.find(t => t.id === taskId)?.templateId || taskId;

    try {
      const { file_url } = await UploadFile({ file });
      await File.create({
        filename: file.name,
        file_url,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: currentUser?.email || "Unknown User",
        upload_date: format(new Date(), 'yyyy-MM-dd'),
        category: "document",
        task_id: targetTaskId
      });
      loadData();
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleUpdateTaskComment = async (messageId, newContent) => {
    try {
      await Message.update(messageId, { content: newContent, edited_at: new Date().toISOString() });
      const messagesData = await Message.list("-created_date");
      setMessages(Array.isArray(messagesData) ? messagesData : []);
    } catch (error) {
      console.error("Error updating task comment:", error);
    }
  };

  const handleDeleteTaskComment = async (messageId) => {
    try {
      await Message.delete(messageId);
      const messagesData = await Message.list("-created_date");
      setMessages(Array.isArray(messagesData) ? messagesData : []);
    } catch (error) {
      console.error("Error deleting task comment:", error);
    }
  };

  const handleAddTaskComment = async (task, content, attachmentUrl = null) => {
    try {
        await Message.create({
            sender_name: currentUser?.full_name || "Unknown User",
            sender_email: currentUser?.email || "Unknown Email",
            content,
            type: "task_comment",
            task_id: task.isInstance ? task.templateId : task.id,
            period_identifier: task.isInstance ? getPeriodIdentifier(new Date(task.instanceDate), task.frequency) : null,
            attachment_url: attachmentUrl,
        });
        const messagesData = await Message.list("-created_date");
        setMessages(Array.isArray(messagesData) ? messagesData : []);
    } catch (error) {
        console.error("Error adding task comment:", error);
    }
  };

  const displayableTasks = useMemo(() => {
    if (!dateRange || !dateRange.from || !dateRange.to) {
      return [];
    }

    const instances = [];
    const today = startOfDay(new Date());

    // Ensure tasks is an array
    if (!Array.isArray(tasks)) {
      return [];
    }

    tasks.forEach(task => {
      // Ensure task exists and has required properties
      if (!task || !task.frequency) return;

      if (task.frequency === 'one-time') {
        const dueDate = task.due_date ? new Date(task.due_date) : null;
        if (dueDate && dateRange.from && dateRange.to &&
            isAfter(dueDate, startOfDay(dateRange.from)) &&
            isBefore(dueDate, endOfDay(dateRange.to))) {
          instances.push(task);
        }
      } else {
        // For recurring tasks, respect the start_date and end_date
        const taskStartDate = task.start_date ? new Date(task.start_date) : new Date('2024-01-01');
        const taskEndDate = task.end_date ? endOfDay(new Date(task.end_date)) : null;

        const rangeStart = startOfDay(Math.max(dateRange.from.getTime(), taskStartDate.getTime()));
        let rangeEnd = endOfDay(dateRange.to);
        
        // If task has an end date, don't generate instances past it
        if (taskEndDate) {
            rangeEnd = new Date(Math.min(rangeEnd.getTime(), taskEndDate.getTime()));
        }

        // Only generate instances if the range is valid
        if (rangeStart.getTime() > rangeEnd.getTime()) return;
        
        const range = { start: new Date(rangeStart), end: new Date(rangeEnd) };
        let intervalDates = [];
        
        try {
            if (task.frequency === 'daily') intervalDates = eachDayOfInterval(range);
            else if (task.frequency === 'weekly') intervalDates = eachWeekOfInterval(range, { weekStartsOn: 1 });
            else if (task.frequency === 'monthly') intervalDates = eachMonthOfInterval(range);
            else if (task.frequency === 'quarterly') intervalDates = eachQuarterOfInterval(range);
        } catch (e) {
          console.warn('Invalid date range for task:', task.id, e);
          return;
        }

        intervalDates.forEach(instanceDate => {
          const periodId = getPeriodIdentifier(instanceDate, task.frequency);
          const completion = Array.isArray(taskCompletions) ? taskCompletions.find(
            c => c.task_id === task.id && c.period_identifier === periodId
          ) : null;

          // Each instance gets its own status based on completion record
          const instanceStatus = completion?.status || 
            (isAfter(today, endOfDay(new Date(instanceDate))) ? 'overdue' : 'pending');

          instances.push({
            ...task,
            id: `${task.id}-${periodId}`, // Unique ID for each instance
            isInstance: true,
            templateId: task.id,
            instanceDate: format(instanceDate, 'yyyy-MM-dd'),
            status: instanceStatus,
            completion: completion || null
          });
        });
      }
    });
    return instances;
  }, [tasks, dateRange, taskCompletions]);

  const filteredTasks = useMemo(() => {
    if (!Array.isArray(displayableTasks)) return [];
    
    return displayableTasks.filter(task => {
      if (!task) return false;

      const matchesSearch = (task.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ((task.description || '').toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesStatus = true;
      if (filterStatus !== 'all') {
          matchesStatus = task.status === filterStatus;
      }

      if (statusFilter !== 'all') {
          matchesStatus = task.status === statusFilter;
      }

      const taskProjects = Array.isArray(task.project_names) ? task.project_names : [];
      const matchesProject = filterProject === "all" || taskProjects.includes(filterProject);
      
      const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
      
      const taskPartners = Array.isArray(task.assigned_partners) ? task.assigned_partners : [];
      const matchesPartner = filterPartner === "all" || taskPartners.some(p => p === filterPartner);

      return matchesSearch && matchesStatus && matchesProject && matchesPriority && matchesPartner;
    }).sort((a, b) => {
      const aPartners = Array.isArray(a.assigned_partners) ? a.assigned_partners : [];
      const bPartners = Array.isArray(b.assigned_partners) ? b.assigned_partners : [];
      
      const aIsUserTask = aPartners.includes(currentUser?.full_name);
      const bIsUserTask = bPartners.includes(currentUser?.full_name);

      if (aIsUserTask && !bIsUserTask) return -1;
      if (!aIsUserTask && bIsUserTask) return 1;

      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const aPriority = priorityOrder[a.priority] !== undefined ? priorityOrder[a.priority] : 3;
      const bPriority = priorityOrder[b.priority] !== undefined ? priorityOrder[b.priority] : 3;
      return aPriority - bPriority;
    });
  }, [displayableTasks, searchTerm, filterStatus, statusFilter, filterProject, filterPriority, filterPartner, currentUser]);

  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * tasksPerPage;
    const endIndex = startIndex + tasksPerPage;
    return filteredTasks.slice(startIndex, endIndex);
  }, [filteredTasks, currentPage, tasksPerPage]);

  const getTaskStats = () => {
    if (!Array.isArray(displayableTasks)) return { total: 0, completed: 0, pending: 0, overdue: 0, inProgress: 0, completionRate: 0 };
    
    // Count all displayable tasks (both one-time and recurring instances)
    const total = displayableTasks.length;
    const completed = displayableTasks.filter(t => t.status === 'completed').length;
    const pending = displayableTasks.filter(t => t.status === 'pending').length;
    const overdue = displayableTasks.filter(t => t.status === 'overdue').length;
    const inProgress = displayableTasks.filter(t => t.status === 'in_progress').length;
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;

    return { total, completed, pending, overdue, inProgress, completionRate };
  };

  const stats = getTaskStats();

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  const handleStatCardClick = (status) => {
    setCurrentPage(1); // Reset to first page when filter changes
    setStatusFilter(status);
    setFilterStatus("all");

    if (tasksGridRef.current) {
      tasksGridRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <p className="text-slate-600 text-lg">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
              Task Management
            </h1>
            <p className="text-slate-600 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Systematic task tracking across all projects
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CalendarExport tasks={filteredTasks} />

            <div className="flex items-center gap-1 bg-slate-200 p-1 rounded-lg w-full sm:w-auto">
                <Button
                    size="sm"
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('grid')}
                    className={`transition-all flex-1 sm:flex-none ${viewMode === 'grid' ? 'bg-white text-slate-800 shadow-sm' : ''}`}
                >
                    <LayoutGrid className="w-4 h-4 mr-2"/>
                    Grid
                </Button>
                <Button
                    size="sm"
                    variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('calendar')}
                    className={`transition-all flex-1 sm:flex-none ${viewMode === 'calendar' ? 'bg-white text-slate-800 shadow-sm' : ''}`}
                >
                    <CalendarDays className="w-4 h-4 mr-2"/>
                    Calendar
                </Button>
            </div>
            {isAdmin && (
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-amber-500 hover:bg-amber-600 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            )}
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {showBulkActions && isAdmin && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700 font-medium">
                {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate('completed')} className="text-xs bg-white hover:bg-green-50">
                  <CheckSquare className="w-3 h-3 mr-1" />
                  Complete
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate('in_progress')} className="text-xs bg-white hover:bg-blue-50">
                  <Clock className="w-3 h-3 mr-1" />
                  Progress
                </Button>
                <Button size="sm" variant="outline" onClick={handleBulkDelete} className="text-red-600 border-red-200 hover:bg-red-50 text-xs bg-white">
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
                <Button size="sm" variant="ghost" onClick={() => {
                  setSelectedTasks([]);
                  setShowBulkActions(false);
                }} className="text-xs hover:bg-white">
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
          <Card
            className={`bg-white/80 backdrop-blur-sm border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow ${statusFilter === 'all' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => handleStatCardClick('all')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
                  <div className="text-sm text-slate-600">Total Tasks</div>
                </div>
                <CheckSquare className="w-6 h-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card
            className={`bg-white/80 backdrop-blur-sm border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow ${statusFilter === 'completed' ? 'ring-2 ring-green-500' : ''}`}
            onClick={() => handleStatCardClick('completed')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                  <div className="text-sm text-slate-600">Completed</div>
                </div>
                <div className="text-sm text-green-500 font-semibold">{stats.completionRate}%</div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`bg-white/80 backdrop-blur-sm border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow ${statusFilter === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
            onClick={() => handleStatCardClick('pending')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                  <div className="text-sm text-slate-600">Pending</div>
                </div>
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card
            className={`bg-white/80 backdrop-blur-sm border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow ${statusFilter === 'in_progress' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => handleStatCardClick('in_progress')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                  <div className="text-sm text-slate-600">In Progress</div>
                </div>
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`bg-white/80 backdrop-blur-sm border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow ${statusFilter === 'overdue' ? 'ring-2 ring-red-500' : ''}`}
            onClick={() => handleStatCardClick('overdue')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
                  <div className="text-sm text-slate-600">Overdue</div>
                </div>
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {statusFilter !== 'all' && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Badge variant="outline" className="bg-blue-50">
              Showing: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1).replace('_', ' ')} Tasks
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => setStatusFilter('all')}>
              Clear Filter
            </Button>
          </div>
        )}

        {/* Filters */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              {viewMode === 'grid' && isAdmin && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <span className="text-sm text-slate-600">Select All</span>
                </div>
              )}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search tasks by title or description..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1); // Reset to first page on search
                    }}
                    className="pl-10"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Select value={filterStatus} onValueChange={v => {setFilterStatus(v); setCurrentPage(1);}}>
                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterProject} onValueChange={v => {setFilterProject(v); setCurrentPage(1);}}>
                      <SelectTrigger><SelectValue placeholder="Project" /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All Projects</SelectItem>
                          {Array.isArray(projects) && projects.map(project => (
                              <SelectItem key={project.id} value={project.name}>{project.name}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                  <Select value={filterPriority} onValueChange={v => {setFilterPriority(v); setCurrentPage(1);}}>
                      <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All Priority</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                  </Select>
                  <Select value={filterPartner} onValueChange={v => {setFilterPartner(v); setCurrentPage(1);}}>
                      <SelectTrigger><SelectValue placeholder="Partner" /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All Partners</SelectItem>
                          {Array.isArray(users) && users.map(user => (
                              <SelectItem key={user.id} value={user.full_name}>{user.full_name}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                </div>
                 <div className="pt-2">
                    <DateRangePicker date={dateRange} setDate={d => {setDateRange(d); setCurrentPage(1);}} />
                 </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Grid */}
        {viewMode === 'grid' ? (
            <div ref={tasksGridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {paginatedTasks.map((task) => {
                const taskPartners = Array.isArray(task.assigned_partners) ? task.assigned_partners : [];
                const isUserTask = taskPartners.includes(currentUser?.full_name);
                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    files={Array.isArray(files) ? files.filter(f => f.task_id === (task.templateId || task.id)) : []}
                    messages={Array.isArray(messages) ? messages.filter(m => m.task_id === (task.templateId || task.id) && (m.period_identifier === null || m.period_identifier === task.completion?.period_identifier)) : []}
                    taskCompletions={taskCompletions}
                    onStatusChange={handleTaskCompletion}
                    onViewDetails={handleTaskClick}
                    onFileUpload={handleFileUpload}
                    onPeriodComplete={handlePeriodComplete}
                    isSelected={selectedTasks.includes(task.id)}
                    onSelect={isAdmin ? () => handleTaskSelection(task.id) : undefined}
                    isUserTask={isUserTask}
                    currentUser={currentUser}
                  />
                );
              })}
            </div>
        ) : (
            <div ref={tasksGridRef}>
              <TaskCalendarView
                tasks={filteredTasks}
                onTaskClick={handleTaskClick}
                taskCompletions={taskCompletions}
                onPeriodComplete={handlePeriodComplete}
                currentUser={currentUser}
              />
            </div>
        )}

        {filteredTasks.length === 0 && !isLoading && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg col-span-full">
            <CardContent className="p-12 text-center">
              <CheckSquare className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">No Tasks Found</h3>
              <p className="text-slate-600 mb-4">
                {searchTerm || statusFilter !== 'all' || dateRange?.from?.toDateString() !== startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }).toDateString() || dateRange?.to?.toDateString() !== addWeeks(new Date(), 2).toDateString() ? "Try adjusting your search terms, date range, or filters" : "Create your first task to get started"}
              </p>
              {(statusFilter !== 'all' || dateRange?.from?.toDateString() !== startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }).toDateString() || dateRange?.to?.toDateString() !== addWeeks(new Date(), 2).toDateString()) && (
                <Button onClick={() => {
                  setStatusFilter('all');
                  setDateRange({ from: startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), to: addWeeks(new Date(), 2) });
                }} variant="outline" className="mr-2">
                  Clear Filters
                </Button>
              )}
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-amber-500 hover:bg-amber-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pagination Controls */}
        {viewMode === 'grid' && filteredTasks.length > tasksPerPage && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
            >
                Previous
            </Button>
            <span className="text-sm text-slate-600">
                Page {currentPage} of {Math.ceil(filteredTasks.length / tasksPerPage)}
            </span>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredTasks.length / tasksPerPage), p + 1))}
                disabled={currentPage === Math.ceil(filteredTasks.length / tasksPerPage)}
            >
                Next
            </Button>
          </div>
        )}

        {/* Dialogs */}
        {isAdmin && (
          <AddTaskDialog
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            onSubmit={handleAddTask}
            users={users}
            projects={projects}
          />
        )}

        {selectedTask && (
          <TaskDetailModal
            task={selectedTask}
            open={showDetailModal}
            onOpenChange={(isOpen) => {
              if (!isOpen) setSelectedTask(null);
              setShowDetailModal(isOpen);
            }}
            onUpdate={handleUpdateTask}
            users={users}
            projects={projects}
            files={Array.isArray(files) ? files.filter(f => f.task_id === (selectedTask.templateId || selectedTask.id)) : []}
            messages={Array.isArray(messages) ? messages.filter(m => m.task_id === (selectedTask.templateId || selectedTask.id) && (m.period_identifier === null || m.period_identifier === selectedTask.completion?.period_identifier)) : []}
            onFileUpload={handleFileUpload}
            onAddComment={handleAddTaskComment}
            onUpdateComment={handleUpdateTaskComment}
            onDeleteComment={handleDeleteTaskComment}
          />
        )}
      </div>
    </div>
  );
}
