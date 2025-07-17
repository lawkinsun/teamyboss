import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Users } from "lucide-react";

export default function BulkEditDialog({ open, onOpenChange, onSubmit, selectedCount, projects }) {
  const [updateData, setUpdateData] = useState({
    status: "",
    access_level: "",
    accessible_projects: [],
    permissions: [],
    role: ""
  });

  const [fieldsToUpdate, setFieldsToUpdate] = useState({
    status: false,
    access_level: false,
    accessible_projects: false,
    permissions: false,
    role: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Only include fields that are marked for update
    const dataToUpdate = {};
    Object.keys(fieldsToUpdate).forEach(field => {
      if (fieldsToUpdate[field] && updateData[field] !== "") {
        dataToUpdate[field] = updateData[field];
      }
    });

    onSubmit(dataToUpdate);
    
    // Reset form
    setUpdateData({
      status: "",
      access_level: "",
      accessible_projects: [],
      permissions: [],
      role: ""
    });
    setFieldsToUpdate({
      status: false,
      access_level: false,
      accessible_projects: false,
      permissions: false,
      role: false
    });
  };

  const handleFieldToggle = (field, checked) => {
    setFieldsToUpdate(prev => ({ ...prev, [field]: checked }));
  };

  const handleProjectAccessChange = (project, checked) => {
    setUpdateData(prev => ({
      ...prev,
      accessible_projects: checked
        ? [...prev.accessible_projects, project]
        : prev.accessible_projects.filter(p => p !== project)
    }));
  };

  const handlePermissionChange = (permission, checked) => {
    setUpdateData(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permission]
        : prev.permissions.filter(p => p !== permission)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Bulk Edit Partners ({selectedCount} selected)
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status Update */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="update-status"
                checked={fieldsToUpdate.status}
                onCheckedChange={(checked) => handleFieldToggle('status', checked)}
              />
              <Label htmlFor="update-status" className="text-sm font-medium">Update Status</Label>
            </div>
            {fieldsToUpdate.status && (
              <Select value={updateData.status} onValueChange={(value) => setUpdateData({...updateData, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Role Update */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="update-role"
                checked={fieldsToUpdate.role}
                onCheckedChange={(checked) => handleFieldToggle('role', checked)}
              />
              <Label htmlFor="update-role" className="text-sm font-medium">Update Role</Label>
            </div>
            {fieldsToUpdate.role && (
              <Select value={updateData.role} onValueChange={(value) => setUpdateData({...updateData, role: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ultimate Admin">Ultimate Admin</SelectItem>
                  <SelectItem value="Managing Partner">Managing Partner</SelectItem>
                  <SelectItem value="Operations Partner">Operations Partner</SelectItem>
                  <SelectItem value="Finance Partner">Finance Partner</SelectItem>
                  <SelectItem value="Marketing Partner">Marketing Partner</SelectItem>
                  <SelectItem value="Project Lead">Project Lead</SelectItem>
                  <SelectItem value="Shop Partner">Shop Partner</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Access Level Update */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="update-access-level"
                checked={fieldsToUpdate.access_level}
                onCheckedChange={(checked) => handleFieldToggle('access_level', checked)}
              />
              <Label htmlFor="update-access-level" className="text-sm font-medium">Update Access Level</Label>
            </div>
            {fieldsToUpdate.access_level && (
              <Select value={updateData.access_level} onValueChange={(value) => setUpdateData({...updateData, access_level: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select access level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_access">Full Access</SelectItem>
                  <SelectItem value="project_specific">Project Specific</SelectItem>
                  <SelectItem value="view_only">View Only</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Project Access Update */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="update-projects"
                checked={fieldsToUpdate.accessible_projects}
                onCheckedChange={(checked) => handleFieldToggle('accessible_projects', checked)}
              />
              <Label htmlFor="update-projects" className="text-sm font-medium">Update Project Access</Label>
            </div>
            {fieldsToUpdate.accessible_projects && (
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                {projects?.map(project => (
                  <div key={project.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`bulk-project-${project.id}`}
                      checked={updateData.accessible_projects.includes(project.name)}
                      onCheckedChange={(checked) => handleProjectAccessChange(project.name, checked)}
                    />
                    <Label htmlFor={`bulk-project-${project.id}`} className="text-sm">{project.name}</Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Permissions Update */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="update-permissions"
                checked={fieldsToUpdate.permissions}
                onCheckedChange={(checked) => handleFieldToggle('permissions', checked)}
              />
              <Label htmlFor="update-permissions" className="text-sm font-medium">Update Permissions</Label>
            </div>
            {fieldsToUpdate.permissions && (
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                {[
                  { value: "all_projects", label: "All Projects Access" },
                  { value: "sales_management", label: "Sales Management" },
                  { value: "staff_management", label: "Staff Management" },
                  { value: "maintenance", label: "Maintenance" },
                  { value: "analytics", label: "Analytics" },
                  { value: "partner_management", label: "Partner Management" },
                  { value: "task_management", label: "Task Management" },
                  { value: "report_upload", label: "Report Upload" }
                ].map(permission => (
                  <div key={permission.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`bulk-${permission.value}`}
                      checked={updateData.permissions.includes(permission.value)}
                      onCheckedChange={(checked) => handlePermissionChange(permission.value, checked)}
                    />
                    <Label htmlFor={`bulk-${permission.value}`} className="text-sm">{permission.label}</Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-amber-500 hover:bg-amber-600">
              <Users className="w-4 h-4 mr-2" />
              Update {selectedCount} Partners
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}