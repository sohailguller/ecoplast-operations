import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, User, Mail, Phone, MapPin, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    location: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      setFormData({
        full_name: userData.full_name || '',
        phone: userData.phone || '',
        location: userData.location || '',
      });
    } catch (e) {
      console.error(e);
    }
  };

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="pb-24 lg:pb-8">
      {/* Header */}
      <div className="px-4 py-4 bg-white border-b border-gray-100 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Profile</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center py-6">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-3xl font-semibold text-gray-600">
              {formData.full_name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          {user && (
            <div className="mt-4 text-center">
              <p className="text-lg font-semibold text-gray-900">{user.full_name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium capitalize">
                {user.role}
              </span>
            </div>
          )}
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit}>
          <Card className="p-4 bg-white border-0 shadow-sm space-y-4">
            <h2 className="font-medium text-gray-900">Personal Information</h2>
            
            <div>
              <Label htmlFor="name">Full Name</Label>
              <div className="relative mt-1.5">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Your name"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="pl-10 bg-gray-50"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative mt-1.5">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="07XX XXX XXX"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <div className="relative mt-1.5">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Your area or address"
                  className="pl-10"
                />
              </div>
            </div>
          </Card>

          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full mt-4 h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : saved ? (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Saved
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </form>

        {/* Staff-specific info */}
        {user?.staff_role && (
          <Card className="p-4 bg-white border-0 shadow-sm">
            <h2 className="font-medium text-gray-900 mb-3">Staff Information</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Department</span>
                <span className="text-sm font-medium capitalize">{user.staff_role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Role</span>
                <span className="text-sm font-medium capitalize">{user.role}</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}