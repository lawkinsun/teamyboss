import React, { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  getDay,
  getDate,
  startOfQuarter
} from 'date-fns';
import { ChevronLeft, ChevronRight, Repeat, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const getPeriodIdentifier = (date, frequency) => {
  const d = new Date(date);
  switch (frequency) {
    case 'daily':
      return format(d, 'yyyy-MM-dd');
    case 'weekly':
      return format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    case 'monthly':
      return format(startOfMonth(d), 'yyyy-MM-dd');
    case 'quarterly':
      return format(startOfQuarter(d), 'yyyy-Qq');
    default:
      return format(d, 'yyyy-MM-dd');
  }
};

const getTasksForDay = (day, tasks) => {
    const dayTasks = [];
    
    tasks.forEach(task => {
        if (task.frequency === 'one-time') {
            // For one-time tasks, check if due date matches this day
            if (task.due_date) {
                const taskDueDate = new Date(task.due_date);
                if (taskDueDate.getFullYear() === day.getFullYear() &&
                    taskDueDate.getMonth() === day.getMonth() &&
                    taskDueDate.getDate() === day.getDate()) {
                    dayTasks.push(task);
                }
            }
        } else {
            // For recurring tasks, check if this is an instance date
            if (task.isInstance && task.instanceDate) {
                const instanceDate = new Date(task.instanceDate);
                if (instanceDate.getFullYear() === day.getFullYear() &&
                    instanceDate.getMonth() === day.getMonth() &&
                    instanceDate.getDate() === day.getDate()) {
                    dayTasks.push(task);
                }
            }
        }
    });
    
    return dayTasks;
};

export default function TaskCalendarView({ tasks, onTaskClick, taskCompletions = [], onPeriodComplete, currentUser }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayTasks, setSelectedDayTasks] = useState(null);
  const [showTasksModal, setShowTasksModal] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const isTaskCompletedForDay = (task, day) => {
    if (task.frequency === 'one-time') {
      return task.status === 'completed';
    }
    
    // For recurring tasks, check if there's a completion record
    return task.status === 'completed';
  };

  const priorityColors = {
    high: 'bg-red-500',
    medium: 'bg-orange-500',
    low: 'bg-blue-500',
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleMoreTasksClick = (day, tasksOnDay) => {
    setSelectedDayTasks({ day, tasks: tasksOnDay });
    setShowTasksModal(true);
  };

  const handlePeriodComplete = (task) => {
    if (task.isInstance) {
      const periodId = getPeriodIdentifier(new Date(task.instanceDate), task.frequency);
      onPeriodComplete(task, {
        period_type: task.frequency,
        period_identifier: periodId,
        completion_date: format(new Date(), 'yyyy-MM-dd'),
        status: 'completed'
      });
    } else {
      // For one-time tasks, just mark as completed
      onTaskClick(task);
    }
  };

  return (
    <>
      <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-xl p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth} className="bg-white">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth} className="bg-white">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Weekday Headers */}
          {weekDays.map(day => (
            <div key={day} className="text-center font-medium text-sm text-slate-500 pb-2">
              {day}
            </div>
          ))}
          
          {/* Day Cells */}
          {days.map(day => {
            const tasksOnDay = getTasksForDay(day, tasks);
            return (
              <div
                key={day.toString()}
                className={`border border-slate-200 rounded-lg min-h-[120px] p-2 flex flex-col transition-colors duration-200
                  ${isSameMonth(day, currentDate) ? 'bg-white' : 'bg-slate-50'}
                  ${isToday(day) ? 'border-2 border-amber-500' : ''}`}
              >
                <span className={`font-semibold ${isToday(day) ? 'text-amber-600' : 'text-slate-700'}`}>
                  {format(day, 'd')}
                </span>
                <div className="mt-1 space-y-1 overflow-y-auto flex-grow">
                  {tasksOnDay.slice(0,3).map(task => {
                    const isCompleted = isTaskCompletedForDay(task, day);
                    const isUserTask = task.assigned_partners?.includes(currentUser?.full_name);

                    let taskClasses = `w-full text-left p-1 rounded-md flex flex-col gap-0.5 text-xs transition-colors hover:opacity-80 text-white`;

                    if (isCompleted) {
                        taskClasses += ` bg-green-500`;
                    } else if (isUserTask) {
                        taskClasses += ` bg-gradient-to-r from-amber-500 to-orange-500 ring-2 ring-amber-300`;
                    } else {
                        taskClasses += ` ${priorityColors[task.priority]}`;
                    }

                    return (
                      <button 
                        key={task.id} 
                        onClick={() => onTaskClick(task)}
                        className={taskClasses}
                        title={task.title}
                      >
                        <div className="flex items-center gap-1.5">
                            {task.frequency !== 'one-time' ? <Repeat className="w-3 h-3 flex-shrink-0" /> : <div className={`w-1.5 h-1.5 rounded-full bg-white flex-shrink-0`}></div>}
                            {isCompleted && <CheckCircle className="w-3 h-3 flex-shrink-0" />}
                            <span className="truncate font-medium">{task.title}</span>
                        </div>
                        {isUserTask && (
                            <div className="text-xs opacity-90">★ Your Task</div>
                        )}
                      </button>
                    );
                  })}
                  {tasksOnDay.length > 3 && (
                      <button 
                        className="text-xs text-slate-500 text-center pt-1 hover:text-slate-700 cursor-pointer"
                        onClick={() => handleMoreTasksClick(day, tasksOnDay)}
                      >
                          + {tasksOnDay.length - 3} more
                      </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tasks Modal */}
      <Dialog open={showTasksModal} onOpenChange={setShowTasksModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Tasks for {selectedDayTasks && format(selectedDayTasks.day, 'MMMM d, yyyy')}</span>
              <Button variant="ghost" size="icon" onClick={() => setShowTasksModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {selectedDayTasks?.tasks.map(task => {
              const isCompleted = isTaskCompletedForDay(task, selectedDayTasks.day);
              return (
                <div
                  key={task.id}
                  className={`p-3 rounded-lg border cursor-pointer hover:bg-slate-50 ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}
                  onClick={() => {
                    onTaskClick(task);
                    setShowTasksModal(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    {task.frequency !== 'one-time' && <Repeat className="w-4 h-4 text-blue-500" />}
                    {isCompleted && <CheckCircle className="w-4 h-4 text-green-500" />}
                    <span className="font-medium">{task.title}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                  {task.frequency !== 'one-time' && !isCompleted && (
                    <Button
                      size="sm"
                      className="mt-2 bg-green-500 hover:bg-green-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePeriodComplete(task);
                      }}
                    >
                      Complete {task.frequency}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}