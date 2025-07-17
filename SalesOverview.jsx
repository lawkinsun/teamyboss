import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign } from "lucide-react";
import { format } from "date-fns";

export default function SalesOverview({ salesRecords }) {
  const getTodaysSales = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return salesRecords
      .filter(s => s.date === today)
      .reduce((sum, s) => sum + (s.daily_sales || 0), 0);
  };

  const getWeeklyAverage = () => {
    if (salesRecords.length === 0) return 0;
    const totalSales = salesRecords.reduce((sum, s) => sum + (s.daily_sales || 0), 0);
    return totalSales / salesRecords.length;
  };

  const getTopLocation = () => {
    const locationSales = {};
    salesRecords.forEach(record => {
      locationSales[record.location] = (locationSales[record.location] || 0) + record.daily_sales;
    });
    
    return Object.entries(locationSales).sort(([,a], [,b]) => b - a)[0] || ['N/A', 0];
  };

  const [topLocation, topSales] = getTopLocation();

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <TrendingUp className="w-5 h-5" />
          Sales Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Today's Total</span>
            </div>
            <p className="text-2xl font-bold text-green-800">
              ${getTodaysSales().toLocaleString()}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Daily Average</span>
            </div>
            <p className="text-xl font-bold text-blue-800">
              ${getWeeklyAverage().toLocaleString()}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Top Location</span>
            </div>
            <p className="text-sm font-bold text-purple-800">
              {topLocation.replace(' Causeway Bay', '').replace(' Mongkok', '')}
            </p>
            <p className="text-xs text-purple-600">
              ${topSales.toLocaleString()} total
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}