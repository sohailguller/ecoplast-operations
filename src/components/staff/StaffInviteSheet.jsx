import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tantml:react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export default function StaffInviteSheet({ open, onOpenChange }) {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    staff_role: 'workshop',
    role: 'user',
  });

  const queryClient = useQueryClient();

  const inviteMutation = useMutation({
    mutationFn: async (data) => {
      // Invite user with email and role
      await base44.users.inviteUser(data.email, data.role);
      
      // Update user profile with additional details
      // The user will exist after invitation, we need to update their profile
      const users = await base44.entities.User.filter({ email: data.email });
      if (users.length > 0) {
        await base44.entities.User.update(users[0].id, {
          phone: data.phone,
          staff_role: data.staff_role,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onOpenChange(false);
      setFormData({
        email: '',
        full_name: '',
        phone: '',
        staff_role: 'workshop',
        role: 'user',
      });
      alert('Staff member invited successfully! They will receive an email to set up their account.');
    },
    onError: (error) => {
      alert('Failed to invite staff member: ' + error.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.email) {
      alert('Please enter email address');
      return;
    }
    inviteMutation.mutate(formData);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Invite Staff Member</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          {/* Email */}
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="staff@example.com"
              className="mt-1.5"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              An invitation email will be sent to this address
            </p>
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="07XX XXX XXX"
              className="mt-1.5"
            />
          </div>

          {/* Department/Role */}
          <div>
            <Label>Department</Label>
            <Select 
              value={formData.staff_role}
              onValueChange={(value) => setFormData(prev => ({ ...prev, staff_role: value }))}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="collection">Collection</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Access Level */}
          <div>
            <Label>Access Level</Label>
            <Select 
              value={formData.role}
              onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Staff (Standard Access)</SelectItem>
                <SelectItem value="admin">Admin (Full Access)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.role === 'admin' 
                ? 'Can manage all operations and settings'
                : 'Can log tasks, production, and collections'}
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={inviteMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gray-900 hover:bg-gray-800"
              disabled={inviteMutation.isPending}
            >
              {inviteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}