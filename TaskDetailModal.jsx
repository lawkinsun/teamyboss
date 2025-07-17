
import React, { useState, useRef, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { UploadFile } from "@/api/integrations";
import {
  CheckSquare,
  Edit,
  Save,
  X,
  Paperclip,
  Send,
  FileText,
  MessageSquare,
  Upload,
  User,
  Clock,
  Briefcase,
  Calendar as CalendarIcon, // Renamed to avoid conflict with Calendar component
  Download,
  Users as UsersIcon,
  Trash2
} from "lucide-react";
import {
  format,
  formatDistanceToNow,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfQuarter,
  isWithinInterval,
  startOfWeek,
  startOfMonth,
  startOfQuarter,
  parseISO,
} from "date-fns";
import { useAuth } from "../auth/AuthProvider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar"; // Calendar component

const getPeriodIdentifier = (date, frequency) => {
  if (!date || !frequency) return null;
  const d = parseISO(date); // Use parseISO for incoming date string
  switch (frequency) {
    case 'daily':
      return format(d, 'yyyy-MM-dd');
    case 'weekly':
      // Using Monday as start of week (1)
      return format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    case 'monthly':
      return format(startOfMonth(d), 'yyyy-MM');
    case 'quarterly':
      // Using yyyy-Q<QuarterNumber> format (e.g., 2023-Q1)
      return format(startOfQuarter(d), 'yyyy-QQQ');
    default:
      return null;
  }
};

const Comment = ({ msg, onUpdate, onDelete, currentUserEmail }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(msg?.content || "");

  const canEdit = msg?.sender_email === currentUserEmail;

  const handleUpdate = () => {
    if (editedContent.trim() !== msg.content && onUpdate) {
      onUpdate(msg.id, editedContent);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this comment?") && onDelete) {
      onDelete(msg.id);
    }
  };

  if (!msg) return null;

  return (
    <div className="flex gap-2 group">
      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold flex-shrink-0">
        {msg.sender_name?.split(' ').map(n=>n[0]).join('').substring(0,2) || 'U'}
      </div>
      <div className="bg-slate-100 p-2 rounded-lg w-full">
        <div className="flex justify-between items-center">
          <p className="font-semibold text-sm">{msg.sender_name || 'Unknown User'}</p>
          {canEdit && !isEditing && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setIsEditing(true)}>
                <Edit className="w-3 h-3"/>
              </Button>
              <Button variant="ghost" size="icon" className="w-6 h-6" onClick={handleDelete}>
                <Trash2 className="w-3 h-3 text-red-500"/>
              </Button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2 mt-1">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="text-sm"
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={handleUpdate}>Save</Button>
            </div>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap">{msg.content || ''}</p>
        )}

        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>
              {msg.created_date ? (() => {
                try {
                  let dateString = msg.created_date;
                  // The parseISO function handles various ISO formats, including those without 'Z'
                  const d = parseISO(dateString); // Use parseISO
                  return formatDistanceToNow(d, { addSuffix: true });
                } catch (e) {
                  return 'Just now';
                }
              })() : 'Just now'}
            </span>
            {msg.edited_at && <span className="italic">(edited)</span>}
        </div>
      </div>
    </div>
  );
};

export default function TaskDetailModal({
  task,
  open,
  onOpenChange,
  onUpdate,
  users = [],
  projects = [],
  files = [],
  messages = [],
  onFileUpload,
  onAddComment,
  onUpdateComment,
  onDeleteComment
}) {
  const { isAdmin, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("details");
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [newComment, setNewComment] = useState("");
  const fileInputRef = useRef(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Sync editedTask with task prop changes
  useEffect(() => {
    if (task) {
      setEditedTask({
        ...task,
        project_names: task.project_names || [],
        assigned_partners: task.assigned_partners || []
      });
    }
  }, [task]);

  const handleSave = () => {
    if (onUpdate && task?.id) {
      // Format dates before saving to ensure consistency
      const submissionData = {
        ...editedTask,
        due_date: editedTask.due_date ? format(new Date(editedTask.due_date), 'yyyy-MM-dd') : null,
        start_date: editedTask.start_date ? format(new Date(editedTask.start_date), 'yyyy-MM-dd') : null,
        end_date: editedTask.end_date ? format(new Date(editedTask.end_date), 'yyyy-MM-dd') : null,
      };
      onUpdate(task.id, submissionData);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (task) {
      setEditedTask({
        ...task,
        project_names: task.project_names || [],
        assigned_partners: task.assigned_partners || []
      });
    }
    setIsEditing(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !onAddComment || !task?.id) return;
    // Pass the full task object to onAddComment so it can determine the period_identifier
    await onAddComment(task, newComment);
    setNewComment("");
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload && task?.id) {
      await onFileUpload(file, task.id);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return '🖼️';
    if (fileType?.includes('pdf')) return '📄';
    if (fileType?.includes('document') || fileType?.includes('word')) return '📝';
    if (fileType?.includes('spreadsheet') || fileType?.includes('excel')) return '📊';
    return '📎';
  };

  const isImageFile = (fileType) => {
    return fileType?.startsWith('image/');
  };

  const FilePreviewModal = ({ file, open, onClose }) => {
    if (!file) return null;

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {file.filename || 'Unknown File'}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {isImageFile(file.file_type) ? (
              <div className="flex justify-center">
                <img
                  src={file.file_url}
                  alt={file.filename || 'Preview'}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) {
                      e.target.nextSibling.style.display = 'block';
                    }
                  }}
                />
                <div className="hidden text-center p-8 text-slate-500">
                  <FileText className="w-16 h-16 mx-auto mb-4" />
                  <p>Unable to preview this image</p>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 bg-slate-50 rounded-lg">
                <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">Preview not available for this file type</p>
                <Button asChild>
                  <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Download File
                  </a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const currentPeriodIdentifier = useMemo(() => {
    if (!task?.isInstance || !task?.instanceDate || !task?.frequency) return null;
    return getPeriodIdentifier(task.instanceDate, task.frequency);
  }, [task?.isInstance, task?.instanceDate, task?.frequency]);

  const periodMessages = useMemo(() => {
    if (!task?.isInstance || !currentPeriodIdentifier) return messages;
    return messages.filter(msg => msg.period_identifier === currentPeriodIdentifier);
  }, [messages, currentPeriodIdentifier, task?.isInstance]);

  const periodFiles = useMemo(() => {
    if (!task?.isInstance || !currentPeriodIdentifier) return files;
    return files.filter(file => file.period_identifier === currentPeriodIdentifier);
  }, [files, currentPeriodIdentifier, task?.isInstance]);

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="flex items-center gap-2 min-w-0 pt-1">
              <CheckSquare className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">Task Details</span>
            </DialogTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isAdmin && (
                <>
                  {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4 mr-2" /> Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCancel}>
                        <X className="w-4 h-4 mr-2" /> Cancel
                      </Button>
                      <Button size="sm" onClick={handleSave} className="bg-amber-500 hover:bg-amber-600">
                        <Save className="w-4 h-4 mr-2" /> Save
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full flex-1 min-h-0 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">
              <FileText className="w-4 h-4 mr-2" /> Details
            </TabsTrigger>
            <TabsTrigger value="comments">
              <MessageSquare className="w-4 h-4 mr-2" /> Comments ({periodMessages.length})
            </TabsTrigger>
            <TabsTrigger value="files">
              <Paperclip className="w-4 h-4 mr-2" /> Files ({periodFiles.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4 pr-2">
            <TabsContent value="details">
              <div className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    {/* Title */}
                    <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-4">
                      <label className="text-right pt-2 md:col-span-1">Title</label>
                      <Input
                        value={editedTask.title || ""}
                        onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                        className="md:col-span-3"
                      />
                    </div>
                    {/* Description */}
                    <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-4">
                      <label className="text-right pt-2 md:col-span-1">Description</label>
                      <Textarea
                        value={editedTask.description || ""}
                        onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                        className="md:col-span-3"
                      />
                    </div>
                    {/* Project */}
                    <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-4">
                      <label className="text-right pt-2 md:col-span-1">Project</label>
                      <div className="md:col-span-3">
                        {projects.map(proj => (
                          <div key={proj.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-proj-${proj.id}`}
                              checked={editedTask.project_names?.includes(proj.name)}
                              onCheckedChange={(checked) => {
                                const currentProjects = editedTask.project_names || [];
                                const newProjects = checked
                                  ? [...currentProjects, proj.name]
                                  : currentProjects.filter(p => p !== proj.name);
                                setEditedTask({ ...editedTask, project_names: newProjects });
                              }}
                            />
                            <label htmlFor={`edit-proj-${proj.id}`} className="text-sm font-medium leading-none">
                              {proj.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Assigned Partners */}
                    <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-4">
                      <label className="text-right pt-2 md:col-span-1">Assigned To</label>
                      <div className="md:col-span-3">
                        {users.map(user => (
                          <div key={user.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-user-${user.id}`}
                              checked={editedTask.assigned_partners?.includes(user.full_name)}
                              onCheckedChange={(checked) => {
                                const currentPartners = editedTask.assigned_partners || [];
                                const newPartners = checked
                                  ? [...currentPartners, user.full_name]
                                  : currentPartners.filter(p => p !== user.full_name);
                                setEditedTask({ ...editedTask, assigned_partners: newPartners });
                              }}
                            />
                            <label htmlFor={`edit-user-${user.id}`} className="text-sm font-medium leading-none">
                              {user.full_name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                      <label className="text-right md:col-span-1">Priority</label>
                      <Select
                        value={editedTask.priority}
                        onValueChange={(value) => setEditedTask({ ...editedTask, priority: value })}
                      >
                        <SelectTrigger className="md:col-span-3">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Frequency */}
                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                      <label className="text-right md:col-span-1">Frequency</label>
                      <Select
                        value={editedTask.frequency}
                        onValueChange={(value) => setEditedTask({ ...editedTask, frequency: value })}
                      >
                        <SelectTrigger className="md:col-span-3">
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
                    {/* Date Pickers */}
                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                      <label className="text-right md:col-span-1">
                        {editedTask.frequency === "one-time" ? "Due Date" : "Start Date"}
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="md:col-span-3 justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {editedTask.frequency === "one-time"
                              ? (editedTask.due_date ? format(new Date(editedTask.due_date), 'PPP') : "Pick a date")
                              : (editedTask.start_date ? format(new Date(editedTask.start_date), 'PPP') : "Pick a date")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={
                              editedTask.frequency === "one-time"
                                ? (editedTask.due_date ? new Date(editedTask.due_date) : null)
                                : (editedTask.start_date ? new Date(editedTask.start_date) : null)
                            }
                            onSelect={(date) => {
                              const field = editedTask.frequency === "one-time" ? "due_date" : "start_date";
                              setEditedTask({ ...editedTask, [field]: date });
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    {editedTask.frequency !== "one-time" && (
                      <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                        <label className="text-right md:col-span-1">End Date</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="md:col-span-3 justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {editedTask.end_date ? format(new Date(editedTask.end_date), 'PPP') : "Pick a date (Optional)"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={editedTask.end_date ? new Date(editedTask.end_date) : null}
                              onSelect={(date) => setEditedTask({ ...editedTask, end_date: date })}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg">{task.title}</h3>
                    <p className="text-slate-600">{task.description || "No description provided."}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-slate-500 mb-2">Projects</h4>
                        <div className="flex flex-wrap gap-2">
                          {task.project_names?.map(p => <Badge key={p} variant="outline">{p}</Badge>) || <span className="text-sm text-slate-500">None</span>}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-500 mb-2">Assigned To</h4>
                        <div className="flex flex-wrap gap-2">
                          {task.assigned_partners?.map(p => <Badge key={p} variant="secondary">{p}</Badge>) || <span className="text-sm text-slate-500">None</span>}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-500 mb-2">Priority</h4>
                        <Badge className={getStatusColor(task.priority)}>{task.priority}</Badge>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-500 mb-2">Frequency</h4>
                        <Badge variant="outline" className="capitalize">{task.frequency?.replace('_', '-')}</Badge>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-500 mb-2">Date</h4>
                        <p className="text-sm">{
                          task.frequency === 'one-time' && task.due_date ? `Due: ${format(parseISO(task.due_date), 'PPP')}` :
                          task.start_date ? `Starts: ${format(parseISO(task.start_date), 'PPP')}` : 'Not set'
                        }</p>
                        {task.frequency !== 'one-time' && task.end_date && (
                          <p className="text-sm">Ends: {format(parseISO(task.end_date), 'PPP')}</p>
                        )}
                        {task.isInstance && (
                           <p className="text-sm font-semibold text-blue-600">This instance: {format(parseISO(task.instanceDate), 'PPP')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="comments">
              <div className="space-y-4">
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {periodMessages.length > 0 ? (
                  periodMessages.map(msg => (
                    <Comment
                      key={msg.id}
                      msg={msg}
                      onUpdate={onUpdateComment}
                      onDelete={onDeleteComment}
                      currentUserEmail={currentUser?.email}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No comments for this period yet</p>
                  </div>
                )}
              </div>
              <div className="relative">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="pr-12"
                />
                <Button size="icon" className="absolute right-2 top-2 h-8 w-8 bg-amber-500 hover:bg-amber-600" onClick={handleAddComment}>
                  <Send className="w-4 h-4"/>
                </Button>
              </div>
              </div>
            </TabsContent>

            <TabsContent value="files">
              <div className="space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {periodFiles.length > 0 ? (
                  periodFiles.map(file => (
                    <div key={file.id} className="group border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-all">
                      <div className="flex items-center justify-between p-3 bg-slate-50">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-lg">{getFileIcon(file.file_type)}</span>
                          <div className="min-w-0 flex-1">
                            <button
                              onClick={() => setPreviewFile(file)}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate block w-full text-left"
                            >
                              {file.filename || 'Unknown File'}
                            </button>
                            <div className="text-xs text-slate-500 mt-1">
                              {file.file_size && `${(file.file_size / 1024).toFixed(1)} KB`}
                              {file.upload_date && ` • ${format(parseISO(file.upload_date), 'MMM d, yyyy')}`}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" asChild>
                          <a href={file.file_url} download={file.filename} title="Download">
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>

                      {isImageFile(file.file_type) && (
                        <div className="p-3 bg-white">
                          <button
                            onClick={() => setPreviewFile(file)}
                            className="w-full rounded-lg overflow:hidden hover:opacity-90 transition-opacity"
                          >
                            <img
                              src={file.file_url}
                              alt={file.filename || 'Preview'}
                              className="w-full h-32 object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = 'block';
                                }
                              }}
                            />
                            <div className="hidden text-center py-8 text-slate-400">
                              <FileText className="w-8 h-8 mx-auto mb-2" />
                              <p className="text-xs">Preview unavailable</p>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No files uploaded for this period</p>
                  </div>
                )}
              </div>

              <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" /> Upload New File
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <FilePreviewModal
          file={previewFile}
          open={!!previewFile}
          onClose={() => { setPreviewFile(null); setShowPreview(false); }}
        />
      </DialogContent>
    </Dialog>
  );
}
