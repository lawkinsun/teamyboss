import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  Clock, 
  CheckSquare, 
  Wrench, 
  DollarSign,
  Users,
  Zap
} from "lucide-react";

export default function TaskQuickActions({ onQuickAdd }) {
  const quickTasks = [
    {
      title: "Daily Opening Checklist",
      description: "Complete morning opening procedures",
      categories: ["Restaurant"],
      priority: "high",
      frequency: "daily",
      estimated_duration: 30,
      icon: Clock
    },
    {
      title: "Evening Closing Procedures",
      description: "Complete evening closing and security check",
      categories: ["Restaurant"],
      priority: "high",
      frequency: "daily",
      estimated_duration: 45,
      icon: Clock
    },
    {
      title: "Equipment Maintenance",
      description: "Weekly equipment inspection and maintenance",
      categories: ["Restaurant"],
      priority: "medium",
      frequency: "weekly",
      estimated_duration: 90,
      icon: Wrench
    },
    {
      title: "Sales Report",
      description: "Compile and analyze sales data",
      categories: ["Restaurant", "Tech"],
      priority: "medium",
      frequency: "weekly",
      estimated_duration: 60,
      icon: DollarSign
    },
    {
      title: "Staff Meeting",
      description: "Weekly team meeting and updates",
      categories: ["Restaurant", "Event"],
      priority: "medium",
      frequency: "weekly",
      estimated_duration: 120,
      icon: Users
    }
  ];

  const handleQuickAdd = (quickTask) => {
    const taskData = {
      ...quickTask,
      project_names: ["ZIPZIP"], // Default to one project for quick add
      assigned_partners: ["Tim Law"], // Default to one partner
      status: "pending"
    };
    onQuickAdd(taskData);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Zap className="w-4 h-4" />
          Quick Add
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        {quickTasks.map((task, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => handleQuickAdd(task)}
            className="flex items-center gap-3 p-3 cursor-pointer"
          >
            <task.icon className="w-4 h-4 text-slate-500" />
            <div className="flex-1">
              <div className="font-medium text-sm">{task.title}</div>
              <div className="text-xs text-slate-500">{task.description}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}