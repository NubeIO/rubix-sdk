import { useMemo, useState } from 'react';
import { Box, PackagePlus, Search, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ManufacturingUnit } from '../types';
import { UnitTable } from './UnitTable';

interface UnitsTabProps {
  units: ManufacturingUnit[];
  loading: boolean;
  onAddUnit: () => void;
  onEditUnit: (unit: ManufacturingUnit) => void;
  onDeleteUnit: (unit: ManufacturingUnit) => void;
}

export function UnitsTab({
  units,
  loading,
  onAddUnit,
  onEditUnit,
  onDeleteUnit,
}: UnitsTabProps) {
  const [unitSearchQuery, setUnitSearchQuery] = useState('');
  const [qaStatusFilter, setQaStatusFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Filter units based on search and filters
  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      const matchesSearch =
        !unitSearchQuery ||
        unit.settings?.serialNumber?.toLowerCase().includes(unitSearchQuery.toLowerCase()) ||
        unit.name.toLowerCase().includes(unitSearchQuery.toLowerCase());

      const matchesQaFilter =
        qaStatusFilter === 'all' || unit.settings?.qaStatus === qaStatusFilter;

      const matchesStatusFilter =
        statusFilter === 'all' || unit.settings?.status === statusFilter;

      return matchesSearch && matchesQaFilter && matchesStatusFilter;
    });
  }, [units, unitSearchQuery, qaStatusFilter, statusFilter]);

  // Paginate filtered units
  const paginatedUnits = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredUnits.slice(startIndex, endIndex);
  }, [filteredUnits, currentPage]);

  const totalPages = Math.ceil(filteredUnits.length / pageSize);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Box className="h-5 w-5" />
              Produced Units
              {filteredUnits.length > 0 && (
                <Badge variant="secondary">{filteredUnits.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {paginatedUnits.length > 0 ? (
                <>
                  Showing {paginatedUnits.length} of {filteredUnits.length} units
                  {filteredUnits.length !== units.length && ` (filtered from ${units.length})`}
                </>
              ) : (
                'Serialized core.asset children under the selected run'
              )}
            </CardDescription>
          </div>
          <Button onClick={onAddUnit}>
            <PackagePlus className="mr-2 h-4 w-4" />
            Add Unit
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-3 pt-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search serial numbers..."
              value={unitSearchQuery}
              onChange={(e) => {
                setUnitSearchQuery(e.target.value);
                handleFilterChange();
              }}
              className="pl-9"
            />
          </div>

          <Select
            value={qaStatusFilter}
            onValueChange={(value) => {
              setQaStatusFilter(value);
              handleFilterChange();
            }}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All QA Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="pass">Pass</SelectItem>
              <SelectItem value="fail">Fail</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              handleFilterChange();
            }}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="produced">Produced</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="rma">RMA</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {loading && units.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading units...</div>
        ) : paginatedUnits.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <Box className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              {units.length === 0 ? 'No units yet' : 'No units found'}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {units.length === 0
                ? 'Add the first serialized unit to start tracking output.'
                : 'Try adjusting your search or filters.'}
            </p>
          </div>
        ) : (
          <>
            <UnitTable units={paginatedUnits} onEdit={onEditUnit} onDelete={onDeleteUnit} />

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} • {filteredUnits.length} units total
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
