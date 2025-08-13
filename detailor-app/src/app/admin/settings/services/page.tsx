"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Badge } from '@/ui/badge';
import { Plus, Edit, Trash2, Clock, DollarSign, Eye, EyeOff } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  base_price: number;
  visible: boolean;
  category: string;
  requires_vehicle: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminServicesPage() {
  const [isCreating, setIsCreating] = React.useState(false);
  const [editingService, setEditingService] = React.useState<Service | null>(null);
  const [newService, setNewService] = React.useState({
    name: '',
    description: '',
    duration_minutes: 60,
    base_price: 0,
    category: 'exterior',
    requires_vehicle: true,
    visible: true
  });

  const queryClient = useQueryClient();

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['admin-services'],
    queryFn: async (): Promise<Service[]> => {
      const res = await fetch('/api/admin/services');
      const json = await res.json();
      return json.services || [];
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: async (serviceData: typeof newService) => {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData)
      });
      if (!res.ok) throw new Error('Failed to create service');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      setIsCreating(false);
      setNewService({
        name: '',
        description: '',
        duration_minutes: 60,
        base_price: 0,
        category: 'exterior',
        requires_vehicle: true,
        visible: true
      });
    }
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Service> & { id: string }) => {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update service');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      setEditingService(null);
    }
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete service');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
    }
  });

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    createServiceMutation.mutate(newService);
  };

  const toggleServiceVisibility = (service: Service) => {
    updateServiceMutation.mutate({
      id: service.id,
      visible: !service.visible
    });
  };

  const categories = [
    { value: 'exterior', label: 'Exterior Cleaning' },
    { value: 'interior', label: 'Interior Cleaning' },
    { value: 'detailing', label: 'Full Detailing' },
    { value: 'protection', label: 'Paint Protection' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'addon', label: 'Add-ons' }
  ];

  return (
    <RoleGuard allowed={['admin', 'staff']}>
      <DashboardShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text)]">Services</h1>
              <p className="text-[var(--color-text-secondary)]">Manage your service offerings and pricing</p>
            </div>
            <Button 
              onClick={() => setIsCreating(true)}
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-600)]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>

          {/* Create/Edit Service Form */}
          {(isCreating || editingService) && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {isCreating ? 'Create New Service' : 'Edit Service'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateService} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Service Name
                      </label>
                      <Input
                        value={newService.name}
                        onChange={(e) => setNewService({...newService, name: e.target.value})}
                        placeholder="e.g., Exterior Wash & Wax"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Category
                      </label>
                      <select
                        value={newService.category}
                        onChange={(e) => setNewService({...newService, category: e.target.value})}
                        className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)]"
                      >
                        {categories.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      Description
                    </label>
                    <textarea
                      value={newService.description}
                      onChange={(e) => setNewService({...newService, description: e.target.value})}
                      placeholder="Brief description of the service..."
                      rows={3}
                      className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Duration (minutes)
                      </label>
                      <Input
                        type="number"
                        value={newService.duration_minutes}
                        onChange={(e) => setNewService({...newService, duration_minutes: parseInt(e.target.value) || 60})}
                        min="15"
                        step="15"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Base Price (£)
                      </label>
                      <Input
                        type="number"
                        value={newService.base_price}
                        onChange={(e) => setNewService({...newService, base_price: parseFloat(e.target.value) || 0})}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newService.requires_vehicle}
                        onChange={(e) => setNewService({...newService, requires_vehicle: e.target.checked})}
                        className="mr-2"
                      />
                      Requires vehicle details
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newService.visible}
                        onChange={(e) => setNewService({...newService, visible: e.target.checked})}
                        className="mr-2"
                      />
                      Visible to customers
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="submit" 
                      disabled={createServiceMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {createServiceMutation.isPending ? 'Creating...' : 'Create Service'}
                    </Button>
                    <Button
                      type="button"
                      intent="outline"
                      onClick={() => {
                        setIsCreating(false);
                        setEditingService(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Services List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : services.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="h-12 w-12 text-gray-400 mx-auto mb-4">
                    <DollarSign className="h-full w-full" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No services yet</h3>
                  <p className="text-gray-600 mb-6">
                    Create your first service to start accepting bookings.
                  </p>
                  <Button 
                    onClick={() => setIsCreating(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Service
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {services.map((service) => (
                  <Card key={service.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg text-gray-900">
                              {service.name}
                            </h3>
                            {service.visible ? (
                              <Badge className="bg-green-100 text-green-800">
                                <Eye className="h-3 w-3 mr-1" />
                                Visible
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800">
                                <EyeOff className="h-3 w-3 mr-1" />
                                Hidden
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-3">
                            {service.description || 'No description'}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {service.duration_minutes} min
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              £{service.base_price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            intent="outline"
                            size="sm"
                            onClick={() => toggleServiceVisibility(service)}
                          >
                            {service.visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            intent="outline"
                            size="sm"
                            onClick={() => setEditingService(service)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            intent="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this service?')) {
                                deleteServiceMutation.mutate(service.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardShell>
    </RoleGuard>
  );
}