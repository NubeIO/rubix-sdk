/**
 * Dialog Component - Headless UI styled exactly like shadcn/ui
 *
 * This uses @headlessui/react for behavior (works across Module Federation)
 * but styled with the EXACT same Tailwind classes as shadcn/ui Dialog.
 *
 * Result: Looks identical to shadcn/ui, works across Module Federation.
 */

import { Dialog as HeadlessDialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { Fragment, type ReactNode } from 'react';
import { cn } from './utils';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <Transition show={open} as={Fragment}>
      <HeadlessDialog onClose={() => onOpenChange(false)} className="relative z-50">
        {children}
      </HeadlessDialog>
    </Transition>
  );
}

interface DialogContentProps {
  children: ReactNode;
  className?: string;
  onClose?: () => void;
}

export function DialogContent({ children, className, onClose }: DialogContentProps) {
  return (
    <>
      {/* Backdrop - exact shadcn/ui styling */}
      <Transition.Child
        as={Fragment}
        enter="ease-out duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-black/80" aria-hidden="true" />
      </Transition.Child>

      {/* Dialog panel container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          {/* Dialog panel - EXACT shadcn/ui classes */}
          <HeadlessDialog.Panel
            className={cn(
              'relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg',
              className
            )}
          >
            {children}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </HeadlessDialog.Panel>
        </Transition.Child>
      </div>
    </>
  );
}

interface DialogHeaderProps {
  children: ReactNode;
  className?: string;
}

export function DialogHeader({ children, className }: DialogHeaderProps) {
  return (
    <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}>
      {children}
    </div>
  );
}

interface DialogFooterProps {
  children: ReactNode;
  className?: string;
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}>
      {children}
    </div>
  );
}

interface DialogTitleProps {
  children: ReactNode;
  className?: string;
}

export function DialogTitle({ children, className }: DialogTitleProps) {
  return (
    <HeadlessDialog.Title
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    >
      {children}
    </HeadlessDialog.Title>
  );
}

interface DialogDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function DialogDescription({ children, className }: DialogDescriptionProps) {
  return (
    <HeadlessDialog.Description className={cn('text-sm text-muted-foreground', className)}>
      {children}
    </HeadlessDialog.Description>
  );
}
