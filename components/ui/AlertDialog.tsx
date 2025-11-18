"use client";

import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";

export interface AlertDialogOptions {
  title?: string;
  message: string;
  type?: "alert" | "confirm";
  confirmText?: string;
  cancelText?: string;
  variant?: "success" | "warning" | "error" | "info";
}

interface AlertDialogProps {
  isOpen: boolean;
  options: AlertDialogOptions;
  onClose: () => void;
  onConfirm?: () => void;
}

export function AlertDialog({
  isOpen,
  options,
  onClose,
  onConfirm,
}: AlertDialogProps) {
  const {
    title,
    message,
    type = "alert",
    confirmText = type === "confirm" ? "Confirm" : "OK",
    cancelText = "Cancel",
    variant = "info",
  } = options;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return {
          icon: "solar:check-circle-bold",
          iconColor: "text-finance-green",
          borderColor: "border-finance-green-50",
          bgColor: "bg-finance-surface",
        };
      case "warning":
        return {
          icon: "solar:danger-triangle-bold",
          iconColor: "text-yellow-500",
          borderColor: "border-yellow-500/50",
          bgColor: "bg-finance-surface",
        };
      case "error":
        return {
          icon: "solar:close-circle-bold",
          iconColor: "text-red-500",
          borderColor: "border-red-500/50",
          bgColor: "bg-finance-surface",
        };
      default:
        return {
          icon: "solar:info-circle-bold",
          iconColor: "text-finance-green",
          borderColor: "border-finance-green-50",
          bgColor: "bg-finance-surface",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Modal
      classNames={{
        base: "bg-finance-surface border border-finance-green-20",
        backdrop: "bg-black/80 backdrop-blur-sm",
      }}
      isOpen={isOpen}
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: {
              duration: 0.3,
              ease: "easeOut",
            },
          },
          exit: {
            y: -20,
            opacity: 0,
            transition: {
              duration: 0.2,
              ease: "easeIn",
            },
          },
        },
      }}
      size="md"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 pb-2">
          <div className="flex items-center gap-3">
            <Icon
              className={`text-2xl ${styles.iconColor}`}
              icon={styles.icon}
            />
            <h3 className="text-xl font-semibold text-white">
              {title || (type === "confirm" ? "Confirm Action" : "Alert")}
            </h3>
          </div>
        </ModalHeader>
        <ModalBody className="pt-2">
          <p className="text-zinc-300 leading-relaxed">{message}</p>
        </ModalBody>
        <ModalFooter className="gap-2 pt-4">
          {type === "confirm" && (
            <Button
              className="border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              color="default"
              variant="flat"
              onPress={onClose}
            >
              {cancelText}
            </Button>
          )}
          <Button
            className={`${
              variant === "error"
                ? "bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30"
                : "bg-finance-green/20 border-finance-green-50 text-finance-green hover:bg-finance-green/30"
            } border`}
            color={variant === "error" ? "danger" : "success"}
            variant="flat"
            onPress={handleConfirm}
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
