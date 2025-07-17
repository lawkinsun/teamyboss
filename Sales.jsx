import React, { useState, useEffect } from "react";
import { SalesRecord, Project } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  DollarSign, 
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from "date-fns";

export default function Sales() {
  const [salesData, setSalesData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [selectedProject, setSelectedProject] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [sales, projectData] = await Promise.all([
        SalesRecord.list("-date", 365),
        Project.list()
      ]);
      setSalesData(sales);
      setProjects(projectData);
    } catch (error) {
      console.error("Error loading sales data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredData = () => {
    const daysBack = parseInt(selectedPeriod);
    const startDate = subDays(new Date(), daysBack);
    
    return salesData.filter(s => {
      const saleDate = new Date(s.date);
      const projectMatch = selectedProject === 'all' || s.project_name === selectedProject;
      return saleDate >= startDate && projectMatch;
    });
  };

  const filteredData = getFilteredData();

  const getKPIs = () => {
    const totalRevenue = filteredData.reduce((sum, s) => sum + (s.daily_sales || 0), 0);
    const avgDailySales = filteredData.length > 0 ? totalRevenue / filteredData.length : 0;
    return { totalRevenue, avgDailySales };
  };

  const prepareChartData = () => {
    const dataByDate = {};
    filteredData.forEach(sale => {
      if (!dataByDate[sale.date]) {
        dataByDate[sale.date] = { date: sale.date, sales: 0 };
      }
      dataByDate[sale.date].sales += sale.daily_sales;
    });
    return Object.values(dataByDate).sort((a, b) => new Date(a.date) - new Date(b.date));
  };
  
  const kpis = getKPIs();
  const chartData = prepareChartData();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">Sales Performance</h1>
            <p className="text-slate-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Track daily revenue and targets across all your projects.
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="md:w-48"><SelectValue placeholder="Select period" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last Year</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="md:w-64"><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg">
                <CardHeader><CardTitle>Total Revenue</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold text-green-700">${kpis.totalRevenue.toLocaleString()}</p></CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-lg">
                <CardHeader><CardTitle>Average Daily Sales</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold text-blue-700">${kpis.avgDailySales.toLocaleString()}</p></CardContent>
            </Card>
        </div>

        {/* Chart */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader><CardTitle>Sales Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'MMM d')} />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} name="Total Sales" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}