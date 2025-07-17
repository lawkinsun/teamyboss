
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Paperclip,
  MessageSquare,
  Users,
  MoreHorizontal,
  Repeat,
  CheckCircle
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format, isPast, startOfWeek, startOfMonth, startOfQuarter, endOfDay, endOfWeek, endOfMonth, endOfQuarter, isWithinInterval, addDays } from 'date-fns';

const getPeriodIdentifier = (date, frequency) => {
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
    default:
      return format(d, 'yyyy-MM-dd');
  }
};

// Function to create project abbreviations
const getProjectAbbreviation = (projectName) => {
  if (!projectName) return '';
  
  // Special cases for known projects
  const specialCases = {
    'No Money So Lonely': 'NMSL',
    'NO MONEY SO LONELY': 'NMSL',
    '5 sICK eNGINEERING': '5Sick',
    '5SICK ENGINEERING': '5Sick',
    'ZIPZIP': 'ZIP',
    'THE OLD BOOK STORE': 'TOBS'
  };
  
  if (specialCases[projectName]) {
    return specialCases[projectName];
  }
  
  // Generic abbreviation logic
  if (projectName.length <= 6) return projectName;
  
  // Take first letter of each word, max 4 chars
  const words = projectName.split(' ').filter(word => word.length > 0);
  if (words.length > 1) {
    return words.map(word => word[0].toUpperCase()).join('').substring(0, 4);
  }
  
  // For single words, take first 4-5 chars
  return projectName.substring(0, 5);
};

export default function TaskCard({ 
  task, 
  files, 
  messages, 
  onStatusChange, 
  onViewDetails, 
  onFileUpload, 
  taskCompletions = [], 
  onPeriodComplete,
  isSelected = false,
  onSelect,
  isUserTask = false,
  currentUser
}) {
  
  const priorityColors = {
    high: "border-l-red-500",
    medium: "border-l-orange-500",
    low: "border-l-blue-500",
  };
  
  const statusInfo = {
    completed: { text: 'Completed', color: 'bg-green-100 text-green-800' },
    in_progress: { text: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    pending: { text: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    overdue: { text: 'Overdue', color: 'bg-red-100 text-red-800' }
  };
  const currentStatusInfo = statusInfo[task.status] || statusInfo.pending;

  const isOverdue = !task.isInstance && task.due_date && isPast(new Date(task.due_date)) && task.status !== 'completed';

  const isCurrentPeriodCompleted = () => {
    return task.status === 'completed';
  };

  const currentPeriodCompleted = isCurrentPeriodCompleted();
  
  const getCardStyling = () => {
    let backgroundClass = "bg-white/80";
    let ringClass = "ring-transparent";

    if (currentPeriodCompleted) {
        // Completed tasks get a consistent green look, overriding other styles
        backgroundClass = "bg-green-50";
    } else if (isUserTask) {
        // User tasks (not completed) get the amber gradient and a subtle ring
        backgroundClass = "bg-gradient-to-r from-amber-50 to-orange-50";
        ringClass = "ring-amber-200";
    }

    if (isSelected) {
        // The selection ring is stronger and overrides the default user task ring
        ringClass = "ring-amber-500";
    }

    // Combine all classes. All cards have a ring to prevent layout shift.
    return `
        ${backgroundClass} 
        ${ringClass}
        ${priorityColors[task.priority]}
        backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-all duration-200 border-l-4 ring-2
    `;
  };

  const getPeriod = (instanceDate, frequency) => {
    if (!instanceDate) return null;
    const start = new Date(instanceDate);
    let end;
    if (frequency === 'daily') end = endOfDay(start);
    else if (frequency === 'weekly') end = endOfWeek(start, { weekStartsOn: 1 });
    else if (frequency === 'monthly') end = endOfMonth(start);
    else if (frequency === 'quarterly') end = endOfQuarter(start);
    return { start, end };
  };

  const period = getPeriod(task.instanceDate, task.frequency);

  const getMessagesForPeriod = () => {
    if (!task.isInstance || !period) return messages; // For one-time tasks, show all messages

    const currentPeriodIdentifier = getPeriodIdentifier(task.instanceDate, task.frequency);

    return messages.filter(msg => {
      // Prioritize filtering by the specific period_identifier if it exists on the message
      if (msg.period_identifier) {
        return msg.period_identifier === currentPeriodIdentifier;
      }
      // Fallback for older messages: check if the creation date falls within the period
      const msgDate = msg.created_date ? new Date(msg.created_date) : null;
      return msgDate && isWithinInterval(msgDate, period);
    });
  };

  const messagesForPeriod = getMessagesForPeriod();

  const filesForPeriod = files.filter(file => {
      if (!period) return true;
      const fileDate = new Date(file.upload_date);
      return isWithinInterval(fileDate, {start: period.start, end: addDays(period.end, 1)});
  });

  return (
    <Card className={getCardStyling()}>
      <CardContent className="p-3" onClick={() => onViewDetails(task)}>
        {/* Header */}
        <div className="flex items-start gap-2 mb-2">
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="w-3 h-3 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 mt-1 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              {task.frequency !== 'one-time' && <Repeat className="w-3 h-3 text-blue-500 flex-shrink-0" />}
              {currentPeriodCompleted && <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />}
              {isUserTask && !currentPeriodCompleted && (
                <Badge className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-800 border-amber-300">
                  Assigned to you
                </Badge>
              )}
            </div>
            <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-tight mb-1">
              {task.title}
            </h3>
            {task.isInstance && (
                <div className="text-xs text-slate-500 font-medium">
                    {format(new Date(task.instanceDate), 'MMM d, yyyy')}
                </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-6 h-6 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewDetails(task); }}>
                View Details
              </DropdownMenuItem>
              {!currentPeriodCompleted && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange(task, 'completed'); }}>
                  Mark as Completed
                </DropdownMenuItem>
              )}
              {!currentPeriodCompleted && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange(task, 'in_progress'); }}>
                  Mark In Progress
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Compact Info */}
        <div className="space-y-1.5 text-xs">
          {/* Project and Partners in one line */}
          <div className="flex items-center justify-between text-slate-600">
            <div className="flex items-center gap-1 min-w-0">
              <span className="font-medium">
                {(task.project_names || []).map(getProjectAbbreviation).join(", ") || "None"}
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              <Users className="w-3 h-3" />
              <span className="truncate max-w-20">
                {(task.assigned_partners || []).length}
              </span>
            </div>
          </div>

          {/* Date info - compact */}
          {!task.isInstance && task.due_date && (
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-slate-600'}`}>
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(task.due_date), 'MMM d')}</span>
            </div>
          )}
        </div>

        {/* Footer - Status and File/Message counts */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
          <Badge className={`text-xs px-2 py-0.5 ${currentStatusInfo.color}`}>
            {currentStatusInfo.text}
          </Badge>
          <div className="flex items-center gap-2 text-slate-400">
            <div className="flex items-center gap-1">
              <Paperclip className="w-3 h-3" />
              <span className="text-xs">{filesForPeriod.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              <span className="text-xs">{messagesForPeriod.length}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
