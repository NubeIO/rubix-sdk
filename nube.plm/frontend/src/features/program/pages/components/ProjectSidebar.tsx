// @ts-ignore
import { Skeleton } from '@rubix-sdk/frontend/common/ui';
import { Button } from '@/components/ui/button';
import { ProjectItem } from './ProjectItem';

interface ProjectSidebarProps {
  productData: any[];
  selectedProjectIds: Set<string>;
  isLoading: boolean;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onNewProject: () => void;
  onRename: (id: string, name: string) => void;
  onChangeIcon: (id: string, icon: string) => void;
  onChangeColor: (id: string, color: string) => void;
  onEditProject: (product: any) => void;
  onDeleteProject: (id: string) => void;
}

export function ProjectSidebar({
  productData, selectedProjectIds, isLoading,
  onToggle, onSelectAll, onSelectNone, onNewProject,
  onRename, onChangeIcon, onChangeColor, onEditProject, onDeleteProject,
}: ProjectSidebarProps) {
  return (
    <div className="w-[220px] shrink-0 border-r border-border overflow-y-auto">
      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Projects</span>
        <Button variant="link" size="sm" className="h-auto p-0 text-[10px]" onClick={onNewProject}>
          + New
        </Button>
      </div>
      {isLoading ? (
        <div className="px-3 space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 rounded" />)}</div>
      ) : productData.length === 0 ? (
        <div className="px-3 py-8 text-center">
          <p className="text-xs text-muted-foreground">No projects yet</p>
          <Button variant="link" size="sm" className="h-auto p-0 text-[11px] mt-2" onClick={onNewProject}>
            + Create first project
          </Button>
        </div>
      ) : (
        <>
          <div className="px-3 pb-1 flex items-center gap-2">
            <button onClick={onSelectAll} className="text-[10px] text-muted-foreground hover:text-foreground transition">All</button>
            <span className="text-[10px] text-muted-foreground/40">/</span>
            <button onClick={onSelectNone} className="text-[10px] text-muted-foreground hover:text-foreground transition">None</button>
          </div>
          {productData.map(p => (
            <ProjectItem
              key={p.product.id}
              product={p.product}
              isChecked={selectedProjectIds.has(p.product.id)}
              overallProgress={p.overallProgress}
              currentGate={p.currentGate || undefined}
              taskCount={p.tasks.length}
              onToggle={() => onToggle(p.product.id)}
              onRename={(name) => onRename(p.product.id, name)}
              onChangeIcon={(icon) => onChangeIcon(p.product.id, icon)}
              onChangeColor={(color) => onChangeColor(p.product.id, color)}
              onEdit={() => onEditProject(p.product)}
              onDelete={() => onDeleteProject(p.product.id)}
            />
          ))}
        </>
      )}
    </div>
  );
}
