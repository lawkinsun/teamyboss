
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Plus, CheckSquare, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

const taskCategories = ["Restaurant", "Event", "Construction", "Tech", "Other"];

export default function AddTaskDialog({ open, onOpenChange, onSubmit, users = [], projects = [] }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState([]);
  const [projectNames, setProjectNames] = useState([]); // Corresponds to project_names
  const [assignedPartners, setAssignedPartners] = useState([]); // Corresponds to assigned_partners
  const [priority, setPriority] = useState("medium");
  const [frequency, setFrequency] = useState("one-time");
  const [startDate, setStartDate] = useState(undefined); // Date object for start
  const [endDate, setEndDate] = useState(undefined); // Date object for end
  const [weeklyDays, setWeeklyDays] = useState([]); // Corresponds to weekly_days
  const [estimatedDuration, setEstimatedDuration] = useState(60); // Corresponds to estimated_duration
  const [dueDate, setDueDate] = useState(undefined); // Date object for one-time tasks
  const [status, setStatus] = useState("pending");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategories([]);
    setProjectNames([]);
    setAssignedPartners([]);
    setPriority("medium");
    setFrequency("one-time");
    setStartDate(undefined);
    setEndDate(undefined);
    setWeeklyDays([]);
    setEstimatedDuration(60);
    setDueDate(undefined);
    setStatus("pending");
  };

  const handleMultiSelectChange = (setter, currentArray, value, checked) => {
    setter(
      checked
        ? [...currentArray, value]
        : currentArray.filter(item => item !== value)
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title) {
      alert("Please provide a title for the task.");
      return;
    }

    let cleanedData = {
      title,
      description,
      categories,
      project_names: projectNames, // Ensure correct key name for submission
      assigned_partners: assignedPartners, // Ensure correct key name for submission
      priority,
      frequency,
      estimated_duration: estimatedDuration,
      status,
    };

    if (frequency === 'one-time') {
      cleanedData.due_date = dueDate ? format(dueDate, 'yyyy-MM-dd') : null;
      cleanedData.start_date = undefined; // Clear for one-time
      cleanedData.end_date = undefined;   // Clear for one-time
      cleanedData.weekly_days = undefined; // Clear for one-time
    } else {
      cleanedData.start_date = startDate ? format(startDate, 'yyyy-MM-dd') : null;
      cleanedData.end_date = endDate ? format(endDate, 'yyyy-MM-dd') : null;
      cleanedData.due_date = undefined; // Clear for recurring
      if (frequency === 'weekly') {
        cleanedData.weekly_days = weeklyDays;
      } else {
        cleanedData.weekly_days = undefined; // Clear for daily/monthly/etc.
      }
    }

    onSubmit(cleanedData);
    resetForm();
  };

  const weekdays = [
    { key: 'monday', label: 'Mon' },
    { key: 'tuesday', label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday', label: 'Thu' },
    { key: 'friday', label: 'Fri' },
    { key: 'saturday', label: 'Sat' },
    { key: 'sunday', label: 'Sun' }
  ];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { onOpenChange(isOpen); if (!isOpen) resetForm(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            Add New Task
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              className="h-24"
            />
          </div>

          <div className="space-y-2">
            <Label>Categories</Label>
            <div className="grid grid-cols-3 gap-2 p-2 rounded-md border border-slate-200">
              {taskCategories.map(category => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category}`}
                    checked={categories.includes(category)}
                    onCheckedChange={(checked) => handleMultiSelectChange(setCategories, categories, category, checked)}
                  />
                  <Label htmlFor={`category-${category}`} className="text-sm font-normal">{category}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Projects</Label>
            <div className="grid grid-cols-2 gap-2 p-2 rounded-md border border-slate-200 max-h-32 overflow-y-auto">
              {projects.map(project => (
                <div key={project.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`project-${project.id}`}
                    checked={projectNames.includes(project.name)}
                    onCheckedChange={(checked) => handleMultiSelectChange(setProjectNames, projectNames, project.name, checked)}
                  />
                  <Label htmlFor={`project-${project.id}`} className="text-sm font-normal">{project.name}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assigned Partners</Label>
            <div className="grid grid-cols-2 gap-2 p-2 rounded-md border border-slate-200 max-h-32 overflow-y-auto">
              {users.map(user => (
                <div key={user.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`partner-${user.id}`}
                    checked={assignedPartners.includes(user.full_name)}
                    onCheckedChange={(checked) => handleMultiSelectChange(setAssignedPartners, assignedPartners, user.full_name, checked)}
                  />
                  <Label htmlFor={`partner-${user.id}`} className="text-sm font-normal">{user.full_name}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={frequency}
                onValueChange={(value) => {
                  setFrequency(value);
                  if (value === 'one-time') {
                    setStartDate(undefined);
                    setEndDate(undefined);
                    setWeeklyDays([]);
                    setDueDate(new Date()); // Auto-fill due date to today
                  } else {
                    setDueDate(undefined);
                    setStartDate(new Date()); // Auto-fill start date to today
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-time">One-time</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min="5"
              max="480"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(parseInt(e.target.value) || 0)}
            />
          </div>

          {/* Date fields container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {frequency === 'one-time' ? (
              <div className="space-y-2">
                <Label htmlFor="due-date-picker">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                      disabled={(date) => date < new Date().setHours(0, 0, 0, 0)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="start-date-picker">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        disabled={(date) => date < new Date().setHours(0, 0, 0, 0)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date-picker">End Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        disabled={(date) =>
                          (startDate && date < startDate) ||
                          date < new Date().setHours(0, 0, 0, 0)
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}
          </div>

          {/* Weekly Days Selection */}
          {frequency === 'weekly' && (
            <div className="space-y-2">
              <Label>Days of the Week</Label>
              <div className="grid grid-cols-7 gap-2">
                {weekdays.map(({ key, label }) => (
                  <div key={key} className="text-center">
                    <Checkbox
                      id={`day-${key}`}
                      checked={weeklyDays.includes(key)}
                      onCheckedChange={(checked) => handleMultiSelectChange(setWeeklyDays, weeklyDays, key, checked)}
                    />
                    <Label htmlFor={`day-${key}`} className="block text-xs mt-1">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500">Select which days of the week this task should occur</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-amber-500 hover:bg-amber-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
