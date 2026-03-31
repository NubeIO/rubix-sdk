/**
 * Project Detail Page V2 - Modern Workspace UI
 *
 * Features:
 * - Fixed header with project info and actions
 * - Fixed sidebar navigation (right side)
 * - Main content area with section-based views
 * - Real API integration using plugin-client SDK
 */

import { useState, lazy, Suspense, useCallback, useMemo } from 'react';
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
import type { Project } from '../types/project.types';
import { Skeleton } from '@/components/ui/skeleton';

// Components
import { ProjectHeader } from './components/ProjectHeader';
import { SidebarNavigation } from './components/SidebarNavigation';

// Sections - Lazy loaded for better performance
import { OverviewSection } from './sections/OverviewSection';
const BasicInfoSection = lazy(() => import('./sections/BasicInfoSection').then(m => ({ default: m.BasicInfoSection })));
const PricingSection = lazy(() => import('./sections/PricingSection').then(m => ({ default: m.PricingSection })));
const BOMSectionV2 = lazy(() => import('./sections/BOMSectionV2').then(m => ({ default: m.BOMSectionV2 })));
const TasksSectionV2 = lazy(() => import('./sections/TasksSectionV2').then(m => ({ default: m.TasksSectionV2 })));
const TicketsSection = lazy(() => import('./sections/TicketsSection').then(m => ({ default: m.TicketsSection })));
const ManufacturingSection = lazy(() => import('./sections/ManufacturingSection').then(m => ({ default: m.ManufacturingSection })));
const SystemInfoSection = lazy(() => import('./sections/SystemInfoSection').then(m => ({ default: m.SystemInfoSection })));

export type SectionId = 'overview' | 'basic-info' | 'pricing' | 'bom' | 'tasks' | 'manufacturing' | 'tickets' | 'system-info';

// Loading fallback for lazy sections
function SectionLoadingFallback() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

interface ProjectDetailPageV2Props {
  project: Project;
  orgId: string;
  deviceId: string;
  baseUrl?: string;
  token?: string;
  onProjectUpdated?: (project: Project) => void;
}

export function ProjectDetailPageV2({
  project: initialProject,
  orgId,
  deviceId,
  baseUrl = '/api/v1',
  token,
  onProjectUpdated,
}: ProjectDetailPageV2Props) {
  const [project, setProject] = useState<Project>(initialProject);
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create plugin client
  const client = useMemo(() => createPluginClient({ orgId, deviceId, baseUrl, token }), [
    orgId,
    deviceId,
    baseUrl,
    token,
  ]);

  // Stats state
  const [stats, setStats] = useState({
    totalTasks: 0,
    tasksCompletedThisWeek: 0,
    bomItemsCount: 0,
    bomItemsPending: 0,
    totalCost: 0,
    totalTickets: 0,
    blockedTickets: 0,
    completedTickets: 0,
    ticketsByStatus: {} as Record<string, number>,
    lastActivity: project.updatedAt || new Date().toISOString(),
    health: 98.2,
    latency: 24,
  });

  // Refresh project data
  const refreshProject = useCallback(async () => {
    try {
      setIsLoading(true);
      const updated = await client.getNode(project.id);
      setProject(updated as Project);
      onProjectUpdated?.(updated as Project);
    } catch (err) {
      console.error('[ProjectDetailPageV2] Failed to refresh project:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh project');
    } finally {
      setIsLoading(false);
    }
  }, [client, onProjectUpdated, project.id]);

  // Update project
  const updateProject = useCallback(async (updates: { name?: string; settings?: Record<string, any> }) => {
    try {
      setIsLoading(true);
      // Update name if provided
      if (updates.name) {
        await client.updateNode(project.id, { name: updates.name });
      }
      // Update settings if provided (uses PATCH endpoint for deep merge)
      let updated = project;
      if (updates.settings) {
        updated = await client.updateNodeSettings(project.id, updates.settings) as Project;
      }
      setProject(updated);
      onProjectUpdated?.(updated);
    } catch (err) {
      console.error('[ProjectDetailPageV2] Failed to update project:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client, onProjectUpdated, project]);

  // Calculate stats (will be updated by child components)
  const updateStats = useCallback((newStats: Partial<typeof stats>) => {
    setStats((prev) => {
      let changed = false;

      for (const [key, value] of Object.entries(newStats)) {
        if (prev[key as keyof typeof prev] !== value) {
          changed = true;
          break;
        }
      }

      if (!changed) {
        return prev;
      }

      return { ...prev, ...newStats };
    });
  }, []);

  // Render active section
  const renderSection = () => {
    const commonProps = {
      project,
      orgId,
      deviceId,
      baseUrl,
      token,
      client,
      onProjectUpdate: updateProject,
      onRefresh: refreshProject,
    };

    const pType = project.settings?.projectType;
    const isProductType = pType === 'hardware' || pType === 'software';

    switch (activeSection) {
      case 'overview':
        return <OverviewSection {...commonProps} stats={stats} onStatsUpdate={updateStats} />;
      case 'basic-info':
        return <BasicInfoSection {...commonProps} />;
      case 'pricing':
        if (!isProductType) {
          return <OverviewSection {...commonProps} stats={stats} onStatsUpdate={updateStats} />;
        }
        return <PricingSection {...commonProps} />;
      case 'bom':
        // BOM is only for hardware projects
        if (pType !== 'hardware') {
          return <OverviewSection {...commonProps} stats={stats} onStatsUpdate={updateStats} />;
        }
        return <BOMSectionV2 {...commonProps} onStatsUpdate={updateStats} />;
      case 'tasks':
        return <TasksSectionV2 {...commonProps} onStatsUpdate={updateStats} />;
      case 'manufacturing':
        // Manufacturing is only for hardware projects
        if (pType !== 'hardware') {
          return <OverviewSection {...commonProps} stats={stats} onStatsUpdate={updateStats} />;
        }
        return <ManufacturingSection {...commonProps} onStatsUpdate={updateStats} />;
      case 'tickets':
        return <TicketsSection {...commonProps} onStatsUpdate={updateStats} />;
      case 'system-info':
        return <SystemInfoSection {...commonProps} />;
      default:
        return <OverviewSection {...commonProps} stats={stats} onStatsUpdate={updateStats} />;
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header - Fixed at top */}
      <ProjectHeader
        project={project}
        onEdit={() => {/* TODO: Open edit dialog */}}
        onRelease={() => {/* TODO: Open release dialog */}}
        isLoading={isLoading}
      />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Main content (scrollable) */}
        <div className="flex-1 overflow-auto p-8">
          <div className="mx-auto max-w-6xl">
            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
            <Suspense fallback={<SectionLoadingFallback />}>
              {renderSection()}
            </Suspense>
          </div>
        </div>

        {/* Right: Sidebar navigation (fixed) */}
        <SidebarNavigation
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          projectType={project.settings?.projectType}
          stats={stats}
        />
      </div>
    </div>
  );
}
