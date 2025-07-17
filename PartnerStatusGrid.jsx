import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function PartnerStatusGrid({ partners, attendance }) {
  const getPartnerAttendance = (partnerName) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return attendance.find(a => a.partner_name === partnerName && a.date === today);
  };

  const statusColors = {
    on_time: 'bg-green-100 text-green-800 border-green-200',
    late: 'bg-orange-100 text-orange-800 border-orange-200',
    absent: 'bg-red-100 text-red-800 border-red-200',
    not_scheduled: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <Users className="w-5 h-5" />
          Partner Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {partners.map((partner) => {
            const todayAttendance = getPartnerAttendance(partner.name);
            const status = todayAttendance?.status || 'not_scheduled';

            return (
              <div
                key={partner.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-gradient-to-r from-white to-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-slate-800 font-bold text-sm">
                      {partner.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{partner.name}</p>
                    <p className="text-xs text-slate-500">{partner.primary_location}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${statusColors[status]}`}>
                    {status === 'on_time' ? 'On Time' : 
                     status === 'late' ? 'Late' : 
                     status === 'absent' ? 'Absent' : 'Not Scheduled'}
                  </Badge>
                  {todayAttendance && (
                    <span className="text-xs text-slate-500">
                      {todayAttendance.actual_time || 'N/A'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}