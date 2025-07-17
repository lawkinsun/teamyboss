import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trash2, Edit } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function PartnerDetailModal({ partner, open, onOpenChange, onUpdate, onDelete, onPermanentDelete, projects = [] }) {
  const { isAdmin } = useAuth(); // Use context to get admin status
  const [isEditing, setIsEditing] = useState(false);
  const [editablePartner, setEditablePartner] = useState(partner);

  useEffect(() => {
    setEditablePartner(partner);
    // Automatically enter edit mode if user is an admin
    if (isAdmin) {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [partner, isAdmin]);

  const handleSave = () => {
    // Construct the update object with only editable fields
    const updateData = {
      full_name: editablePartner.full_name,
      role: editablePartner.role,
      status: editablePartner.status,
      accessible_projects: editablePartner.accessible_projects
    };
    onUpdate(partner.id, updateData);
    onOpenChange(false);
  };
  
  const handleProjectAccessChange = (projectId, checked) => {
    setEditablePartner(prev => {
      const currentProjects = prev.accessible_projects || [];
      if (checked) {
        return { ...prev, accessible_projects: [...currentProjects, projectId] };
      } else {
        return { ...prev, accessible_projects: currentProjects.filter(id => id !== projectId) };
      }
    });
  };

  if (!partner) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="text-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                {partner.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-2xl">{isEditing ? 'Edit Team Member' : partner.full_name}</DialogTitle>
              <DialogDescription>{isEditing ? 'Update roles, permissions, and project access.' : partner.email}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {isEditing ? (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">Full Name</label>
                <Input value={editablePartner.full_name || ''} onChange={e => setEditablePartner({...editablePartner, full_name: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">Email</label>
                <Input value={partner.email} disabled className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">Role</label>
                <Select value={editablePartner.role} onValueChange={value => setEditablePartner({...editablePartner, role: value})}>
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">Status</label>
                <Select value={editablePartner.status} onValueChange={value => setEditablePartner({...editablePartner, status: value})}>
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <label className="text-right pt-2">Project Access</label>
                <ScrollArea className="h-32 w-full rounded-md border p-4 col-span-3">
                    <div className="space-y-2">
                    {projects.map(proj => (
                        <div key={proj.id} className="flex items-center space-x-2">
                        <Checkbox
                            id={proj.id}
                            checked={(editablePartner.accessible_projects || []).includes(proj.name)}
                            onCheckedChange={(checked) => handleProjectAccessChange(proj.name, checked)}
                        />
                        <label htmlFor={proj.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {proj.name}
                        </label>
                        </div>
                    ))}
                    </div>
                </ScrollArea>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                <div><strong className="text-slate-500">Role:</strong> <Badge>{partner.role}</Badge></div>
                <div><strong className="text-slate-500">Status:</strong> <Badge variant={partner.status === 'active' ? 'default' : 'secondary'}>{partner.status}</Badge></div>
                <div><strong className="text-slate-500">Phone:</strong> {partner.phone || 'Not provided'}</div>
                <div><strong className="text-slate-500">Performance Score:</strong> {partner.performance_score || 0}%</div>
              </div>
              <div>
                <strong className="text-slate-500">Accessible Projects:</strong>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(partner.accessible_projects || []).length > 0 ? partner.accessible_projects.map(p => <Badge key={p} variant="outline">{p}</Badge>) : <span className="text-sm text-slate-500">No projects assigned</span>}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <div>
            {isAdmin && (
              <Button variant="destructive" onClick={() => onPermanentDelete(partner.id)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete User
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            {isAdmin && <Button onClick={handleSave}>Save Changes</Button>}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}