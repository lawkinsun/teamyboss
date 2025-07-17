
import React, { useState, useEffect } from "react";
import { useAuth } from "../components/auth/AuthProvider";
import { User } from "@/api/entities";
import { Message } from "@/api/entities";
import { Project } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Settings,
  CheckSquare,
  X,
} from "lucide-react";

import PartnerCard from "../components/partners/PartnerCard";
import AddPartnerDialog from "../components/partners/AddPartnerDialog";
import PartnerDetailModal from "../components/partners/PartnerDetailModal";
import BulkEditDialog from "../components/partners/BulkEditDialog";
import MessagePartnerDialog from "../components/partners/MessagePartnerDialog";

export default function Partners() {
  const { currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]); // Keep for potential future use or if other components rely on it
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [filterProject, setFilterProject] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [usersData, messagesData, projectsData] = await Promise.all([
        User.list(),
        Message.list("-created_date", 100),
        Project.list()
      ]);

      // CRITICAL FIX: Show ALL approved users to ALL logged-in users (not just admins)
      const approvedUsers = usersData.filter(u => u.approved === true);
      setUsers(approvedUsers);
      
      setMessages(messagesData); // Still setting messages, even if getUserMessages is removed
      setProjects(projectsData);

    } catch (error) {
      console.error("Error loading team data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (userId, userData) => {
    if (!isAdmin) {
      alert("You don't have permission to perform this action.");
      return;
    }
    try {
      await User.update(userId, userData);
      await loadData();
      setShowDetailModal(false);
      setShowAddDialog(false);
      alert("User updated successfully!");
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user. Please try again.");
    }
  };

  const handleBulkUpdate = async (updateData) => {
    if (!isAdmin) {
      alert("You don't have permission to perform bulk updates.");
      return;
    }
    try {
      await Promise.all(
        selectedUsers.map(userId =>
          User.update(userId, updateData)
        )
      );
      setSelectedUsers([]);
      setShowBulkEditDialog(false);
      await loadData();
      alert("Bulk update completed successfully!");
    } catch (error) {
      console.error("Error bulk updating users:", error);
      alert("Failed to bulk update users: " + error.message);
    }
  };

  const handleDeactivateUser = async (userId) => {
     if (!isAdmin) {
       alert("You don't have permission to deactivate users.");
       return;
     }
     try {
       if (window.confirm("Are you sure you want to set this user to inactive?")) {
         await User.update(userId, { status: 'inactive' });
         await loadData();
         setShowDetailModal(false);
         setSelectedUser(null);
         alert("User deactivated successfully!");
       }
     } catch (error) {
       console.error("Error deactivating user:", error);
       alert("Failed to deactivate user: " + error.message);
     }
  };

  const handleDeleteUser = async (userId) => {
     if (!isAdmin) {
       alert("You don't have permission to delete users.");
       return;
     }
     try {
       if (window.confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")) {
         await User.delete(userId);
         await loadData();
         setShowDetailModal(false);
         setSelectedUser(null);
         alert("User deleted successfully!");
       }
     } catch (error) {
       console.error("Error deleting user:", error);
       alert("Failed to delete user: " + error.message);
     }
  };

  const handleSendMessage = async (messageData) => {
    if (!currentUser) return;
    try {
      await Message.create({
        ...messageData,
        sender_name: currentUser.full_name,
        sender_email: currentUser.email,
        type: "direct"
      });
      setShowMessageDialog(false);
      alert("Message sent successfully!");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message: " + error.message);
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length && filteredUsers.length > 0) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  // REMOVED: getUserMessages function is no longer needed

  const filteredUsers = users.filter(user => {
    const searchName = user.full_name || '';
    const searchEmail = user.email || '';
    const matchesSearch = searchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         searchEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = filterProject === "all" || (user.accessible_projects || []).includes(filterProject);
    const matchesStatus = filterStatus === "all" || user.status === filterStatus;

    return matchesSearch && matchesProject && matchesStatus;
  });

  const getUserStats = () => {
    const active = users.filter(p => p.status === 'active').length;
    const avgPerformance = users.length > 0 ? users.reduce((sum, p) => sum + (p.performance_score || 0), 0) / users.length : 0;

    return { active, avgPerformance: avgPerformance.toFixed(1), totalProjects: projects.length };
  };

  const stats = getUserStats();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <p className="text-slate-600 text-lg">Loading team data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
              Team Management
            </h1>
            <p className="text-slate-600 flex items-center gap-2">
              <Users className="w-4 h-4" />
              View and connect with your team members
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedUsers.length > 0 && isAdmin && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkEditDialog(true)}
                  className="bg-blue-50 hover:bg-blue-100"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Selected ({selectedUsers.length})
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedUsers([])}
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            {isAdmin && (
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-amber-500 hover:bg-amber-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Team Member
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Active Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{stats.active}</div>
              <p className="text-xs text-slate-500">out of {users.length} total</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Selected Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{selectedUsers.length}</div>
              <p className="text-xs text-slate-500">for bulk operations</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Avg Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{stats.avgPerformance}%</div>
              <p className="text-xs text-slate-500">team average</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{stats.totalProjects}</div>
              <p className="text-xs text-slate-500">across the group</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {isAdmin && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm text-slate-600 whitespace-nowrap">Select All</span>
                  </div>
              )}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search team by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md text-sm"
                >
                  <option value="all">All Projects</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.name}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on_leave">On Leave</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredUsers.map((user) => (
            <PartnerCard
              key={user.id}
              partner={user}
              // messageCount={getUserMessages(user.email)} // REMOVED
              isSelected={selectedUsers.includes(user.id)}
              onSelect={isAdmin ? () => handleSelectUser(user.id) : undefined}
              onViewDetails={() => {
                setSelectedUser(user);
                setShowDetailModal(true);
              }}
              isAdmin={isAdmin} // ADDED
            />
          ))}
        </div>

        {filteredUsers.length === 0 && !isLoading && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">No Team Members Found</h3>
              <p className="text-slate-600 mb-4">
                {users.length > 0 ? "Try adjusting your search terms" : "No team members available"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dialogs */}
        {isAdmin && (
          <>
            <AddPartnerDialog
              open={showAddDialog}
              onOpenChange={setShowAddDialog}
              onSubmit={handleUpdateUser}
              projects={projects}
              users={users.filter(u => u.role === 'user' && !u.approved)}
            />

            <BulkEditDialog
              open={showBulkEditDialog}
              onOpenChange={setShowBulkEditDialog}
              onSubmit={handleBulkUpdate}
              selectedCount={selectedUsers.length}
              projects={projects}
            />
          </>
        )}

        {selectedUser && (
          <>
            <PartnerDetailModal
              partner={selectedUser}
              open={showDetailModal}
              onOpenChange={setShowDetailModal}
              onUpdate={handleUpdateUser}
              onDelete={handleDeactivateUser}
              onPermanentDelete={handleDeleteUser}
              isAdmin={isAdmin}
              projects={projects}
            />
            <MessagePartnerDialog
              partner={selectedUser}
              open={showMessageDialog}
              onOpenChange={setShowMessageDialog}
              onSend={handleSendMessage}
              projects={projects}
              currentUser={currentUser}
            />
          </>
        )}
      </div>
    </div>
  );
}
