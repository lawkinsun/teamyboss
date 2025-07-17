import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function AddPartnerDialog({ open, onOpenChange, onSubmit, projects, users }) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [partnerData, setPartnerData] = useState({
    role: "User",
    access_level: "project_specific",
    accessible_projects: [],
    status: "active",
    performance_score: 80,
  });

  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setSelectedUserId("");
      setPartnerData({
        role: "User",
        access_level: "project_specific",
        accessible_projects: [],
        status: "active",
        performance_score: 80,
      });
    }
  }, [open]);

  const handleSubmit = () => {
    if (!selectedUserId) {
      alert("Please select a user to onboard.");
      return;
    }
    onSubmit(selectedUserId, partnerData);
  };
  
  const handleProjectToggle = (projectName) => {
    const currentProjects = partnerData.accessible_projects || [];
    if (currentProjects.includes(projectName)) {
      setPartnerData({
        ...partnerData,
        accessible_projects: currentProjects.filter(p => p !== projectName),
      });
    } else {
      setPartnerData({
        ...partnerData,
        accessible_projects: [...currentProjects, projectName],
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Onboard Team Member</DialogTitle>
          <DialogDescription>
            Select a user who has been invited to the system and assign them roles and project access.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="user-select" className="text-right">User</Label>
            <Select onValueChange={setSelectedUserId} value={selectedUserId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select an invited user" />
              </SelectTrigger>
              <SelectContent>
                {users && users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">Role</Label>
            <Select onValueChange={(value) => setPartnerData({ ...partnerData, role: value })} defaultValue="User">
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ultimate Admin">Ultimate Admin</SelectItem>
                <SelectItem value="Managing Partner">Managing Partner</SelectItem>
                <SelectItem value="Operations Partner">Operations Partner</SelectItem>
                <SelectItem value="Finance Partner">Finance Partner</SelectItem>
                <SelectItem value="Marketing Partner">Marketing Partner</SelectItem>
                <SelectItem value="Project Lead">Project Lead</SelectItem>
                <SelectItem value="Shop Partner">Shop Partner</SelectItem>
                <SelectItem value="User">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="access-level" className="text-right">Access Level</Label>
            <Select onValueChange={(value) => setPartnerData({ ...partnerData, access_level: value })} defaultValue="project_specific">
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select access level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full_access">Full Access</SelectItem>
                <SelectItem value="project_specific">Project Specific</SelectItem>
                <SelectItem value="view_only">View Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Projects</Label>
            <div className="col-span-3 space-y-2">
                {projects.map(project => (
                    <div key={project.id} className="flex items-center space-x-2">
                        <Checkbox 
                            id={`project-${project.id}`}
                            checked={partnerData.accessible_projects?.includes(project.name)}
                            onCheckedChange={() => handleProjectToggle(project.name)}
                        />
                        <Label htmlFor={`project-${project.id}`}>{project.name}</Label>
                    </div>
                ))}
            </div>
          </div>
          
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit}>Onboard User</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}