import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isLoading?: boolean;
  confirmValue?: string;
  confirmText?: string;
}

export function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  isLoading,
  confirmValue,
  confirmText = "Please type the confirmation value to verify.",
}: DeleteConfirmDialogProps) {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (!open) {
      setInputValue("");
    }
  }, [open]);

  const isConfirmDisabled = confirmValue ? inputValue !== confirmValue : false;

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="rounded-2xl border-border shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold tracking-tight text-foreground">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {confirmValue && (
          <div className="py-4 space-y-3">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{confirmText}</p>
            <div className="p-3 bg-muted/30 rounded-xl border border-border/50 text-sm font-bold text-center select-none italic text-primary/70">
              {confirmValue}
            </div>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type confirmation here..."
              className="h-11 bg-white border-border rounded-xl font-medium focus-visible:ring-destructive/20 focus-visible:border-destructive transition-all"
              autoFocus
            />
          </div>
        )}

        <AlertDialogFooter className="pt-2">
          <AlertDialogCancel 
            disabled={isLoading}
            className="rounded-xl border-border font-bold text-xs uppercase tracking-widest h-10 px-6"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              if (isConfirmDisabled) {
                e.preventDefault();
                return;
              }
              onConfirm();
            }}
            disabled={isLoading || isConfirmDisabled}
            className="bg-destructive text-white hover:bg-destructive/90 rounded-xl font-bold text-xs uppercase tracking-widest h-10 px-8 shadow-md hover:shadow-lg transition-all"
          >
            {isLoading ? "Hard Deleting..." : "Purge Data"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
