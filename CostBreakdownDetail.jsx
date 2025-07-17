import React, { useState, useEffect } from "react";
import { useAuth } from "../components/auth/AuthProvider";
import { PerformanceReport } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, BarChart3, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { format, parse } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from "react-router-dom";

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

export default function CostBreakdownDetail() {
  const { currentUser } = useAuth();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    if (currentUser) {
      loadReport();
    }
  }, [currentUser]);

  const loadReport = async () => {
    try {
      setIsLoading(true);
      // Get the most recent report
      const reports = await PerformanceReport.list("-report_month", 1);
      if (reports.length > 0) {
        setReport(reports[0]);
        setSelectedProject(reports[0].projects_data[0]?.project_name || null);
      }
    } catch (error) {
      console.error("Error loading report:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <p className="text-slate-600 text-lg">Loading cost breakdown...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">No Reports Available</h3>
              <p className="text-slate-600 mb-4">Upload a performance report to see detailed cost breakdowns.</p>
              <Button asChild className="bg-amber-500 hover:bg-amber-600">
                <Link to="/Analytics">Go to Analytics</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getProjectCostData = (projectName) => {
    if (!report.operational_expenses || !report.operational_expenses[projectName]) {
      return null;
    }

    const project = report.projects_data.find(p => p.project_name === projectName);
    const expenses = report.operational_expenses[projectName];

    if (!project) return null;

    const totalSales = project.total_sales || 0;
    if (totalSales === 0) return null;

    // Calculate category totals
    const utilities = Object.values(expenses.utilities || {}).reduce((a, b) => a + (b || 0), 0);
    const property = Object.values(expenses.property_costs || {}).reduce((a, b) => a + (b || 0), 0);
    const marketing = Object.values(expenses.marketing_tech || {}).reduce((a, b) => a + (b || 0), 0);
    const serviceProviders = Object.values(expenses.service_providers || {}).reduce((a, b) => a + (b || 0), 0);
    const equipmentSupplies = Object.values(expenses.equipment_supplies || {}).reduce((a, b) => a + (b || 0), 0);
    const professionalServices = Object.values(expenses.professional_services || {}).reduce((a, b) => a + (b || 0), 0);
    const opsMaintenance = Object.values(expenses.operations_maintenance || {}).reduce((a, b) => a + (b || 0), 0);

    return {
      project_name: projectName,
      total_sales: totalSales,
      food_cost: project.total_food_cost || 0,
      labor_cost: project.total_labor_cost || 0,
      utilities_cost: utilities,
      property_cost: property,
      marketing_cost: marketing,
      other_cost: serviceProviders + equipmentSupplies + professionalServices + opsMaintenance,
      categories: {
        utilities: expenses.utilities || {},
        property_costs: expenses.property_costs || {},
        marketing_tech: expenses.marketing_tech || {},
        service_providers: expenses.service_providers || {},
        equipment_supplies: expenses.equipment_supplies || {},
        professional_services: expenses.professional_services || {},
        operations_maintenance: expenses.operations_maintenance || {}
      }
    };
  };

  const projectData = selectedProject ? getProjectCostData(selectedProject) : null;

  const pieChartData = projectData ? [
    { name: 'Food Cost', value: projectData.food_cost, color: COLORS[0] },
    { name: 'Labor Cost', value: projectData.labor_cost, color: COLORS[1] },
    { name: 'Property & Rent', value: projectData.property_cost, color: COLORS[2] },
    { name: 'Utilities', value: projectData.utilities_cost, color: COLORS[3] },
    { name: 'Marketing & Tech', value: projectData.marketing_cost, color: COLORS[4] },
    { name: 'Other Operating', value: projectData.other_cost, color: COLORS[5] }
  ].filter(item => item.value > 0) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Button asChild variant="ghost" className="mb-4">
              <Link to="/Analytics">
                <ChevronLeft className="w-4 h-4 mr-2" /> Back to Analytics
              </Link>
            </Button>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
              Detailed Cost Breakdown
            </h1>
            <p className="text-slate-600 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              {format(parse(report.report_month, 'yyyy-MM', new Date()), 'MMMM yyyy')} - Comprehensive Analysis
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedProject || ''}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg bg-white"
            >
              {report.projects_data.map(project => (
                <option key={project.project_name} value={project.project_name}>
                  {project.project_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {projectData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Total Sales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-800">${projectData.total_sales.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Prime Cost
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-800">
                    ${(projectData.food_cost + projectData.labor_cost).toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-500">
                    {(((projectData.food_cost + projectData.labor_cost) / projectData.total_sales) * 100).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Total Operating Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-800">
                    ${(projectData.utilities_cost + projectData.property_cost + projectData.marketing_cost + projectData.other_cost).toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-500">
                    {(((projectData.utilities_cost + projectData.property_cost + projectData.marketing_cost + projectData.other_cost) / projectData.total_sales) * 100).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Net Margin
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {((1 - ((projectData.food_cost + projectData.labor_cost + projectData.utilities_cost + projectData.property_cost + projectData.marketing_cost + projectData.other_cost) / projectData.total_sales)) * 100).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pie Chart */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Cost Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({name, percent}) => `${name} ${(percent * 100).toFixed(1)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Breakdown */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Detailed Cost Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(projectData.categories).map(([categoryName, categoryData]) => {
                      const categoryTotal = Object.values(categoryData).reduce((a, b) => a + (b || 0), 0);
                      if (categoryTotal === 0) return null;
                      
                      return (
                        <div key={categoryName} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-slate-800 capitalize">
                              {categoryName.replace('_', ' ')}
                            </h4>
                            <Badge variant="outline">
                              ${categoryTotal.toLocaleString()}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            {Object.entries(categoryData).map(([item, cost]) => (
                              cost > 0 && (
                                <div key={item} className="flex justify-between text-sm">
                                  <span className="text-slate-600 capitalize">{item.replace('_', ' ')}</span>
                                  <span className="font-medium">${cost.toLocaleString()}</span>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}