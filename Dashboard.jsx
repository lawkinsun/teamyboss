
import React, { useState, useEffect } from "react";
import { useAuth } from "../components/auth/AuthProvider";
import { User } from "@/api/entities";
import { Task } from "@/api/entities";
import { Project } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  CheckSquare,
  TrendingUp,
  Clock,
  AlertTriangle,
  Calendar,
  Briefcase,
  ArrowRight,
  LogIn,
  ClipboardList,
  CalendarClock
} from "lucide-react";
import { format, isBefore, startOfToday, addDays } from "date-fns";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

// A new, cleaner task item component for the dashboard
const DashboardTaskItem = ({ task }) => {
  const priorityColors = {
    high: 'border-l-red-500',
    medium: 'border-l-orange-500',
    low: 'border-l-blue-500'
  };

  const getStatusInfo = () => {
    if (task.status === 'overdue') {
      return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
    }
    if (task.status === 'completed') {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    }
    if (task.due_date) {
        const dueDate = new Date(task.due_date);
        const today = startOfToday();
        if(isBefore(dueDate, addDays(today, 1))) return <Badge variant="outline" className="text-red-600 border-red-200">Due Today</Badge>
        if(isBefore(dueDate, addDays(today, 7))) return <Badge variant="outline" className="text-orange-600 border-orange-200">Due this week</Badge>
    }
    return <Badge variant="outline">Pending</Badge>;
  };

  return (
    <div className={`p-3 bg-slate-50 rounded-lg flex items-center justify-between gap-4 border-l-4 ${priorityColors[task.priority] || 'border-l-slate-400'}`}>
        <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-800 truncate">{task.title}</p>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <Briefcase className="w-3 h-3"/>
                <span>{task.project_names?.join(', ') || 'General'}</span>
            </div>
        </div>
        <div className="flex-shrink-0">
            {getStatusInfo()}
        </div>
    </div>
  )
}

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [myTasks, setMyTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [activeProjectsCount, setActiveProjectsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [allTasks, allProjects] = await Promise.all([
        Task.list("-created_date"),
        Project.list()
      ]);

      const userTasks = allTasks.filter(t => 
        t.assigned_partners?.includes(currentUser.full_name) && t.status !== 'completed'
      );
      setMyTasks(userTasks);

      const overdue = allTasks.filter(t => t.status === 'overdue' && t.assigned_partners?.includes(currentUser.full_name));
      setOverdueTasks(overdue);

      setActiveProjectsCount(allProjects.filter(p => p.status === 'Active').length);

    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <p className="text-slate-600 text-lg">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
              Welcome back, {currentUser?.full_name?.split(' ')[0]}!
            </h1>
            <p className="text-slate-600 flex items-center gap-2 mt-2">
              <Calendar className="w-4 h-4" />
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <Button asChild className="bg-amber-500 hover:bg-amber-600">
            <Link to="/Tasks">
              <CheckSquare className="w-4 h-4 mr-2" />
              View All Tasks
            </Link>
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">My Pending Tasks</CardTitle>
              <ClipboardList className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{myTasks.length}</div>
              <p className="text-xs text-slate-500 mt-1">Tasks assigned to you</p>
            </CardContent>
          </Card>

          <Card className="bg-red-50 backdrop-blur-sm border border-red-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-red-700">Overdue Tasks</CardTitle>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-800">{overdueTasks.length}</div>
              <p className="text-xs text-red-600 mt-1">Require immediate attention</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Projects</CardTitle>
              <Briefcase className="w-4 h-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{activeProjectsCount}</div>
              <p className="text-xs text-slate-500 mt-1">Across the entire company</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Task Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* My Tasks */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                        <ClipboardList className="w-5 h-5 text-blue-500"/>
                        My Active Tasks
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {myTasks.length > 0 ? myTasks.slice(0, 5).map(task => (
                            <DashboardTaskItem key={task.id} task={task} />
                        )) : (
                            <p className="text-center py-8 text-slate-500">You have no pending tasks. Great job!</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Overdue Tasks */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                        <CalendarClock className="w-5 h-5 text-red-500"/>
                        Upcoming & Overdue
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {overdueTasks.length > 0 ? overdueTasks.slice(0, 5).map(task => (
                            <DashboardTaskItem key={task.id} task={task} />
                        )) : (
                             <p className="text-center py-8 text-slate-500">No overdue tasks. Keep it up!</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
