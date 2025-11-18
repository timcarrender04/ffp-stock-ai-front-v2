"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

import { AlertDialog, AlertDialogOptions } from "@/components/ui/AlertDialog";

interface AlertContextType {
  alert: (
    message: string,
    options?: Partial<AlertDialogOptions>,
  ) => Promise<void>;
  confirm: (
    message: string,
    options?: Partial<AlertDialogOptions>,
  ) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<AlertDialogOptions>({ message: "" });
  const [resolveAlert, setResolveAlert] = useState<(() => void) | null>(null);
  const [resolveConfirm, setResolveConfirm] = useState<
    ((value: boolean) => void) | null
  >(null);

  const alert = useCallback(
    (message: string, alertOptions?: Partial<AlertDialogOptions>) => {
      return new Promise<void>((resolve) => {
        setOptions({
          message,
          type: "alert",
          variant: alertOptions?.variant || "info",
          title: alertOptions?.title,
          confirmText: alertOptions?.confirmText,
        });
        setResolveAlert(() => resolve);
        setIsOpen(true);
      });
    },
    [],
  );

  const confirm = useCallback(
    (message: string, confirmOptions?: Partial<AlertDialogOptions>) => {
      return new Promise<boolean>((resolve) => {
        setOptions({
          message,
          type: "confirm",
          variant: confirmOptions?.variant || "warning",
          title: confirmOptions?.title,
          confirmText: confirmOptions?.confirmText || "Confirm",
          cancelText: confirmOptions?.cancelText || "Cancel",
        });
        setResolveConfirm(() => resolve);
        setIsOpen(true);
      });
    },
    [],
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (resolveAlert) {
      resolveAlert();
      setResolveAlert(null);
    }
    if (resolveConfirm) {
      resolveConfirm(false);
      setResolveConfirm(null);
    }
  }, [resolveAlert, resolveConfirm]);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (resolveConfirm) {
      resolveConfirm(true);
      setResolveConfirm(null);
    }
    if (resolveAlert) {
      resolveAlert();
      setResolveAlert(null);
    }
  }, [resolveAlert, resolveConfirm]);

  return (
    <AlertContext.Provider value={{ alert, confirm }}>
      {children}
      <AlertDialog
        isOpen={isOpen}
        options={options}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);

  if (context === undefined) {
    throw new Error("useAlert must be used within an AlertProvider");
  }

  return context;
}
