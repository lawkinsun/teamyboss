import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { format } from "date-fns";

export default function ReportExport({ salesData, laborData, selectedPeriod }) {
  const exportToCSV = () => {
    const csvData = [];
    
    // Add headers
    csvData.push(['Date', 'Location', 'Sales', 'Labor Cost', 'Efficiency %']);
    
    // Process data
    const locations = [...new Set(salesData.map(s => s.location))];
    const dates = [...new Set(salesData.map(s => s.date))].sort();
    
    dates.forEach(date => {
      locations.forEach(location => {
        const sale = salesData.find(s => s.date === date && s.location === location);
        const labor = laborData.filter(l => l.date === date && l.location === location);
        
        const laborCost = labor.reduce((sum, l) => {
          const hours = calculateShiftHours(l.shift_start, l.shift_end);
          return sum + (hours * (l.hourly_rate || 60));
        }, 0);
        
        const efficiency = sale?.daily_sales > 0 ? 
          ((sale.daily_sales - laborCost) / sale.daily_sales * 100).toFixed(1) : 0;
        
        csvData.push([
          date,
          location,
          sale?.daily_sales || 0,
          laborCost,
          efficiency
        ]);
      });
    });
    
    // Create CSV content
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `restaurant-performance-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const calculateShiftHours = (start, end) => {
    if (!start || !end) return 8;
    const startHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);
    return endHour > startHour ? endHour - startHour : (24 - startHour) + endHour;
  };

  return (
    <Button 
      onClick={exportToCSV}
      variant="outline"
      className="gap-2"
    >
      <Download className="w-4 h-4" />
      Export Report
    </Button>
  );
}