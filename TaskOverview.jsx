
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default function TaskOverview({ tasks, isLoading }) {
  const getTasksByStatus = (status) => tasks.filter(t => t.status === status);
  const getTasksByPriority = (priority) => tasks.filter(t => t.priority === priority);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    overdue: 'bg-red-100 text-red-800 border-red-200'
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-orange-100 text-orange-800 border-orange-200',
    low: 'bg-green-100 text-green-800 border-green-200'
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <CheckSquare className="w-5 h-5" />
          Task Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Task Status */}
          <div>
            <h3 className="font-semibold text-slate-700 mb-3">By Status</h3>
            <div className="space-y-2">
              {['pending', 'in_progress', 'completed', 'overdue'].map(status => (
                <div key={status} className="flex items-center justify-between">
                  <Badge className={`text-xs ${statusColors[status]}`}>
                    {status.replace('_', ' ')}
                  </Badge>
                  <span className="font-medium text-slate-800">
                    {getTasksByStatus(status).length}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Task Priority */}
          <div>
            <h3 className="font-semibold text-slate-700 mb-3">By Priority</h3>
            <div className="space-y-2">
              {['high', 'medium', 'low'].map(priority => (
                <div key={priority} className="flex items-center justify-between">
                  <Badge className={`text-xs ${priorityColors[priority]}`}>
                    {priority} priority
                  </Badge>
                  <span className="font-medium text-slate-800">
                    {getTasksByPriority(priority).length}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="mt-6">
          <h3 className="font-semibold text-slate-700 mb-3">Recent Tasks</h3>
          <div className="space-y-2">
            {tasks.slice(0, 3).map(task => (
              <div key={task.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <div>
                  <p className="font-medium text-slate-800 text-sm">{task.title}</p>
                  <p className="text-xs text-slate-500">{task.project_name} • {task.assigned_partner}</p>
                </div>
                <Badge className={`text-xs ${statusColors[task.status]}`}>
                  {task.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
