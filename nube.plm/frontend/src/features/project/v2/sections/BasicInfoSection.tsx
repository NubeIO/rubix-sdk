/**
 * Basic Info Section - Project information form
 */

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// @ts-ignore - SDK button
import { Button } from '@rubix-sdk/frontend/common/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { Project, ProjectStatus, ProjectType } from '../../types/project.types';
import { PROJECT_STATUSES, PROJECT_TYPES } from '../../types/project.types';

interface BasicInfoSectionProps {
  project: Project;
  client: any;
  onProjectUpdate: (updates: any) => Promise<void>;
}

export function BasicInfoSection({ project, onProjectUpdate }: BasicInfoSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: project.name,
    projectCode: project.settings?.projectCode || '',
    description: project.settings?.description || '',
    projectType: (project.settings?.projectType as ProjectType) || 'hardware',
    status: (project.settings?.status as ProjectStatus) || 'Design',
  });

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onProjectUpdate({
        name: formData.name,
        settings: {
          ...project.settings,
          projectCode: formData.projectCode,
          description: formData.description,
          projectType: formData.projectType,
          status: formData.status,
        },
      });
      setIsEditing(false);
    } catch (err) {
      console.error('[BasicInfoSection] Save failed:', err);
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: project.name,
      projectCode: project.settings?.projectCode || '',
      description: project.settings?.description || '',
      projectType: (project.settings?.projectType as ProjectType) || 'hardware',
      status: (project.settings?.status as ProjectStatus) || 'Design',
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Basic Information</h2>
          <p className="text-sm text-muted-foreground">
            Project name, description, and classification details
          </p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Project Name */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Project Name
              </label>
              {isEditing ? (
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter project name"
                />
              ) : (
                <div className="text-base">{project.name}</div>
              )}
            </div>

            {/* Project Code */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Project Code
              </label>
              {isEditing ? (
                <Input
                  value={formData.projectCode}
                  onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
                  placeholder="Enter project code"
                  className="font-mono"
                />
              ) : (
                <div className="font-mono text-base">{project.settings?.projectCode || '—'}</div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Description
              </label>
              {isEditing ? (
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter project description"
                  rows={4}
                />
              ) : (
                <div className="text-base text-muted-foreground">
                  {project.settings?.description || 'No description provided'}
                </div>
              )}
            </div>

            {/* Project Type */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Project Type
              </label>
              {isEditing ? (
                <Select
                  value={formData.projectType}
                  onValueChange={(value) => setFormData({ ...formData, projectType: value as ProjectType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline" className="capitalize">
                  {project.settings?.projectType || 'hardware'}
                </Badge>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Status
              </label>
              {isEditing ? (
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as ProjectStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge>{project.settings?.status || 'Design'}</Badge>
              )}
            </div>

            {/* Save/Cancel buttons */}
            {isEditing && (
              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
