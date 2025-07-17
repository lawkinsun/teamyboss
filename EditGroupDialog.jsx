import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2 } from 'lucide-react';

export default function EditGroupDialog({
  open,
  onOpenChange,
  group,
  allUsers,
  onUpdate,
  onDelete,
}) {
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);

  useEffect(() => {
    if (group) {
      setGroupName(group.name || '');
      setSelectedMembers(group.members || []);
    }
  }, [group]);

  const handleMemberToggle = (email, checked) => {
    if (checked) {
      setSelectedMembers((prev) => [...prev, email]);
    } else {
      setSelectedMembers((prev) => prev.filter((m) => m !== email));
    }
  };

  const handleSaveChanges = () => {
    if (groupName.trim() && selectedMembers.length > 0) {
      onUpdate({
        originalName: group.name,
        newName: groupName,
        newMembers: selectedMembers,
      });
      onOpenChange(false);
    } else {
      alert('Group name cannot be empty and must have at least one member.');
    }
  };

  const handleDeleteGroup = () => {
    if (window.confirm(`Are you sure you want to delete the group "${group.name}"? This action cannot be undone.`)) {
      onDelete(group.name);
      onOpenChange(false);
    }
  };

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Group: {group.name}</DialogTitle>
          <DialogDescription>
            Rename the group or change its members.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Members ({selectedMembers.length})</Label>
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-2">
              {allUsers.map((user) => (
                <div key={user.email} className="flex items-center gap-2">
                  <Checkbox
                    id={`member-${user.email}`}
                    checked={selectedMembers.includes(user.email)}
                    onCheckedChange={(checked) => handleMemberToggle(user.email, checked)}
                  />
                  <Label htmlFor={`member-${user.email}`} className="font-normal">
                    {user.full_name || user.email}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between">
            <Button
              variant="destructive"
              onClick={handleDeleteGroup}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Group
            </Button>
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                </Button>
                <Button onClick={handleSaveChanges} className="bg-amber-500 hover:bg-amber-600">
                    Save Changes
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}