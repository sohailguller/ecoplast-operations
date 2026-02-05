import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ClipboardList, CheckCircle2, Clock, Play, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';

export default function StaffTasks() {
  const [user, setUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState('active');
  const [selectedTask, setSelectedTask] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {
      console.error(e);
    }
  };

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['my-tasks', user?.email],
    queryFn: () => base44.entities.StaffTask.filter(
      { assigned_to: user.email },
      '-created_date',
      100
    ),
    enabled: !!user?.email,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.StaffTask.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      setSelectedTask(null);
    },
  });

  const filteredTasks = tasks.filter(task => {
    if (statusFilter === 'active') return ['pending', 'in_progress'].includes(task.status);
    if (statusFilter === 'completed') return task.status === 'completed';
    return true;
  });

  const handleStartTask = (task) => {
    updateMutation.mutate({
      id: task.id,
      data: { status: 'in_progress' }
    });
  };

  const handleCompleteTask = (task) => {
    updateMutation.mutate({
      id: task.id,
      data: { 
        status: 'completed',
        completed_date: format(new Date(), 'yyyy-MM-dd')
      }
    });
  };

  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
    if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
    return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
  });

  return (
    <div className="pb-24 lg:pb-8">
      {/* Header */}
      <div className="px-4 py-6 bg-white border-b border-gray-100">
        <h1 className="text-2xl font-semibold text-gray-900">My Tasks</h1>
        <p className="text-sm text-gray-500 mt-1">
          {tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length} active tasks
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Status Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="w-full bg-gray-100 p-1 rounded-xl h-auto">
            <TabsTrigger value="active" className="flex-1 rounded-lg text-xs py-2">
              Active
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 rounded-lg text-xs py-2">
              Completed
            </TabsTrigger>
            <TabsTrigger value="all" className="flex-1 rounded-lg text-xs py-2">
              All
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tasks List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4 bg-white border-0 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </Card>
            ))}
          </div>
        ) : sortedTasks.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={statusFilter === 'completed' ? 'No completed tasks' : 'No active tasks'}
            description={statusFilter === 'active' ? "Great job! You're all caught up" : 'Tasks will appear here'}
          />
        ) : (
          <div className="space-y-2">
            {sortedTasks.map((task) => (
              <Card 
                key={task.id}
                className={`p-4 bg-white border-0 shadow-sm cursor-pointer hover:shadow transition-shadow ${
                  task.status === 'in_progress' ? 'ring-2 ring-blue-200' : ''
                }`}
                onClick={() => setSelectedTask(task)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      <StatusBadge status={task.priority} />
                      <StatusBadge status={task.status} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 capitalize">
                      {task.department} • Due: {task.due_date ? format(new Date(task.due_date), 'MMM d') : 'No date'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Task Detail Sheet */}
      <Sheet open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {selectedTask && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedTask.priority} />
                  <StatusBadge status={selectedTask.status} />
                </div>
                <SheetTitle className="text-left text-xl mt-2">
                  {selectedTask.title}
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {selectedTask.description && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Description</p>
                    <p className="text-sm text-gray-700">{selectedTask.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Department</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{selectedTask.department}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Due Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedTask.due_date ? format(new Date(selectedTask.due_date), 'MMM d, yyyy') : 'Not set'}
                    </p>
                  </div>
                </div>

                {selectedTask.notes && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Notes</p>
                    <p className="text-sm text-gray-700">{selectedTask.notes}</p>
                  </div>
                )}

                {/* Actions */}
                {selectedTask.status !== 'completed' && selectedTask.status !== 'cancelled' && (
                  <div className="flex gap-3 pt-4">
                    {selectedTask.status === 'pending' && (
                      <Button
                        onClick={() => handleStartTask(selectedTask)}
                        disabled={updateMutation.isPending}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Task
                      </Button>
                    )}
                    <Button
                      onClick={() => handleCompleteTask(selectedTask)}
                      disabled={updateMutation.isPending}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Complete
                    </Button>
                  </div>
                )}

                {selectedTask.status === 'completed' && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl text-emerald-700">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      Completed {selectedTask.completed_date && `on ${format(new Date(selectedTask.completed_date), 'MMM d, yyyy')}`}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}