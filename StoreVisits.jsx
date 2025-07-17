
import React, { useState, useEffect } from "react";
import { useAuth } from "../components/auth/AuthProvider";
import { StoreVisit } from "@/api/entities";
import { Task } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Store,
  Plus,
  Search,
  Calendar,
  Star,
  Camera,
  MapPin,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Edit, // Added Edit icon
} from "lucide-react";
import { format } from "date-fns";

import StoreVisitCard from "../components/visits/StoreVisitCard";
import AddVisitDialog from "../components/visits/AddVisitDialog";
import VisitDetailModal from "../components/visits/VisitDetailModal";
import VisitAnalytics from "../components/visits/VisitAnalytics";

export default function StoreVisits() {
  const { currentUser, isAdmin } = useAuth();
  const [visits, setVisits] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [editingVisit, setEditingVisit] = useState(null); // New state for editing
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterLocation, setFilterLocation] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [visitsData, tasksData] = await Promise.all([
        StoreVisit.list("-visit_date"),
        Task.list("-created_date")
      ]);
      setVisits(visitsData);
      setTasks(tasksData);
    } catch (error) {
      console.error("Error loading store visits:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to calculate overall score
  const calculateOverallScore = (visitData) => {
    const cleanlinessAvg = (
      (visitData.bar_cleanliness_score || 0) +
      (visitData.kitchen_cleanliness_score || 0) +
      (visitData.floor_cleanliness_score || 0)
    ) / 3;

    const completionScore = (visitData.tasks_completed?.length || 0) * 2; // Max 10 points for all 5 tasks (assuming 5 tasks total)
    return Math.round(((cleanlinessAvg + completionScore) / 2) * 10) / 10;
  };

  // Unified function for adding and updating visits
  const handleSaveVisit = async (visitData) => { // visitData now contains id if it's an update
    try {
      const visitWithScore = {
        ...visitData,
        overall_score: calculateOverallScore(visitData),
      };

      if (visitData.id) { // Check if visitData contains an ID, indicating an update
        // Update existing visit
        await StoreVisit.update(visitData.id, visitWithScore);
      } else {
        // Create new visit
        const newVisit = await StoreVisit.create({
          ...visitWithScore,
          evaluator_name: currentUser?.full_name || "Unknown",
          evaluator_email: currentUser?.email || "unknown@email.com"
        });

        // Create follow-up tasks for low scores (only for new visits)
        const actionItems = [];
        if (visitData.bar_cleanliness_score < 7) {
          const task = await Task.create({
            title: `Improve Bar Cleanliness - ${visitData.location}`,
            description: `Bar cleanliness scored ${visitData.bar_cleanliness_score}/10 during visit on ${visitData.visit_date}. Requires immediate attention.`,
            priority: "high",
            project_names: [(visitData.location || "").includes("ZIPZIP") ? "ZIPZIP Causeway Bay" :
                           (visitData.location || "").includes("OLD BOOK") ? "THE OLD BOOK STORE Causeway Bay" :
                           "NO MONEY SO LONELY Mongkok"],
            frequency: "one-time",
            status: "pending"
          });
          actionItems.push(task.id);
        }

        if (visitData.kitchen_cleanliness_score < 7) {
          const task = await Task.create({
            title: `Improve Kitchen Cleanliness - ${visitData.location}`,
            description: `Kitchen cleanliness scored ${visitData.kitchen_cleanliness_score}/10 during visit on ${visitData.visit_date}. Requires immediate attention.`,
            priority: "high",
            project_names: [(visitData.location || "").includes("ZIPZIP") ? "ZIPZIP Causeway Bay" :
                           (visitData.location || "").includes("OLD BOOK") ? "THE OLD BOOK STORE Causeway Bay" :
                           "NO MONEY SO LONELY Mongkok"],
            frequency: "one-time",
            status: "pending"
          });
          actionItems.push(task.id);
        }

        if (actionItems.length > 0) {
          await StoreVisit.update(newVisit.id, { action_items_created: actionItems });
        }
      }

      loadData();
      setShowAddDialog(false);
      setEditingVisit(null); // Clear editing visit state
    } catch (error) {
      console.error("Error saving visit:", error);
      alert("Failed to save visit. Please try again.");
    }
  };

  const handleEditClick = (visit) => {
    setEditingVisit(visit);
    setShowAddDialog(true);
  };

  const filteredVisits = visits.filter(visit => {
    const matchesSearch = visit.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         visit.evaluator_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         visit.overall_notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = filterLocation === "all" || visit.location === filterLocation;
    return matchesSearch && matchesLocation;
  });

  const getVisitStats = () => {
    const totalVisits = visits.length;
    const avgScore = visits.length > 0 ?
      visits.reduce((sum, v) => sum + (v.overall_score || 0), 0) / visits.length : 0;
    const thisMonthVisits = visits.filter(v => {
      const visitDate = new Date(v.visit_date);
      const now = new Date();
      return visitDate.getMonth() === now.getMonth() &&
             visitDate.getFullYear() === now.getFullYear();
    }).length;
    const lowScoreVisits = visits.filter(v => (v.overall_score || 0) < 7).length;

    return { totalVisits, avgScore: avgScore.toFixed(1), thisMonthVisits, lowScoreVisits };
  };

  const stats = getVisitStats();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <p className="text-slate-600 text-lg">Loading store visits...</p>
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
              Store Visits & Evaluations
            </h1>
            <p className="text-slate-600 flex items-center gap-2">
              <Store className="w-4 h-4" />
              Quality assurance and operational oversight across all locations
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingVisit(null); // Ensure no visit is in editing mode when adding new
              setShowAddDialog(true);
            }}
            className="bg-amber-500 hover:bg-amber-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Store Visit
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Total Visits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{stats.totalVisits}</div>
              <p className="text-xs text-slate-500">all time</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.avgScore}</div>
              <p className="text-xs text-slate-500">out of 10</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.thisMonthVisits}</div>
              <p className="text-xs text-slate-500">visits completed</p>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border border-red-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">{stats.lowScoreVisits}</div>
              <p className="text-xs text-red-600">visits scored below 7.0</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics */}
        <VisitAnalytics visits={visits} />

        {/* Search and Filters */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search visits by location, evaluator, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="all">All Locations</option>
                <option value="ZIPZIP Causeway Bay">ZIPZIP Causeway Bay</option>
                <option value="THE OLD BOOK STORE Causeway Bay">THE OLD BOOK STORE Causeway Bay</option>
                <option value="NO MONEY SO LONELY Mongkok">NO MONEY SO LONELY Mongkok</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Visits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredVisits.map((visit) => (
            <StoreVisitCard
              key={visit.id}
              visit={visit}
              onViewDetails={() => {
                setSelectedVisit(visit);
                setShowDetailModal(true);
              }}
              onEdit={() => handleEditClick(visit)} // Pass edit handler
              isAdmin={isAdmin} // Pass isAdmin for conditional rendering of edit button
            />
          ))}
        </div>

        {filteredVisits.length === 0 && !isLoading && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Store className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">No Store Visits Found</h3>
              <p className="text-slate-600 mb-4">
                {visits.length > 0 ? "Try adjusting your search terms" : "Start by conducting your first store visit evaluation"}
              </p>
              <Button
                onClick={() => {
                  setEditingVisit(null);
                  setShowAddDialog(true);
                }}
                className="bg-amber-500 hover:bg-amber-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Store Visit
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Dialogs */}
        <AddVisitDialog
          open={showAddDialog}
          onOpenChange={(isOpen) => {
            setShowAddDialog(isOpen);
            if (!isOpen) setEditingVisit(null); // Clear editingVisit when dialog closes
          }}
          onSubmit={handleSaveVisit} // Use the unified save handler
          visitToEdit={editingVisit} // Pass the visit being edited
        />

        {selectedVisit && (
          <VisitDetailModal
            visit={selectedVisit}
            open={showDetailModal}
            onOpenChange={(isOpen) => {
              if (!isOpen) setSelectedVisit(null);
              setShowDetailModal(isOpen);
            }}
            tasks={tasks.filter(t =>
              selectedVisit.action_items_created?.includes(t.id)
            )}
          />
        )}
      </div>
    </div>
  );
}
