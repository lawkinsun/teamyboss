import React, { useState, useEffect } from "react";
import { useAuth } from "../components/auth/AuthProvider";
import { File } from "@/api/entities";
import { Message } from "@/api/entities";
import { Task } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Image,
  Video,
  Download,
  ExternalLink,
  Search,
  Filter,
  Calendar,
  User,
  MessageSquare,
  CheckSquare,
  Paperclip
} from "lucide-react";
import { format } from "date-fns";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

const getFileIcon = (fileType) => {
  if (fileType?.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />;
  if (fileType?.startsWith('video/')) return <Video className="w-5 h-5 text-purple-500" />;
  return <FileText className="w-5 h-5 text-slate-500" />;
};

const getFileSize = (bytes) => {
  if (!bytes) return 'Unknown size';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

const FileCard = ({ file, source, onView, onDownload }) => {
  const isImage = file.file_type?.startsWith('image/');
  
  return (
    <Card className="bg-white hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onView(file)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {getFileIcon(file.file_type)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-slate-800 truncate">{file.filename}</h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <User className="w-3 h-3" />
              <span>{file.uploaded_by}</span>
              <Calendar className="w-3 h-3 ml-2" />
              <span>{format(new Date(file.created_date), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {source.type === 'message' ? (
                  <><MessageSquare className="w-3 h-3 mr-1" /> Message</>
                ) : (
                  <><CheckSquare className="w-3 h-3 mr-1" /> Task</>
                )}
              </Badge>
              <span className="text-xs text-slate-400">{getFileSize(file.file_size)}</span>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); onDownload(file); }}
              className="h-8 w-8"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); onView(file); }}
              className="h-8 w-8"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {isImage && (
          <div className="mt-3">
            <img
              src={file.file_url}
              alt={file.filename}
              className="w-full h-32 object-cover rounded-lg"
              loading="lazy"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function Files() {
  const { currentUser } = useAuth();
  const [files, setFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [filesData, messagesData, tasksData] = await Promise.all([
        File.list("-created_date"),
        Message.list("-created_date"),
        Task.list("-created_date")
      ]);
      
      setFiles(filesData);
      setMessages(messagesData);
      setTasks(tasksData);
    } catch (error) {
      console.error("Error loading files data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAllFilesWithSource = () => {
    const allFiles = [];
    
    // Files from File entity (task attachments)
    files.forEach(file => {
      const task = tasks.find(t => t.id === file.task_id);
      allFiles.push({
        ...file,
        source: {
          type: 'task',
          name: task?.title || 'Unknown Task',
          id: file.task_id
        }
      });
    });

    // Files from Messages (message attachments)
    messages.forEach(message => {
      if (message.attachment_url) {
        allFiles.push({
          id: `msg_${message.id}`,
          filename: message.attachment_name || 'Unknown file',
          file_url: message.attachment_url,
          file_type: message.attachment_type,
          file_size: message.attachment_size,
          uploaded_by: message.sender_email,
          created_date: message.created_date,
          source: {
            type: 'message',
            name: message.group_name || 'Direct Message',
            id: message.id
          }
        });
      }
    });

    return allFiles.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  };

  const filteredFiles = getAllFilesWithSource().filter(file => {
    const matchesSearch = file.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.uploaded_by?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || 
                       (filterType === "image" && file.file_type?.startsWith('image/')) ||
                       (filterType === "video" && file.file_type?.startsWith('video/')) ||
                       (filterType === "document" && !file.file_type?.startsWith('image/') && !file.file_type?.startsWith('video/'));
    
    const matchesSource = filterSource === "all" || file.source.type === filterSource;

    return matchesSearch && matchesType && matchesSource;
  });

  const handleViewFile = (file) => {
    window.open(file.file_url, '_blank');
  };

  const handleDownloadFile = (file) => {
    const a = document.createElement('a');
    a.href = file.file_url;
    a.download = file.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getStats = () => {
    const allFiles = getAllFilesWithSource();
    return {
      total: allFiles.length,
      images: allFiles.filter(f => f.file_type?.startsWith('image/')).length,
      videos: allFiles.filter(f => f.file_type?.startsWith('video/')).length,
      documents: allFiles.filter(f => !f.file_type?.startsWith('image/') && !f.file_type?.startsWith('video/')).length
    };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <p className="text-slate-600 text-lg">Loading files...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
            Files & Media Center
          </h1>
          <p className="text-slate-600 flex items-center gap-2">
            <Paperclip className="w-4 h-4" />
            All files uploaded across messages and tasks
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
              <div className="text-sm text-slate-600">Total Files</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.images}</div>
              <div className="text-sm text-slate-600">Images</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.videos}</div>
              <div className="text-sm text-slate-600">Videos</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-slate-600">{stats.documents}</div>
              <div className="text-sm text-slate-600">Documents</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search files by name or uploader..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="File Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="image">Images</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                    <SelectItem value="document">Documents</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterSource} onValueChange={setFilterSource}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="message">Messages</SelectItem>
                    <SelectItem value="task">Tasks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Files Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFiles.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              source={file.source}
              onView={handleViewFile}
              onDownload={handleDownloadFile}
            />
          ))}
        </div>

        {filteredFiles.length === 0 && !isLoading && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Paperclip className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">No Files Found</h3>
              <p className="text-slate-600">
                {searchTerm || filterType !== 'all' || filterSource !== 'all' 
                  ? "Try adjusting your search terms or filters" 
                  : "No files have been uploaded yet"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}