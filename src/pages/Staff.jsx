import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Users, ClipboardList, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/ui/PageHeader';
import SectionHeader from '@/components/ui/SectionHeader';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import StaffTaskFormSheet from '../components/staff/StaffTaskFormSheet';

export default function Staff() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);

  const queryClient = useQueryClient();

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.StaffTask.list('-created_date', 50),
  });

  const staffUsers = users.filter(u => u.staff_role || u.role === 'admin');

  const filteredUsers = staffUsers.filter(user =>
    !searchQuery ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');

  return (
    <div className="pb-24 lg:pb-8">
      <PageHeader 
        title="Staff"
        subtitle={`${staffUsers.length} team members`}
        action="Assign Task"
        actionIcon={Plus}
        onAction={() => setShowTaskForm(true)}
      />

      <div className="p-4 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200 rounded-xl h-11"
          />
        </div>

        {/* Active Tasks Summary */}
        {pendingTasks.length > 0 && (
          <div>
            <SectionHeader 
              title="Active Tasks" 
              action="View All"
              onAction={() => {}}
            />
            <Card className="bg-white border-0 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-100">
                {pendingTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{task.title}</p>
                          <StatusBadge status={task.priority} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {task.assigned_to_name} • {task.department}
                        </p>
                      </div>
                      <StatusBadge status={task.status} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Staff List */}
        <div>
          <SectionHeader title="Team Members" />
          {loadingUsers ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Card key={i} className="p-4 bg-white border-0 shadow-sm animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </Card>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No staff members"
              description="Invite team members to get started"
            />
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => {
                const userTasks = tasks.filter(t => t.assigned_to === user.email);
                const pendingCount = userTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
                
                return (
                  <Card 
                    key={user.id} 
                    className="p-4 bg-white border-0 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                          <p className="text-xs text-gray-500">
                            {user.staff_role || user.role} • {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {pendingCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                            <ClipboardList className="w-3 h-3" />
                            {pendingCount} tasks
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <StaffTaskFormSheet 
        open={showTaskForm}
        onOpenChange={setShowTaskForm}
        staffMembers={staffUsers}
      />
    </div>
  );
}