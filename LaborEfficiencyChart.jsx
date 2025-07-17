import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users } from "lucide-react";

export default function LaborEfficiencyChart({ data, salesData }) {
  const calculateEfficiency = () => {
    const locationData = {};
    
    // Group labor data by location
    data.forEach(schedule => {
      if (!locationData[schedule.location]) {
        locationData[schedule.location] = { 
          location: schedule.location,
          totalLabor: 0,
          totalHours: 0
        };
      }
      
      const hours = calculateShiftHours(schedule.shift_start, schedule.shift_end);
      locationData[schedule.location].totalLabor += hours * (schedule.hourly_rate || 60);
      locationData[schedule.location].totalHours += hours;
    });

    // Add sales data
    salesData.forEach(sale => {
      if (locationData[sale.location]) {
        locationData[sale.location].sales = (locationData[sale.location].sales || 0) + sale.daily_sales;
      }
    });

    // Calculate efficiency
    return Object.values(locationData).map(item => ({
      ...item,
      efficiency: item.sales > 0 ? ((item.sales - item.totalLabor) / item.sales * 100).toFixed(1) : 0,
      name: item.location.replace(' Causeway Bay', '').replace(' Mongkok', '')
    }));
  };

  const calculateShiftHours = (start, end) => {
    if (!start || !end) return 8;
    const startHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);
    return endHour > startHour ? endHour - startHour : (24 - startHour) + endHour;
  };

  const chartData = calculateEfficiency();

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Labor Efficiency by Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [
                name === 'efficiency' ? `${value}%` : `$${value?.toLocaleString()}`,
                name === 'totalLabor' ? 'Labor Cost' : 
                name === 'sales' ? 'Sales' : 'Efficiency'
              ]}
            />
            <Legend />
            <Bar dataKey="sales" fill="#10b981" name="Sales Revenue" />
            <Bar dataKey="totalLabor" fill="#f59e0b" name="Labor Cost" />
            <Bar dataKey="efficiency" fill="#3b82f6" name="Efficiency %" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}