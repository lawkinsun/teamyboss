

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { AuthProvider, useAuth } from "./components/auth/AuthProvider";
import NotificationHandler from './components/messages/NotificationHandler';
import MessageBadge from './components/messages/MessageBadge';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CheckSquare,
  BarChart3,
  FileText, // This icon is already imported and can be reused for "Files & Media"
  MessageSquare,
  UserPlus,
  AlertTriangle,
  LogIn,
  Settings,
  Store // Added Store icon
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { User } from "@/api/entities";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const navigationItems = [
  { title: "Dashboard", url: "/Dashboard", icon: LayoutDashboard },
  { title: "Team", url: "/Partners", icon: Users },
  { title: "Projects", url: "/Projects", icon: Briefcase },
  { title: "Tasks", url: "/Tasks", icon: CheckSquare },
  { title: "Store Visits", url: "/StoreVisits", icon: Store }, // New item added
  { title: "Analytics", url: "/Analytics", icon: BarChart3 },
  { title: "HR Reports", url: "/HRReports", icon: FileText },
  {
    title: "Messages",
    url: "/Messages",
    icon: MessageSquare,
    badge: MessageBadge
  },
  { title: "Files & Media", url: "/Files", icon: FileText },
];

const adminNavItems = [
    { title: "Approvals", url: "/Approvals", icon: UserPlus },
];

// Internal Layout Component that uses the auth context
const LayoutContent = ({ children }) => {
  const location = useLocation();
  const { currentUser, isAdmin, authStatus, refetchUser } = useAuth();

  const handleLogout = async () => {
    try {
      await User.logout();
      window.location.href = createPageUrl('Dashboard'); // Force reload
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <p className="text-slate-600 text-lg">Verifying credentials...</p>
      </div>
    );
  }

  if (authStatus === 'loggedOut' || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-800">Welcome to Restaurant Pro</CardTitle>
            <CardDescription>Your central hub for business operations management.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Please log in to view the dashboard. If you don't have an account, you can request access.</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => User.login()}><LogIn className="w-4 h-4 mr-2" /> Log In</Button>
              <Button variant="outline" asChild><Link to={createPageUrl("ApplyForAccess")}>Request Access</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authStatus === 'pendingApproval') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-800">Access Pending</CardTitle>
            <CardDescription>Your account is awaiting approval from an administrator.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto" />
            <p>Your account for <span className='font-bold'>{currentUser.email}</span> has been created but needs to be approved before you can access the system. Please contact an administrator.</p>
            <Button onClick={handleLogout} variant="outline"><LogIn className="w-4 h-4 mr-2" /> Logout</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // This ensures the main content only renders once the user is logged in and approved.
  return (
    <SidebarProvider>
      <NotificationHandler />
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-slate-100">
        <style>{`
          :root {
            --sidebar-background: #1e293b;
            --sidebar-foreground: #f8fafc;
            --sidebar-primary: #f59e0b;
            --sidebar-primary-foreground: #1e293b;
            --sidebar-accent: #334155;
            --sidebar-accent-foreground: #f8fafc;
            --sidebar-border: #334155;
          }
        `}</style>
        <Sidebar className="border-r-0 shadow-xl bg-slate-800">
          <SidebarHeader className="border-b border-slate-700 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-slate-800" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-100">Restaurant Pro</h2>
                <p className="text-xs text-slate-400">Hong Kong Operations</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild className={`hover:bg-slate-700 hover:text-amber-400 transition-all duration-200 rounded-lg mb-1 ${location.pathname === item.url ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-slate-300'}`}>
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                          {item.badge && <item.badge />}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {isAdmin && (
              <SidebarGroup className="mt-4">
                <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">Admin</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminNavItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild className={`hover:bg-slate-700 hover:text-amber-400 transition-all duration-200 rounded-lg mb-1 ${location.pathname === item.url ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-slate-300'}`}>
                          <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>
          <SidebarFooter className="border-t border-slate-700 p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-slate-800 font-bold text-sm">{currentUser?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-200 text-sm truncate">{currentUser?.full_name || 'Loading...'}</p>
                  <p className="text-xs text-slate-400 truncate">{currentUser?.email || ''}</p>
                </div>
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm" className="w-full bg-slate-700 border-slate-600                       text-slate-300 hover:bg-slate-600 hover:text-white">
                <Settings className="w-4 h-4 mr-2" /> Logout
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
              <h1 className="text-xl font-bold text-slate-800">Restaurant Pro</h1>
            </div>
          </header>
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

// Main Layout Component that wraps everything with AuthProvider
export default function Layout({ children }) {
  return (
    <AuthProvider>
      <LayoutContent>{children}</LayoutContent>
    </AuthProvider>
  );
}

