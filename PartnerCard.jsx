import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  MessageSquare,
  Edit,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PartnerCard({ partner, isSelected, onSelect, onViewDetails, isAdmin }) {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-red-100 text-red-800',
    on_leave: 'bg-yellow-100 text-yellow-800'
  };

  const initials = partner.full_name?.split(' ').map(n => n[0]).join('') || 'P';

  return (
    <Card className={`transition-all duration-200 ${isSelected ? 'ring-2 ring-amber-500 shadow-xl' : 'shadow-lg hover:shadow-xl'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          {isAdmin && onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 mt-1"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          
          <div className="flex items-center gap-4 flex-1 min-w-0 pl-2">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-slate-800 font-bold text-lg">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 truncate">{partner.full_name}</p>
              <p className="text-sm text-slate-500 truncate">{partner.email}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-8 h-8 flex-shrink-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onViewDetails}>
                <Edit className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
          <Badge className={`capitalize ${statusColors[partner.status] || 'bg-slate-100 text-slate-800'}`}>{partner.status}</Badge>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Perf:</span>
            <span className="font-semibold">{partner.performance_score || 0}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}