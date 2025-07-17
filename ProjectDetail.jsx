
import React, { useState, useEffect } from "react";
import { Project } from "@/api/entities";
import { Task } from "@/api/entities";
import { SalesRecord } from "@/api/entities";
import { User } from "@/api/entities"; // Changed from Partner to User
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  TrendingUp, 
  CheckSquare,
  Users,
  Calendar,
  DollarSign,
  Target,
  ArrowLeft,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ProjectDetail() {
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [salesRecords, setSalesRecords] = useState([]);
  const [partners, setPartners] = useState([]); // This state now holds User objects
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjectData();
  }, [window.location.search]); // Rerun when URL params change

  const loadProjectData = async () => {
    try {
      setIsLoading(true);
      const urlParams = new URLSearchParams(window.location.search);
      const projectId = urlParams.get('id');
      
      if (!projectId) {
        console.error("No project ID provided");
        setIsLoading(false);
        return;
      }

      const [projectData, allTasks, allSalesRecords, allPartners] = await Promise.all([
        Project.list().then(projects => projects.find(p => p.id === projectId)),
        Task.list("-created_date"),
        SalesRecord.list("-date", 90),
        User.list() // Changed from Partner.list() to User.list()
      ]);

      if (!projectData) {
        console.error("Project not found");
        setProject(null);
        setIsLoading(false);
        return;
      }

      setProject(projectData);
      
      setTasks(allTasks.filter(task => task.project_names?.includes(projectData.name)));
      
      setSalesRecords(allSalesRecords.filter(record => record.project_name === projectData.name));
      
      // Filtering logic remains, assuming User objects now have accessible_projects and access_level
      setPartners(allPartners.filter(partner => 
        partner.accessible_projects?.includes(projectData.name) ||
        partner.access_level === 'full_access'
      ));

    } catch (error) {
      console.error("Error loading project data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const overdue = tasks.filter(t => t.status === 'overdue').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    
    return { total, completed, pending, overdue, inProgress };
  };

  const getSalesStats = () => {
    const totalSales = salesRecords.reduce((sum, record) => sum + (record.daily_sales || 0), 0);
    const avgDailySales = salesRecords.length > 0 ? totalSales / salesRecords.length : 0;
    const thisMonthSales = salesRecords
      .filter(record => {
        const recordDate = new Date(record.date);
        const now = new Date();
        return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, record) => sum + (record.daily_sales || 0), 0);
    
    return { totalSales, avgDailySales, thisMonthSales };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center py-12">Loading project dashboard...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Project Not Found</h3>
              <p className="text-slate-600 mb-4">The requested project could not be found or no ID was provided.</p>
              <Button asChild>
                <Link to="/Projects">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Projects
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const taskStats = getTaskStats();
  const salesStats = getSalesStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link to="/Projects">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
              {project.name} Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <Badge className={
                project.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }>
                {project.status}
              </Badge>
              <Badge variant="outline">
                {project.type}
              </Badge>
              <span className="text-slate-600">
                Managed by {project.manager}
              </span>
            </div>
          </div>
        </div>

        {/* Project Info */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Project Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-slate-700 mb-2">Description</h3>
                <p className="text-slate-600">{project.description || "No description available"}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 mb-2">Project Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Type:</span>
                    <span className="font-medium">{project.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Manager:</span>
                    <span className="font-medium">{project.manager}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Status:</span>
                    <Badge className={
                      project.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }>
                      {project.status}
                    </Badge>
                  </div>
                  {project.project_goal && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Project Goal:</span>
                      <span className="font-medium">{project.project_goal}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-slate-800">{taskStats.total}</div>
                  <div className="text-sm text-slate-600">Total Tasks</div>
                </div>
                <CheckSquare className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
                  <div className="text-sm text-slate-600">Completed</div>
                </div>
                <div className="text-green-500 font-semibold">
                  {taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-red-600">{taskStats.pending + taskStats.overdue}</div>
                  <div className="text-sm text-slate-600">Pending + Overdue</div>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-slate-800">{partners.length}</div>
                  <div className="text-sm text-slate-600">Team Members</div>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Performance (only show for projects with sales data) */}
        {salesRecords.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Sales Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                  <div className="text-2xl font-bold text-green-800">
                    ${salesStats.thisMonthSales.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-600">This Month</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-800">
                    ${salesStats.avgDailySales.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-600">Average Daily</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-purple-50 border border-purple-200">
                  <div className="text-2xl font-bold text-purple-800">
                    ${salesStats.totalSales.toLocaleString()}
                  </div>
                  <div className="text-sm text-purple-600">Total (90 days)</div>
                </div>
              </div>
              
              {project.project_goal && !isNaN(parseFloat(project.project_goal)) && (
                <div className="mt-4 p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-800 font-semibold">Monthly Target Progress</span>
                    <span className="text-amber-800">
                      {parseFloat(project.project_goal) > 0 ? Math.round((salesStats.thisMonthSales / parseFloat(project.project_goal)) * 100) : 0}%
                    </span>
                  </div>
                  <div className="mt-2 bg-amber-200 rounded-full h-2">
                    <div 
                      className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100, parseFloat(project.project_goal) > 0 ? (salesStats.thisMonthSales / parseFloat(project.project_goal)) * 100 : 0)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Tasks */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                Recent Tasks
              </CardTitle>
              <Button asChild variant="outline">
                <Link to={createPageUrl(`Tasks?project=${encodeURIComponent(project.name)}`)}>
                  View All Tasks
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{task.title}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span>{task.assigned_partners?.join(', ')}</span>
                        {task.categories?.map(cat => (
                          <Badge key={cat} variant="secondary" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Badge className={
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      task.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <CheckSquare className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                <p>No tasks found for this project</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            {partners.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {partners.map(partner => (
                  <div key={partner.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-slate-800 font-bold text-sm">
                        {(partner.full_name || 'U').split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{partner.full_name}</p>
                      <p className="text-xs text-slate-500">{partner.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                <p>No team members assigned to this project</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
