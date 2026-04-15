import type { GateProgress } from '../types/program.types';
import type { GateId } from '@shared/constants/gates';
import { GateProgressCard } from './GateProgressCard';

interface GateRoadmapProps {
  gateProgress: GateProgress[];
  gateTargets?: Record<GateId, string> | null;
  selectedGate?: GateId | null;
  onGateClick?: (gateId: GateId) => void;
}

export function GateRoadmap({ gateProgress, gateTargets, selectedGate, onGateClick }: GateRoadmapProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {gateProgress.map(gp => (
        <GateProgressCard
          key={gp.gateId}
          progress={gp}
          targetDate={gateTargets?.[gp.gateId]}
          isSelected={selectedGate === gp.gateId}
          onClick={() => onGateClick?.(gp.gateId)}
        />
      ))}
    </div>
  );
}
