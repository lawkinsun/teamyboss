
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../components/auth/AuthProvider";
import { PerformanceReport } from "@/api/entities";
import { Project } from "@/api/entities";
import { UploadFile, ExtractDataFromUploadedFile, InvokeLLM } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Upload,
  FileText,
  Trash2,
  Brain,
  Sparkles,
  ChevronLeft,
  ExternalLink,
  LogOut,
  Edit3
} from "lucide-react";
import { format, parse } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "@/api/entities";

const costColors = {
    food_cost_pct: "#8b5cf6",        // Purple
    labor_cost_pct: "#10b981",       // Green
    property_cost_pct: "#f59e0b",    // Amber
    utilities_cost_pct: "#ef4444",   // Red
    marketing_cost_pct: "#3b82f6",   // Blue
    other_op_ex_pct: "#ec4899",      // Pink (changed from indigo to pink for better contrast)
};

const costNames = {
    food_cost_pct: "Food Cost %",
    labor_cost_pct: "Labor Cost %",
    property_cost_pct: "Property & Rent %",
    utilities_cost_pct: "Utilities %",
    marketing_cost_pct: "Marketing & Tech %",
    other_op_ex_pct: "Other Operating %",
};

const CostBreakdownChart = ({ data, reportMonth }) => {
    if (!data || data.length === 0) {
        return (
            <div className="text-center p-8 bg-slate-50 rounded-lg">
                <p className="text-slate-600">No cost breakdown data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="w-full overflow-x-auto">
                <div className="min-w-[600px]"> {/* Ensure minimum width for chart */}
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                            data={data}
                            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                            barCategoryGap="20%"
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                                dataKey="project_name"
                                angle={-45}
                                textAnchor="end"
                                height={100}
                                fontSize={12}
                                stroke="#64748b"
                            />
                            <YAxis
                                domain={[0, 100]}
                                tickFormatter={(value) => `${value}%`}
                                fontSize={12}
                                stroke="#64748b"
                            />
                            <Tooltip
                                formatter={(value, name) => [`${value.toFixed(1)}%`, costNames[name]]}
                                labelStyle={{ color: '#1e293b' }}
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            />
                            <Legend
                                wrapperStyle={{ paddingTop: '20px' }}
                                iconType="rect"
                            />
                            {Object.keys(costColors).map(key => (
                                <Bar
                                    key={key}
                                    dataKey={key}
                                    stackId="costs"
                                    fill={costColors[key]}
                                    name={costNames[key]}
                                    radius={key === 'food_cost_pct' ? [0, 0, 4, 4] : key === 'other_op_ex_pct' ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Summary Table - Mobile Responsive */}
            <div className="mt-6">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Cost Summary ({format(parse(reportMonth, 'yyyy-MM', new Date()), 'MMMM yyyy')})</h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[500px]">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="text-left py-2 px-3 font-medium text-slate-600">Restaurant</th>
                                <th className="text-right py-2 px-3 font-medium text-slate-600">Food %</th>
                                <th className="text-right py-2 px-3 font-medium text-slate-600">Labor %</th>
                                <th className="text-right py-2 px-3 font-medium text-slate-600">Prime Cost %</th>
                                <th className="text-right py-2 px-3 font-medium text-slate-600">Total Costs %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, idx) => {
                                const totalCostPct = Object.keys(costColors).reduce((sum, key) => sum + (item[key] || 0), 0);
                                const primeCostPct = (item.food_cost_pct || 0) + (item.labor_cost_pct || 0);
                                return (
                                    <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                                        <td className="py-2 px-3 font-medium text-slate-800">{item.project_name}</td>
                                        <td className="text-right py-2 px-3 text-slate-700">{(item.food_cost_pct || 0).toFixed(1)}%</td>
                                        <td className="text-right py-2 px-3 text-slate-700">{(item.labor_cost_pct || 0).toFixed(1)}%</td>
                                        <td className="text-right py-2 px-3 font-medium text-slate-800">{primeCostPct.toFixed(1)}%</td>
                                        <td className={`text-right py-2 px-3 font-bold ${totalCostPct > 85 ? 'text-red-600' : totalCostPct > 75 ? 'text-amber-600' : 'text-green-600'}`}>
                                            {totalCostPct.toFixed(1)}%
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// CORRECTED: ExpenseSection is now a standalone, stable component.
const ExpenseSection = ({ title, category, fields, expenses, selectedShop, updateExpense }) => (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg text-slate-800">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {label}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={expenses[selectedShop]?.[category]?.[key] ?? ''}
                onChange={(e) => updateExpense(category, key, e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
);

const ExpenseInputForm = ({ report, onExpenseSubmit, isLoading }) => {
  const projectNames = useMemo(() => report.projects_data.map(p => p.project_name), [report.projects_data]);

  const [selectedShop, setSelectedShop] = useState(projectNames[0]);

  const defaultShopExpenses = useMemo(() => ({
    utilities: { electricity: '', water: '', gas: '', telecom: '' },
    property_costs: { rent: '', management: '', rates: '' },
    service_providers: { lbs_commercial: '', winson_cleaning: '', rentokil_initial: '', other_hygiene_expenses: '' },
    marketing_tech: { instagram: '', openrice: '', gingfood: '', credit_card_fees: '' },
    equipment_supplies: { gaudina_wine_glasses: '', taobao: '', inline: '', facility_equipments: '' },
    professional_services: { hkria: '', ch_cpa_accounting: '', fullion_decoration: '', easy_corp: '', insurance: '' },
    operations_maintenance: { daily_operation_draw: '', daily_expenses_bank: '', luen_pun: '', maintenance_clearance: '', "5sick": '', license_fees: '', berlin: '', br_fees: '' }
  }), []);

  const initialExpenseState = useMemo(() => {
    return projectNames.reduce((acc, name) => {
      acc[name] = JSON.parse(JSON.stringify(defaultShopExpenses)); // Deep copy
      return acc;
    }, {});
  }, [projectNames, defaultShopExpenses]);

  // ADD THE MISSING STATE VARIABLE
  const [expenses, setExpenses] = useState(initialExpenseState);

  // This effect correctly populates the form with existing data from the report when it's loaded.
  useEffect(() => {
    const newState = JSON.parse(JSON.stringify(initialExpenseState));
    if (report?.operational_expenses) {
      for (const shopName in report.operational_expenses) {
        if (report.operational_expenses.hasOwnProperty(shopName) && newState[shopName]) {
          for (const category in report.operational_expenses[shopName]) {
            if (report.operational_expenses[shopName].hasOwnProperty(category) && newState[shopName][category]) {
              for (const field in report.operational_expenses[shopName][category]) {
                 if (newState[shopName][category].hasOwnProperty(field)) {
                    // Convert stored numbers back to strings for the form fields
                    const value = report.operational_expenses[shopName][category][field];
                    newState[shopName][category][field] = value != null ? String(value) : '';
                 }
              }
            }
          }
        }
      }
    }
    setExpenses(newState);
  }, [report?.operational_expenses, initialExpenseState]);

  // Update selected shop if the current one is removed or if project data changes
  useEffect(() => {
    if (projectNames.length > 0 && !projectNames.includes(selectedShop)) {
      setSelectedShop(projectNames[0]);
    }
  }, [projectNames, selectedShop]);

  // CORRECTED: The update function is now wrapped in useCallback to keep it stable between renders.
  const updateExpense = useCallback((category, field, value) => {
    // Only allow number-like strings to be typed
    if (/^\d*\.?\d*$/.test(value)) {
        setExpenses(prev => ({
          ...prev,
          [selectedShop]: {
            ...prev[selectedShop],
            [category]: {
              ...prev[selectedShop][category],
              [field]: value // Store the raw string value to allow smooth typing
            }
          }
        }));
    }
  }, [selectedShop]); // Dependency array: `selectedShop` is a dependency

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    // Create a deep copy and parse all string values to numbers before submitting
    const processedExpenses = JSON.parse(JSON.stringify(expenses));
    for (const shop in processedExpenses) {
        for (const category in processedExpenses[shop]) {
            for (const field in processedExpenses[shop][category]) {
                processedExpenses[shop][category][field] = parseFloat(processedExpenses[shop][category][field]) || 0;
            }
        }
    }
    onExpenseSubmit(processedExpenses);
  }, [expenses, onExpenseSubmit]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-slate-100 rounded-lg">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Enter Operating Expenses</h3>
          <p className="text-sm text-slate-600">Select a shop to enter or edit its monthly expenses.</p>
        </div>
        <div className="flex-shrink-0">
            <Select value={selectedShop} onValueChange={setSelectedShop}>
                <SelectTrigger className="w-[180px] bg-white">
                    <SelectValue placeholder="Select a shop" />
                </SelectTrigger>
                <SelectContent>
                    {projectNames.map(name => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>

      <div className="space-y-4">
          <ExpenseSection
            title="Utilities"
            category="utilities"
            fields={[
              { key: 'electricity', label: 'Electricity' },
              { key: 'water', label: 'Water' },
              { key: 'gas', label: 'Gas' },
              { key: 'telecom', label: 'Telecom' }
            ]}
            expenses={expenses}
            selectedShop={selectedShop}
            updateExpense={updateExpense}
          />

          <ExpenseSection
            title="Property Costs"
            category="property_costs"
            fields={[
              { key: 'rent', label: 'Rent' },
              { key: 'management', label: 'Management Fees' },
              { key: 'rates', label: 'Government Rates' }
            ]}
            expenses={expenses}
            selectedShop={selectedShop}
            updateExpense={updateExpense}
          />

          <ExpenseSection
            title="Service Providers"
            category="service_providers"
            fields={[
              { key: 'lbs_commercial', label: 'LBS Commercial' },
              { key: 'winson_cleaning', label: 'Winson Cleaning' },
              { key: 'rentokil_initial', label: 'Rentokil Initial' },
              { key: 'other_hygiene_expenses', label: 'Other Hygiene Expenses' }
            ]}
            expenses={expenses}
            selectedShop={selectedShop}
            updateExpense={updateExpense}
          />

          <ExpenseSection
            title="Marketing & Technology"
            category="marketing_tech"
            fields={[
              { key: 'instagram', label: 'Instagram' },
              { key: 'openrice', label: 'OpenRice' },
              { key: 'gingfood', label: 'GingFood' },
              { key: 'credit_card_fees', label: 'Credit Card Fees' }
            ]}
            expenses={expenses}
            selectedShop={selectedShop}
            updateExpense={updateExpense}
          />

          <ExpenseSection
            title="Equipment & Supplies"
            category="equipment_supplies"
            fields={[
              { key: 'gaudina_wine_glasses', label: 'GAUDINA (Wine Glasses)' },
              { key: 'taobao', label: 'TaoBao' },
              { key: 'inline', label: 'Inline' },
              { key: 'facility_equipments', label: 'Facility / Equipment' }
            ]}
            expenses={expenses}
            selectedShop={selectedShop}
            updateExpense={updateExpense}
          />

          <ExpenseSection
            title="Professional Services"
            category="professional_services"
            fields={[
              { key: 'hkria', label: 'HKRIA' },
              { key: 'ch_cpa_accounting', label: 'CH CPA & Co. (Accounting)' },
              { key: 'fullion_decoration', label: 'Fullion Decoration Eng. Co' },
              { key: 'easy_corp', label: 'Easy Corp' },
              { key: 'insurance', label: 'Insurance' }
            ]}
            expenses={expenses}
            selectedShop={selectedShop}
            updateExpense={updateExpense}
          />

          <ExpenseSection
            title="Operations & Maintenance"
            category="operations_maintenance"
            fields={[
              { key: 'daily_operation_draw', label: 'Daily Operation (Draw)' },
              { key: 'daily_expenses_bank', label: 'Daily Expenses (Bank)' },
              { key: 'luen_pun', label: 'Luen Pun' },
              { key: 'maintenance_clearance', label: 'Maintenance/Clearance' },
              { key: '5sick', label: '5Sick' },
              { key: 'license_fees', label: 'License Fees' },
              { key: 'berlin', label: 'Berlin' },
              { key: 'br_fees', label: 'BR Fees' }
            ]}
            expenses={expenses}
            selectedShop={selectedShop}
            updateExpense={updateExpense}
          />
      </div>

      <Button
        type="submit"
        className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3"
        disabled={isLoading}
      >
        {isLoading ? 'Saving and Analyzing...' : 'Save Expenses & Run Full Analysis'}
      </Button>
    </form>
  );
};

const PerformanceReportUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [reportMonth, setReportMonth] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!file || !reportMonth) {
      alert("Please select a report month and a file.");
      return;
    }
    setIsUploading(true);

    try {
      const { file_url } = await UploadFile({ file });

      const extractResult = await ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            reports: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  project_name: { type: "string", "description": "Name of the project, e.g., ZipZip, NMSL, or 535" },
                  month: { type: "string", "description": "The month this data represents (e.g., April, May, June)" },
                  total_sales: { type: "number" },
                  sales_target: { "type": "number" },
                  sales_breakdown: { "type": "object", "additionalProperties": { "type": "number" } },
                  total_labor_cost: { type: "number" },
                  labor_breakdown: { "type": "object", "additionalProperties": { "type": "number" } },
                  total_food_cost: { type: "number" },
                  food_breakdown: { "type": "object", "additionalProperties": { "type": "number" } }
                }
              }
            }
          },
        },
      });

      if (!extractResult.output || !extractResult.output.reports || extractResult.output.reports.length === 0) {
        throw new Error("Could not extract the required structured data from the PDF. Please ensure the report format is correct.");
      }

      // Filter to only include data for the selected month
      const selectedMonthName = new Date(reportMonth + '-01').toLocaleString('default', { month: 'long' });
      let filteredReports = extractResult.output.reports.filter(report => {
        // Match by month name (e.g., "April" matches "April")
        return report.month && report.month.toLowerCase().includes(selectedMonthName.toLowerCase());
      });

      if (filteredReports.length === 0) {
        // If no data is found for the selected month, throw an error to prevent saving incorrect data.
        throw new Error(`No data could be found for ${selectedMonthName} in the uploaded document. Please ensure the document is formatted correctly and contains data for the selected month.`);
      }

      // Clean up project names that might contain the month from extraction
      filteredReports = filteredReports.map(report => ({
          ...report,
          project_name: report.project_name.replace(`- ${report.month}`, '').trim()
      }));

      const aiAnalysis = await InvokeLLM({
        prompt: `You are a senior restaurant business analyst. Analyze the following monthly performance data for ${selectedMonthName} only.

        IMPORTANT: This analysis should focus ONLY on ${selectedMonthName} data. Do not mix or compare with other months.

        Data for ${selectedMonthName}: ${JSON.stringify(filteredReports)}

        Your analysis must include:
        1.  **Monthly Summary for ${selectedMonthName}**: A high-level overview of the performance for this specific month only.
        2.  **Prime Cost Calculation for ${selectedMonthName}**: For each restaurant, calculate Food Cost %, Labor Cost %, and Prime Cost % (Food % + Labor %). A healthy prime cost is typically 55-60%.
        3.  **Restaurant Comparison for ${selectedMonthName}**: Compare the restaurants on key metrics for this month only (Sales vs. Target, Prime Cost, Sales per labor dollar). Identify the top performer for ${selectedMonthName} and why.
        4.  **Individual Restaurant Insights for ${selectedMonthName}**: For each restaurant, provide 2-3 specific, actionable insights or recommendations based on their ${selectedMonthName} performance.
        5.  **${selectedMonthName} Opportunities & Risks**: Identify 2-3 opportunities for the group and any potential risks based on this month's performance.`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_summary: { type: "string" },
            prime_cost_analysis: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  project_name: { type: "string" },
                  food_cost_percent: { type: "number" },
                  labor_cost_percent: { type: "number" },
                  prime_cost_percent: { type: "number" },
                  comment: { type: "string" }
                }
              }
            },
            comparative_analysis: { type: "string" },
            individual_analysis: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  project_name: { type: "string" },
                  insights: { type: "array", items: { "type": "string" } }
                }
              }
            },
            opportunities_and_risks: {
              type: "object",
              properties: {
                opportunities: { type: "array", items: { "type": "string" } },
                risks: { type: "array", items: { "type": "string" } }
              }
            }
          }
        }
      });

      await PerformanceReport.create({
        report_month: reportMonth,
        file_url: file_url,
        projects_data: filteredReports, // Only save the filtered data for the selected month
        ai_analysis: JSON.stringify(aiAnalysis),
      });

      setFile(null);
      setReportMonth("");
      onUploadSuccess();

    } catch (error) {
      console.error("Error processing performance report:", error);
      alert(`An error occurred: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Monthly Performance Report
          <Badge className="bg-purple-100 text-purple-800">
            <Brain className="w-3 h-3 mr-1" />
            Advanced AI Analysis
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          type="month"
          value={reportMonth}
          onChange={e => setReportMonth(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
        />
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
        />
        <Button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full bg-amber-500 hover:bg-amber-600"
        >
          {isUploading ? "Processing..." : "Upload & Analyze"}
        </Button>
      </CardContent>
    </Card>
  );
};

const ProjectDetailBreakdown = ({ project, reportMonth, operationalExpenses }) => {
  const [activeTab, setActiveTab] = useState('sales');
  
  const tabs = [
    { id: 'sales', label: 'Sales Breakdown', icon: '💰' },
    { id: 'labor', label: 'Labor Costs', icon: '👥' },
    { id: 'food', label: 'Food Costs', icon: '🍽️' },
    { id: 'operating', label: 'Operating Expenses', icon: '🏢' }
  ];

  const TabButton = ({ tab, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        isActive 
          ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' 
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      <span>{tab.icon}</span>
      <span>{tab.label}</span>
    </button>
  );

  const SalesBreakdown = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h4 className="font-semibold text-green-800 mb-2">Sales Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Sales:</span>
              <span className="font-bold">${project.total_sales?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex justify-between">
              <span>Sales Target:</span>
              <span className="font-bold">${project.sales_target?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex justify-between">
              <span>Achievement:</span>
              <span className={`font-bold ${(project.total_sales || 0) >= (project.sales_target || 0) ? 'text-green-600' : 'text-red-600'}`}>
                {project.sales_target ? ((project.total_sales || 0) / project.sales_target * 100).toFixed(1) : '0'}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">Performance Metrics</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>vs Target:</span>
              <span className={`font-bold ${(project.total_sales || 0) >= (project.sales_target || 0) ? 'text-green-600' : 'text-red-600'}`}>
                ${((project.total_sales || 0) - (project.sales_target || 0)).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Food Cost Ratio:</span>
              <span className="font-bold">{project.total_sales ? ((project.total_food_cost || 0) / project.total_sales * 100).toFixed(1) : '0'}%</span>
            </div>
            <div className="flex justify-between">
              <span>Labor Cost Ratio:</span>
              <span className="font-bold">{project.total_sales ? ((project.total_labor_cost || 0) / project.total_sales * 100).toFixed(1) : '0'}%</span>
            </div>
          </div>
        </div>
      </div>

      {project.sales_breakdown && (
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <h4 className="font-semibold text-slate-800 mb-3">Sales by Category</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(project.sales_breakdown).map(([category, amount]) => (
              <div key={category} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-700 capitalize">{category.replace(/_/g, ' ')}</span>
                <span className="font-semibold text-slate-800">${amount?.toLocaleString() || '0'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const LaborBreakdown = () => (
    <div className="space-y-4">
      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
        <h4 className="font-semibold text-orange-800 mb-2">Labor Cost Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex justify-between">
            <span>Total Labor Cost:</span>
            <span className="font-bold">${project.total_labor_cost?.toLocaleString() || '0'}</span>
          </div>
          <div className="flex justify-between">
            <span>% of Sales:</span>
            <span className="font-bold">{project.total_sales ? ((project.total_labor_cost || 0) / project.total_sales * 100).toFixed(1) : '0'}%</span>
          </div>
          <div className="flex justify-between">
            <span>Daily Labor Cost:</span>
            <span className="font-bold">${project.total_labor_cost ? ((project.total_labor_cost || 0) / 30).toFixed(0) : '0'}</span>
          </div>
        </div>
      </div>

      {project.labor_breakdown && (
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <h4 className="font-semibold text-slate-800 mb-3">Labor Cost by Department</h4>
          <div className="space-y-3">
            {Object.entries(project.labor_breakdown).map(([department, cost]) => (
              <div key={department} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-700 capitalize">{department.replace(/_/g, ' ')}</span>
                <div className="text-right">
                  <span className="font-semibold text-slate-800 block">${cost?.toLocaleString() || '0'}</span>
                  <span className="text-xs text-slate-500">
                    {project.total_labor_cost ? ((cost || 0) / project.total_labor_cost * 100).toFixed(1) : '0'}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const FoodBreakdown = () => (
    <div className="space-y-4">
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <h4 className="font-semibold text-purple-800 mb-2">Food Cost Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex justify-between">
            <span>Total Food Cost:</span>
            <span className="font-bold">${project.total_food_cost?.toLocaleString() || '0'}</span>
          </div>
          <div className="flex justify-between">
            <span>% of Sales:</span>
            <span className="font-bold">{project.total_sales ? ((project.total_food_cost || 0) / project.total_sales * 100).toFixed(1) : '0'}%</span>
          </div>
          <div className="flex justify-between">
            <span>Target Range:</span>
            <span className="font-bold text-slate-600">25-30%</span>
          </div>
        </div>
      </div>

      {project.food_breakdown && (
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <h4 className="font-semibold text-slate-800 mb-3">Food Cost by Category</h4>
          <div className="space-y-3">
            {Object.entries(project.food_breakdown).map(([category, cost]) => (
              <div key={category} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-700 capitalize">{category.replace(/_/g, ' ')}</span>
                <div className="text-right">
                  <span className="font-semibold text-slate-800 block">${cost?.toLocaleString() || '0'}</span>
                  <span className="text-xs text-slate-500">
                    {project.total_food_cost ? ((cost || 0) / project.total_food_cost * 100).toFixed(1) : '0'}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const OperatingExpensesBreakdown = () => {
    const expenses = operationalExpenses?.[project.project_name] || {};
    
    return (
      <div className="space-y-4">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h4 className="font-semibold text-red-800 mb-2">Operating Expenses Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span>Total Operating Expenses:</span>
              <span className="font-bold">
                ${Object.values(expenses).reduce((total, category) => 
                  total + Object.values(category || {}).reduce((sum, val) => sum + (val || 0), 0), 0
                ).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>% of Sales:</span>
              <span className="font-bold">
                {project.total_sales ? (
                  Object.values(expenses).reduce((total, category) => 
                    total + Object.values(category || {}).reduce((sum, val) => sum + (val || 0), 0), 0
                  ) / project.total_sales * 100
                ).toFixed(1) : '0'}%
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(expenses).map(([categoryName, categoryExpenses]) => {
            const categoryTotal = Object.values(categoryExpenses || {}).reduce((sum, val) => sum + (val || 0), 0);
            if (categoryTotal === 0) return null;
            
            return (
              <div key={categoryName} className="bg-white p-4 rounded-lg border border-slate-200">
                <h5 className="font-semibold text-slate-800 mb-3 capitalize">
                  {categoryName.replace(/_/g, ' ')} - ${categoryTotal.toLocaleString()}
                </h5>
                <div className="space-y-2">
                  {Object.entries(categoryExpenses || {}).map(([item, cost]) => {
                    if (!cost) return null;
                    return (
                      <div key={item} className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 capitalize">{item.replace(/_/g, ' ')}</span>
                        <span className="font-medium">${cost.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'sales': return <SalesBreakdown />;
      case 'labor': return <LaborBreakdown />;
      case 'food': return <FoodBreakdown />;
      case 'operating': return <OperatingExpensesBreakdown />;
      default: return <SalesBreakdown />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          {project.project_name} - {format(parse(reportMonth, 'yyyy-MM', new Date()), 'MMMM yyyy')} Details
        </h3>
        
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tabs.map(tab => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {renderTabContent()}
      </div>
    </div>
  );
};

const PerformanceReportDetails = ({ report, onClear }) => {
  const [selectedProject, setSelectedProject] = useState(report.projects_data[0]);
  const [selectedShop, setSelectedShop] = useState('all');
  const [showProjectDetail, setShowProjectDetail] = useState(false);

  const insights = JSON.parse(report.ai_analysis);

  let netProfitAnalysis = null;
  if (report.net_profit_analysis) {
    try {
      netProfitAnalysis = JSON.parse(report.net_profit_analysis);
    } catch (e) {
      console.error("Error parsing net profit analysis:", e);
    }
  }

  const prepareCostBreakdownData = useCallback(() => {
    if (!report.projects_data || !report.operational_expenses) {
        return [];
    }

    // FIXED: Only show data for projects that have operational expenses entered
    return report.projects_data
        .filter(project => report.operational_expenses[project.project_name]) // Only projects with expenses
        .map(project => {
            const totalSales = project.total_sales || 0;
            if (totalSales === 0) {
                return null; // Skip projects with no sales
            }

            const expenses = report.operational_expenses[project.project_name] || {};

            // Calculate category totals
            const utilities = Object.values(expenses.utilities || {}).reduce((a, b) => a + (b || 0), 0);
            const property = Object.values(expenses.property_costs || {}).reduce((a, b) => a + (b || 0), 0);
            const marketing = Object.values(expenses.marketing_tech || {}).reduce((a, b) => a + (b || 0), 0);

            const serviceProviders = Object.values(expenses.service_providers || {}).reduce((a, b) => a + (b || 0), 0);
            const equipmentSupplies = Object.values(expenses.equipment_supplies || {}).reduce((a, b) => a + (b || 0), 0);
            const professionalServices = Object.values(expenses.professional_services || {}).reduce((a, b) => a + (b || 0), 0);
            const opsMaintenance = Object.values(expenses.operations_maintenance || {}).reduce((a, b) => a + (b || 0), 0);

            const otherOpEx = serviceProviders + equipmentSupplies + professionalServices + opsMaintenance;

            return {
                project_name: project.project_name,
                food_cost_pct: Math.min(((project.total_food_cost || 0) / totalSales) * 100, 100),
                labor_cost_pct: Math.min(((project.total_labor_cost || 0) / totalSales) * 100, 100),
                property_cost_pct: Math.min((property / totalSales) * 100, 100),
                utilities_cost_pct: Math.min((utilities / totalSales) * 100, 100),
                marketing_cost_pct: Math.min((marketing / totalSales) * 100, 100),
                other_op_ex_pct: Math.min((otherOpEx / totalSales) * 100, 100),
            };
        })
        .filter(item => item !== null); // Remove null entries
  }, [report.projects_data, report.operational_expenses]);

  const costBreakdownData = useMemo(() => prepareCostBreakdownData(), [prepareCostBreakdownData]);

  const handleProjectSelect = (projectName) => {
    const project = report.projects_data.find(p => p.project_name === projectName);
    setSelectedProject(project);
  }

  const calculateTotalExpenses = () => {
    if (!report.operational_expenses) return 0;

    let total = 0;
    // Sum up all expenses from all shops
    Object.values(report.operational_expenses).forEach(shopExpenses => {
        Object.values(shopExpenses).forEach(category => {
            Object.values(category).forEach(expense => {
                total += expense || 0;
            });
        });
    });
    return total;
  };

  const totalOperationalExpenses = calculateTotalExpenses();

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <BarChart3 className="w-5 h-5" />
            Monthly Performance Analysis
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClear}>
            <ChevronLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>
        <p className="text-slate-600 text-sm">
          Report for: {format(parse(report.report_month, 'yyyy-MM', new Date()), 'MMMM yyyy')}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Show Project Detail or Main View */}
        {showProjectDetail ? (
          <div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowProjectDetail(false)}
              className="mb-4"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Overview
            </Button>
            <ProjectDetailBreakdown 
              project={selectedProject}
              reportMonth={report.report_month}
              operationalExpenses={report.operational_expenses}
            />
          </div>
        ) : (
          <>
            {/* Complete Profitability Overview with Shop Selector */}
            {netProfitAnalysis && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <h3 className="text-lg font-semibold">Complete Profitability Overview</h3>
                  <Select value={selectedShop} onValueChange={setSelectedShop}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Select Shop" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Shops</SelectItem>
                      {netProfitAnalysis.restaurant_profitability?.map(restaurant => (
                        <SelectItem key={restaurant.project_name} value={restaurant.project_name}>
                          {restaurant.project_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Responsive Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {netProfitAnalysis.restaurant_profitability
                    ?.filter(restaurant => selectedShop === 'all' || restaurant.project_name === selectedShop)
                    .map(restaurant => (
                      <Card key={restaurant.project_name} className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base truncate">{restaurant.project_name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600">Total Sales:</span>
                              <span className="font-bold text-right">${restaurant.total_sales?.toLocaleString() || '0'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600">Prime Costs:</span>
                              <span className="font-bold text-right">${restaurant.prime_costs?.toLocaleString() || '0'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600">Operating Expenses:</span>
                              <span className="font-bold text-right">${restaurant.operating_expenses?.toLocaleString() || '0'}</span>
                            </div>
                            <div className="flex justify-between items-center border-t pt-2">
                              <span className="font-semibold">Net Profit:</span>
                              <span className={`font-bold text-right ${restaurant.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${restaurant.net_profit?.toLocaleString() || '0'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600">Profit Margin:</span>
                              <span className={`font-bold text-right ${restaurant.profit_margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {restaurant.profit_margin?.toFixed(1) || '0'}%
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-semibold text-purple-800 flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4" />
                    Business Analysis - {format(parse(report.report_month, 'yyyy-MM', new Date()), 'MMMM yyyy')}
                  </h4>
                  <p className="text-purple-700 text-sm break-words">{netProfitAnalysis.complete_analysis}</p>
                </div>
              </div>
            )}

            {/* RESTRUCTURED Cost Breakdown Chart */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Cost Breakdown Analysis - {format(parse(report.report_month, 'yyyy-MM', new Date()), 'MMMM yyyy')}</h3>
              {report.operational_expenses ? (
                <CostBreakdownChart data={costBreakdownData} reportMonth={report.report_month} />
              ) : (
                <div className="text-center p-8 bg-slate-50 rounded-lg">
                    <p className="text-slate-600">Enter operational expenses to see detailed cost breakdown analysis.</p>
                </div>
              )}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4">
                <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Monthly Comparative Analysis - {format(parse(report.report_month, 'yyyy-MM', new Date()), 'MMMM yyyy')}
                </h4>
                <p className="text-blue-700 text-sm mt-2 break-words">{insights.comparative_analysis}</p>
              </div>
            </div>

            {/* Individual Project Details */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Individual Project Details - {format(parse(report.report_month, 'yyyy-MM', new Date()), 'MMMM yyyy')}</h3>
              <div className="flex gap-2 mb-4 border-b overflow-x-auto">
                {report.projects_data.map(p => (
                  <Button
                    key={p.project_name}
                    variant={selectedProject.project_name === p.project_name ? 'default' : 'ghost'}
                    onClick={() => handleProjectSelect(p.project_name)}
                    className={`whitespace-nowrap ${selectedProject.project_name === p.project_name ? 'bg-slate-800' : ''}`}
                  >
                    {p.project_name}
                  </Button>
                ))}
              </div>

              {selectedProject && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Total Sales</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-lg font-bold break-words">${selectedProject.total_sales?.toLocaleString() || '0'}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Labor Cost</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-lg font-bold break-words">${selectedProject.total_labor_cost?.toLocaleString() || '0'}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Food Cost</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-lg font-bold break-words">${selectedProject.total_food_cost?.toLocaleString() || '0'}</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-amber-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Prime Cost %</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-lg font-bold break-words">
                          {insights.prime_cost_analysis.find(p => p.project_name === selectedProject.project_name)?.prime_cost_percent?.toFixed(1) || '0'}%
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* View Details Button */}
                  <div className="flex justify-center">
                    <Button 
                      onClick={() => setShowProjectDetail(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Detailed Breakdown
                    </Button>
                  </div>
                  
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-800 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      AI Insights for {selectedProject.project_name} - {format(parse(report.report_month, 'yyyy-MM', new Date()), 'MMM yyyy')}
                    </h4>
                    <ul className="text-green-700 text-sm mt-2 space-y-1 list-disc list-inside">
                      {insights.individual_analysis.find(i => i.project_name === selectedProject.project_name)?.insights.map((insight, idx) =>
                        <li key={idx} className="break-words">{insight}</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Operating Expenses Summary */}
            {report.operational_expenses && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Operating Expenses Summary - {format(parse(report.report_month, 'yyyy-MM', new Date()), 'MMMM yyyy')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(report.operational_expenses).map(([shopName, shopExpenses]) => {
                    const shopTotal = Object.values(shopExpenses).reduce((acc, categoryExpenses) => {
                      return acc + Object.values(categoryExpenses).reduce((sum, val) => sum + (val || 0), 0);
                    }, 0);
                    return (
                      <Card key={shopName} className="bg-red-50 border-red-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm break-words">
                            {shopName} Total Expenses
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="text-lg font-bold text-red-700 break-words">
                            ${shopTotal.toLocaleString()}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-red-800">Total Group Operating Expenses:</span>
                    <span className="text-xl font-bold text-red-800 break-words">${totalOperationalExpenses.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            <Button asChild variant="outline" className="w-full mt-4">
              <a href={report.file_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Original PDF
              </a>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default function Analytics() {
  const { currentUser, isAdmin } = useAuth();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [isCalculatingExpenses, setIsCalculatingExpenses] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const reportData = await PerformanceReport.list("-report_month");
      setReports(reportData);
      if (reportData.length > 0) {
        // If there's an existing selected report, try to keep it selected by ID
        // Otherwise, select the latest one
        setSelectedReport(prev => {
          if (prev) {
            return reportData.find(r => r.id === prev.id) || reportData[0];
          }
          return reportData[0];
        });
      } else {
        setSelectedReport(null); // Ensure selectedReport is null if no reports exist
      }
      setShowExpenseForm(false); // Hide form on load
    } catch (error) {
      console.error("Error loading analytics data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!isAdmin) {
      alert("You do not have permission to delete reports.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this report?")) {
      await PerformanceReport.delete(reportId);
      await loadData(); // Reload all data and re-select latest
    }
  };

  const handleLogout = async () => {
    await User.logout();
    window.location.href = '/login';
  };

  const handleExpenseSubmit = async (expenses) => {
    if (!selectedReport) return;

    setIsCalculatingExpenses(true);
    try {
      // Prepare project data for LLM, now including per-shop expenses
      const projectsForLLM = selectedReport.projects_data.map(project => {
        const primeCostData = JSON.parse(selectedReport.ai_analysis).prime_cost_analysis.find(p => p.project_name === project.project_name);

        const projectExpenses = expenses[project.project_name] || {};
        let totalOperationalExpensesForProject = 0;
        Object.values(projectExpenses).forEach(category => {
          Object.values(category).forEach(expense => {
            totalOperationalExpensesForProject += expense || 0;
          });
        });

        return {
          project_name: project.project_name,
          total_sales: project.total_sales,
          prime_costs: (project.total_labor_cost || 0) + (project.total_food_cost || 0),
          operational_expenses: totalOperationalExpensesForProject,
          food_cost_percent: primeCostData?.food_cost_percent || 0,
          labor_cost_percent: primeCostData?.labor_cost_percent || 0,
          prime_cost_percent: primeCostData?.prime_cost_percent || 0
        };
      });

      // Invoke LLM for complete profitability analysis
      const profitabilityAnalysis = await InvokeLLM({
        prompt: `You are a senior restaurant financial analyst. Calculate the complete profitability for the following restaurants for the month of ${format(parse(selectedReport.report_month, 'yyyy-MM', new Date()), 'MMMM yyyy')}.

        For each restaurant, I have provided their total sales, prime costs (labor + food), and their directly-inputted operational expenses for the month.

        Restaurant Data: ${JSON.stringify(projectsForLLM)}

        Your task is to:
        1.  For each restaurant, calculate:
            -   Total Costs (prime_costs + operational_expenses)
            -   Net Profit (total_sales - Total Costs)
            -   Profit Margin % (Net Profit / total_sales * 100)
        2.  Return the results in the specified JSON format.
        3.  Provide a 'complete_analysis' summary text. In this summary, compare the final net profitability of the restaurants for this month, identify the top performer, and suggest key areas for improvement for the under-performers based on their full cost structure for this month. Focus ONLY on the single month's performance.`,
        response_json_schema: {
          type: "object",
          properties: {
            restaurant_profitability: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  project_name: { type: "string" },
                  total_sales: { type: "number" },
                  prime_costs: { type: "number" },
                  operating_expenses: { type: "number" },
                  total_costs: { type: "number" },
                  net_profit: { type: "number" },
                  profit_margin: { type: "number" }
                },
                required: ["project_name", "total_sales", "prime_costs", "operating_expenses", "total_costs", "net_profit", "profit_margin"]
              }
            },
            complete_analysis: { type: "string" }
          },
          required: ["restaurant_profitability", "complete_analysis"]
        }
      });

      // Update the report with per-shop expenses and the new analysis
      await PerformanceReport.update(selectedReport.id, {
        operational_expenses: expenses, // Save the detailed expense breakdown per shop
        net_profit_analysis: JSON.stringify(profitabilityAnalysis) // Save the AI's analysis
      });

      // Reload data to show updated report
      const updatedReport = await PerformanceReport.list().then(reports => reports.find(r => r.id === selectedReport.id));

      setReports(prev => prev.map(r => r.id === selectedReport.id ? updatedReport : r));
      setSelectedReport(updatedReport);
      setShowExpenseForm(false);

    } catch (error) {
      console.error("Error calculating profitability analysis:", error);
      alert(`Failed to calculate complete analysis. Please try again. Error: ${error.message}`);
    } finally {
      setIsCalculatingExpenses(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-4xl font-bold text-slate-800 mb-2">
              Business Performance Analytics
            </h1>
            <p className="text-slate-600 flex items-center gap-2">
              Upload monthly reports for comprehensive profitability analysis
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2 w-full md:w-auto">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1 space-y-6">
            {isAdmin && <PerformanceReportUpload onUploadSuccess={loadData} />}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader><CardTitle>Report History</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {isLoading ? <p>Loading reports...</p> :
                    reports.length > 0 ? (
                      reports.map(report => (
                        <div
                          key={report.id}
                          className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${selectedReport?.id === report.id ? 'bg-amber-100 border-amber-300' : 'bg-slate-50 hover:bg-slate-100'}`}
                          onClick={() => {
                            setSelectedReport(report);
                            setShowExpenseForm(false);
                          }}
                        >
                          <FileText className="w-5 h-5 mr-3 text-slate-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 truncate">
                              {format(parse(report.report_month, 'yyyy-MM', new Date()), 'MMMM yyyy')} Report
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              Uploaded {format(new Date(report.created_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                          {isAdmin && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => { e.stopPropagation(); handleDeleteReport(report.id); }}
                              className="text-slate-400 hover:text-red-500 flex-shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-12 text-slate-500">No performance reports uploaded yet.</p>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 w-full min-w-0"> {/* Added min-w-0 to prevent overflow */}
            {selectedReport ? (
              showExpenseForm ? (
                <ExpenseInputForm
                  report={selectedReport}
                  onExpenseSubmit={handleExpenseSubmit}
                  isLoading={isCalculatingExpenses}
                />
              ) : (
                <div className="space-y-4">
                  {/* Show button to add expenses if not already added OR button to edit expenses if already added */}
                  {isAdmin && (
                    <div className="flex justify-end">
                      {!selectedReport.operational_expenses ? (
                        <Card className="bg-amber-50 border-amber-200 w-full">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-amber-800">Complete Your Analysis</h3>
                              <p className="text-sm text-amber-700">Add operating expenses for complete profitability analysis</p>
                            </div>
                            <Button
                              onClick={() => setShowExpenseForm(true)}
                              className="bg-amber-500 hover:bg-amber-600"
                            >
                              Add Expenses
                            </Button>
                          </CardContent>
                        </Card>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => setShowExpenseForm(true)}
                          className="mb-4"
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit Expenses
                        </Button>
                      )}
                    </div>
                  )}

                  <PerformanceReportDetails report={selectedReport} onClear={() => setSelectedReport(null)} />
                </div>
              )
            ) : (
              !isLoading && <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg text-center p-12"><p className="text-slate-500">Select a report to view detailed analysis.</p></Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
