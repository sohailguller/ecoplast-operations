import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { 
  ClipboardList, 
  Factory, 
  Recycle, 
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import StatCard from '@/components/ui/StatCard';
import SectionHeader from '@/components/ui/SectionHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import PullToRefresh from '@/components/ui/PullToRefresh';

export default function StaffDashboard() {
  const [user, setUser] = useState(null);
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

  const { data: tasks = [] } = useQuery({
    queryKey: ['my-tasks', user?.email],
    queryFn: () => base44.entities.StaffTask.filter(
      { assigned_to: user.email },
      '-created_date',
      50
    ),
    enabled: !!user?.email,
  });

  const { data: productions = [] } = useQuery({
    queryKey: ['my-productions', user?.email],
    queryFn: () => base44.entities.Production.filter(
      { created_by: user.email },
      '-created_date',
      20
    ),
    enabled: !!user?.email,
  });

  const { data: collections = [] } = useQuery({
    queryKey: ['my-collections-staff', user?.email],
    queryFn: () => base44.entities.PlasticCollection.filter(
      { collected_by: user.full_name },
      '-created_date',
      20
    ),
    enabled: !!user?.full_name,
  });

  const today = format(new Date(), 'yyyy-MM-dd');
  
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedToday = tasks.filter(t => 
    t.status === 'completed' && t.completed_date === today
  ).length;

  const todayProduction = productions
    .filter(p => p.production_date === today)
    .reduce((sum, p) => sum + (p.quantity_produced || 0), 0);

  const todayCollection = collections
    .filter(c => c.created_date?.startsWith(today))
    .reduce((sum, c) => sum + (c.weight_kg || 0), 0);

  const urgentTasks = tasks.filter(t => 
    t.priority === 'urgent' && 
    (t.status === 'pending' || t.status === 'in_progress')
  );

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] }),
      queryClient.invalidateQueries({ queryKey: ['my-productions'] }),
      queryClient.invalidateQueries({ queryKey: ['my-collections-staff'] }),
    ]);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="pb-24 lg:pb-8">
      {/* Header */}
      <div className="px-4 py-6 bg-white border-b border-gray-100">
        <p className="text-sm text-gray-500">
          {format(new Date(), 'EEEE, MMMM d')}
        </p>
        <h1 className="text-2xl font-semibold text-gray-900 mt-1">
          Hello, {user?.full_name?.split(' ')[0] || 'there'}!
        </h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Pending Tasks"
            value={pendingTasks.length}
            icon={Clock}
          />
          <StatCard
            title="In Progress"
            value={inProgressTasks.length}
            icon={ClipboardList}
          />
          <StatCard
            title="Today's Production"
            value={todayProduction}
            subtitle="units"
            icon={Factory}
          />
          <StatCard
            title="Plastic Collected"
            value={`${todayCollection} kg`}
            subtitle="today"
            icon={Recycle}
          />
        </div>

        {/* Urgent Tasks Alert */}
        {urgentTasks.length > 0 && (
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-red-900">Urgent Tasks</p>
                <p className="text-sm text-red-700 mt-1">
                  You have {urgentTasks.length} urgent task{urgentTasks.length > 1 ? 's' : ''} requiring immediate attention
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link to={createPageUrl('StaffProduction')}>
            <Card className="p-4 bg-white border-0 shadow-sm hover:shadow transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 rounded-xl">
                  <Factory className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Log Production</p>
                  <p className="text-xs text-gray-500">Record output</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link to={createPageUrl('StaffCollection')}>
            <Card className="p-4 bg-white border-0 shadow-sm hover:shadow transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 rounded-xl">
                  <Recycle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Record Collection</p>
                  <p className="text-xs text-gray-500">Plastic intake</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* My Tasks */}
        <div>
          <SectionHeader 
            title="My Tasks" 
            action="View All"
            onAction={() => window.location.href = createPageUrl('StaffTasks')}
          />
          <Card className="bg-white border-0 shadow-sm overflow-hidden">
            {[...urgentTasks, ...pendingTasks, ...inProgressTasks].length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-sm text-gray-500 mt-2">No pending tasks</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {[...urgentTasks, ...pendingTasks.slice(0, 3), ...inProgressTasks.slice(0, 2)]
                  .slice(0, 5)
                  .map((task) => (
                    <Link
                      key={task.id}
                      to={createPageUrl('StaffTasks')}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {task.title}
                          </p>
                          <StatusBadge status={task.priority} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {task.department} • Due: {task.due_date ? format(new Date(task.due_date), 'MMM d') : 'No date'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={task.status} />
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <SectionHeader title="Recent Activity" />
          <Card className="bg-white border-0 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {productions.slice(0, 3).map((prod) => (
                <div key={prod.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Factory className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Produced {prod.quantity_produced} {prod.product_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(prod.created_date), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {collections.slice(0, 2).map((col) => (
                <div key={col.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Recycle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Collected {col.weight_kg} kg {col.plastic_type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(col.created_date), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {productions.length === 0 && collections.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-sm text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
      </div>
    </PullToRefresh>
  );
}