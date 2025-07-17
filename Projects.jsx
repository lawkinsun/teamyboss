
import React, { useState, useEffect } from "react";
import { Project } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Briefcase, 
  Plus, 
  Search,
} from "lucide-react";
import ProjectCard from "../components/projects/ProjectCard";
import AddEditProjectDialog from "../components/projects/AddEditProjectDialog";
import { useAuth } from "../components/auth/AuthProvider";


export default function Projects() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const data = await Project.list();
      setProjects(data);
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingProject(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (projectData) => {
    try {
      if (editingProject) {
        await Project.update(editingProject.id, projectData);
      } else {
        await Project.create(projectData);
      }
      setIsDialogOpen(false);
      loadProjects();
    } catch (error) {
      console.error("Error saving project:", error);
      alert("Failed to save project. Please check the console for details.");
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
              Projects Overview
            </h1>
            <p className="text-slate-600 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Manage all business ventures from a single dashboard.
            </p>
          </div>
          {isAdmin && (
            <Button onClick={handleAddNew} className="bg-amber-500 hover:bg-amber-600">
              <Plus className="w-4 h-4 mr-2" />
              Add New Project
            </Button>
          )}
        </div>

        {/* Search */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4 md:p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search projects by name or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {isLoading ? (
            <p>Loading projects...</p>
          ) : (
            filteredProjects.map((project) => (
              project && project.id ? <ProjectCard key={project.id} project={project} onEdit={handleEdit} /> : null
            ))
          )}
        </div>
        {filteredProjects.length === 0 && !isLoading && (
            <Card className="col-span-1 lg:col-span-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg text-center p-12">
                <h3 className="text-lg font-semibold text-slate-800">No projects found.</h3>
                <p className="text-slate-600">Try adjusting your search or add a new project.</p>
            </Card>
        )}
      </div>
      {isAdmin && (
        <AddEditProjectDialog
            project={editingProject}
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
