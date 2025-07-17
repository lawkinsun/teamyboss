import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default function LocationStatusCard({ locations, tasks, salesRecords }) {
  const getLocationTasks = (locationName) => {
    return tasks.filter(t => t.location === locationName || t.location === 'All Locations');
  };

  const getLocationSales = (locationName) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todaysSales = salesRecords.find(s => s.location === locationName && s.date === today);
    return todaysSales?.daily_sales || 0;
  };

  const getLocationStatus = (locationName) => {
    const locationTasks = getLocationTasks(locationName);
    const completedTasks = locationTasks.filter(t => t.status === 'completed').length;
    const totalTasks = locationTasks.length;
    
    if (totalTasks === 0) return 'active';
    return completedTasks / totalTasks > 0.8 ? 'excellent' : 'needs_attention';
  };

  const statusColors = {
    excellent: 'bg-green-100 text-green-800 border-green-200',
    active: 'bg-blue-100 text-blue-800 border-blue-200',
    needs_attention: 'bg-orange-100 text-orange-800 border-orange-200'
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <MapPin className="w-5 h-5" />
          Location Status Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-4">
          {locations.map((location) => {
            const locationTasks = getLocationTasks(location.name);
            const completedTasks = locationTasks.filter(t => t.status === 'completed').length;
            const status = getLocationStatus(location.name);
            const sales = getLocationSales(location.name);

            return (
              <div
                key={location.id}
                className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800 text-sm">{location.name}</h3>
                  <Badge className={`text-xs ${statusColors[status]}`}>
                    {status === 'excellent' ? 'Excellent' : status === 'active' ? 'Active' : 'Needs Attention'}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-slate-600">
                      {completedTasks}/{locationTasks.length} tasks completed
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span className="text-slate-600">
                      ${sales.toLocaleString()} today
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className="text-slate-600">
                      {location.district}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}