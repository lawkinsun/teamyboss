import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function PerformanceMetrics({ tasks, sales, labor, maintenance }) {
  const getTaskMetrics = () => {
    const statusCounts = {
      completed: tasks.filter(t => t.status === 'completed').length,
      pending: tasks.filter(t => t.status === 'pending').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      overdue: tasks.filter(t => t.status === 'overdue').length
    };

    return [
      { name: 'Completed', value: statusCounts.completed, color: '#10b981' },
      { name: 'In Progress', value: statusCounts.in_progress, color: '#3b82f6' },
      { name: 'Pending', value: statusCounts.pending, color: '#f59e0b' },
      { name: 'Overdue', value: statusCounts.overdue, color: '#ef4444' }
    ];
  };

  const getMaintenanceMetrics = () => {
    const priorityCounts = {
      critical: maintenance.filter(m => m.priority === 'critical' && m.status !== 'completed').length,
      high: maintenance.filter(m => m.priority === 'high' && m.status !== 'completed').length,
      medium: maintenance.filter(m => m.priority === 'medium' && m.status !== 'completed').length,
      low: maintenance.filter(m => m.priority === 'low' && m.status !== 'completed').length
    };

    return [
      { name: 'Critical', value: priorityCounts.critical, color: '#ef4444' },
      { name: 'High', value: priorityCounts.high, color: '#f59e0b' },
      { name: 'Medium', value: priorityCounts.medium, color: '#3b82f6' },
      { name: 'Low', value: priorityCounts.low, color: '#10b981' }
    ];
  };

  const taskMetrics = getTaskMetrics();
  const maintenanceMetrics = getMaintenanceMetrics();

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="text-sm font-medium">{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Task Performance Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskMetrics}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                >
                  {taskMetrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-4">
            {taskMetrics.map((metric, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: metric.color }}
                ></div>
                <span className="text-sm text-slate-600">
                  {metric.name}: {metric.value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Maintenance Priority Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={maintenanceMetrics}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                >
                  {maintenanceMetrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-4">
            {maintenanceMetrics.map((metric, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: metric.color }}
                ></div>
                <span className="text-sm text-slate-600">
                  {metric.name}: {metric.value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}