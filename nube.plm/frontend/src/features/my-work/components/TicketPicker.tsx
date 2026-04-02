import { useState, useEffect } from 'react';

// @ts-ignore - SDK types
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@rubix-sdk/frontend/common/ui';

interface TicketPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (ticketId: string, ticketName: string) => void;
  client: any;
}

interface PickerNode {
  id: string;
  name: string;
  type: string;
}

export function TicketPicker({ open, onClose, onSelect, client }: TicketPickerProps) {
  const [products, setProducts] = useState<PickerNode[]>([]);
  const [tasks, setTasks] = useState<PickerNode[]>([]);
  const [tickets, setTickets] = useState<PickerNode[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [selectedTicket, setSelectedTicket] = useState('');

  // Fetch products on open
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    client
      .queryNodes({ filter: 'type is "plm.product"' })
      .then((result: PickerNode[]) => {
        if (!cancelled) setProducts(result);
      })
      .catch((err: any) => console.error('[TicketPicker] Failed to load products:', err));
    return () => { cancelled = true; };
  }, [open, client]);

  // Fetch tasks when product selected
  useEffect(() => {
    if (!selectedProduct) { setTasks([]); return; }
    let cancelled = false;
    setSelectedTask('');
    setSelectedTicket('');
    setTickets([]);

    client
      .queryNodes({ filter: `type is "plm.task" and parent.id is "${selectedProduct}"` })
      .then((result: PickerNode[]) => {
        if (!cancelled) setTasks(result);
      })
      .catch((err: any) => console.error('[TicketPicker] Failed to load tasks:', err));

    // Also fetch product-level tickets
    client
      .queryNodes({ filter: `type is "plm.ticket" and parent.id is "${selectedProduct}"` })
      .then((result: PickerNode[]) => {
        if (!cancelled) setTickets((prev) => [...prev, ...result]);
      })
      .catch((err: any) => console.error('[TicketPicker] Failed to load tickets:', err));

    return () => { cancelled = true; };
  }, [selectedProduct, client]);

  // Fetch tickets when task selected
  useEffect(() => {
    if (!selectedTask) return;
    let cancelled = false;
    setSelectedTicket('');

    client
      .queryNodes({ filter: `type is "plm.ticket" and parent.id is "${selectedTask}"` })
      .then((result: PickerNode[]) => {
        if (!cancelled) setTickets(result);
      })
      .catch((err: any) => console.error('[TicketPicker] Failed to load tickets:', err));

    return () => { cancelled = true; };
  }, [selectedTask, client]);

  const handleConfirm = () => {
    const ticket = tickets.find((t) => t.id === selectedTicket);
    if (ticket) {
      onSelect(ticket.id, ticket.name);
      handleReset();
    }
  };

  const handleReset = () => {
    setSelectedProduct('');
    setSelectedTask('');
    setSelectedTicket('');
    setTasks([]);
    setTickets([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleReset()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Ticket to Timesheet</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Product */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Product</label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Select product..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Task (optional) */}
          {tasks.length > 0 && (
            <div className="space-y-1">
              <label className="text-sm font-medium">Task (optional)</label>
              <Select value={selectedTask} onValueChange={setSelectedTask}>
                <SelectTrigger>
                  <SelectValue placeholder="Select task..." />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Ticket */}
          {tickets.length > 0 && (
            <div className="space-y-1">
              <label className="text-sm font-medium">Ticket</label>
              <Select value={selectedTicket} onValueChange={setSelectedTicket}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ticket..." />
                </SelectTrigger>
                <SelectContent>
                  {tickets.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!selectedTicket}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
