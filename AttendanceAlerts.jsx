import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default function AttendanceAlerts({ attendance }) {
  const getTodaysAttendance = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return attendance.filter(a => a.date === today);
  };

  const getLateArrivals = () => {
    return getTodaysAttendance().filter(a => a.status === 'late');
  };

  const getAbsences = () => {
    return getTodaysAttendance().filter(a => a.status === 'absent');
  };

  const todaysAttendance = getTodaysAttendance();
  const lateArrivals = getLateArrivals();
  const absences = getAbsences();

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <Clock className="w-5 h-5" />
          Attendance Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-green-50 border border-green-200">
              <div className="text-lg font-bold text-green-800">
                {todaysAttendance.filter(a => a.status === 'on_time').length}
              </div>
              <div className="text-xs text-green-600">On Time</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-orange-50 border border-orange-200">
              <div className="text-lg font-bold text-orange-800">
                {lateArrivals.length}
              </div>
              <div className="text-xs text-orange-600">Late</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-red-50 border border-red-200">
              <div className="text-lg font-bold text-red-800">
                {absences.length}
              </div>
              <div className="text-xs text-red-600">Absent</div>
            </div>
          </div>

          {/* Alerts */}
          <div className="space-y-2">
            {lateArrivals.map(record => (
              <div key={record.id} className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 border border-orange-200">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-800">{record.partner_name}</p>
                  <p className="text-xs text-orange-600">
                    {record.minutes_late} minutes late at {record.location}
                  </p>
                </div>
              </div>
            ))}

            {absences.map(record => (
              <div key={record.id} className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">{record.partner_name}</p>
                  <p className="text-xs text-red-600">
                    Absent from {record.location}
                  </p>
                </div>
              </div>
            ))}

            {lateArrivals.length === 0 && absences.length === 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <p className="text-sm font-medium text-green-800">
                  No attendance issues today
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}