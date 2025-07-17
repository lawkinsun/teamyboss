import React, { useState, useEffect } from "react";
import { useAuth } from "../components/auth/AuthProvider";
import { User } from "@/api/entities";
import { UserApplication } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  UserPlus, 
  Check, 
  X, 
  Clock,
  Mail,
  AlertTriangle,
  LogIn
} from "lucide-react";
import { format } from "date-fns";

export default function Approvals() {
  // Use the central auth context as the single source of truth
  const { currentUser, isAdmin, authStatus } = useAuth();
  
  const [pendingUsers, setPendingUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only load data if the user is a logged-in admin
    if (authStatus === 'loggedIn' && isAdmin) {
      loadData();
    } else if (authStatus !== 'loading') {
      // If not loading and not an admin, stop the loading spinner
      setIsLoading(false);
    }
  }, [authStatus, isAdmin]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allUsers, allApplications] = await Promise.all([
        User.list(),
        UserApplication.list("-created_date")
      ]);

      // Filter users who need approval
      const usersNeedingApproval = allUsers.filter(u => !u.approved);
      setPendingUsers(usersNeedingApproval);
      
      // Filter pending applications
      const pendingApplications = allApplications.filter(app => app.status === 'pending');
      setApplications(pendingApplications);

    } catch (error) {
      console.error("Error loading approval data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await User.logout();
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  // Security gates based on central auth status
  if (authStatus === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <p className="text-slate-600 text-lg">Loading...</p>
      </div>
    );
  }

  if (authStatus === 'loggedOut') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-800">Access Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Please log in to access approvals.</p>
            <Button onClick={() => User.login()}>
              <LogIn className="w-4 h-4 mr-2" />
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // This check now uses the reliable `isAdmin` from the context
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="p-8">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Access Denied</h3>
            <p className="text-slate-600">You don't have permission to access the approvals page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleApproveUser = async (userId) => {
    try {
      await User.update(userId, {
        approved: true,
        approved_by: currentUser.email,
        approval_date: format(new Date(), 'yyyy-MM-dd')
      });
      loadData();
    } catch (error) {
      console.error("Error approving user:", error);
    }
  };

  const handleRejectUser = async (userId) => {
    if (window.confirm("Are you sure you want to reject this user? They will be marked as inactive.")) {
      try {
        await User.update(userId, {
          approved: false,
          status: 'inactive'
        });
        loadData();
      } catch (error) {
        console.error("Error rejecting user:", error);
      }
    }
  };

  const handleApproveApplication = async (applicationId) => {
    try {
      const app = applications.find(a => a.id === applicationId);
      if (app) {
        await UserApplication.update(applicationId, {
          status: 'approved'
        });
        await User.create({
          full_name: app.full_name,
          email: app.email,
          role: 'user', // Default role for new approved users
          approved: true,
          approved_by: currentUser.email,
          approval_date: format(new Date(), 'yyyy-MM-dd'),
          status: 'active'
        });
        loadData();
        alert(`Application approved for ${app.full_name}. They have been added as a user and can now log in.`);
      }
    } catch (error) {
      console.error("Error approving application:", error);
    }
  };

  const handleRejectApplication = async (applicationId) => {
    if (window.confirm("Are you sure you want to reject this application?")) {
      try {
        await UserApplication.update(applicationId, {
          status: 'rejected'
        });
        loadData();
      } catch (error) {
        console.error("Error rejecting application:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
            User Approvals
          </h1>
          <p className="text-slate-600 flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Review and approve new users and access requests
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{pendingUsers.length}</div>
              <p className="text-xs text-slate-500">users need approval</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{applications.length}</div>
              <p className="text-xs text-slate-500">pending applications</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Users */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Users Awaiting Approval</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingUsers.length > 0 ? (
              <div className="space-y-4">
                {pendingUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback className="bg-amber-100 text-amber-700 font-bold">
                          {(user.full_name || user.email).split(' ').map(n=>n[0]).join('').substring(0,2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-slate-800">{user.full_name || 'No name'}</h3>
                        <p className="text-sm text-slate-600">{user.email}</p>
                        <p className="text-xs text-slate-500">
                          Registered: {format(new Date(user.created_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApproveUser(user.id)}
                        className="bg-green-500 hover:bg-green-600"
                        size="sm"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleRejectUser(user.id)}
                        variant="destructive"
                        size="sm"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">No users pending approval.</p>
            )}
          </CardContent>
        </Card>

        {/* Applications */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Access Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-800">{app.full_name}</h3>
                        <p className="text-sm text-slate-600">{app.email}</p>
                        <p className="text-xs text-slate-500">
                          Applied: {format(new Date(app.created_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                        Pending
                      </Badge>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm text-slate-700">{app.reason}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApproveApplication(app.id)}
                        className="bg-green-500 hover:bg-green-600"
                        size="sm"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve & Create User
                      </Button>
                      <Button
                        onClick={() => handleRejectApplication(app.id)}
                        variant="destructive"
                        size="sm"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">No applications pending.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}