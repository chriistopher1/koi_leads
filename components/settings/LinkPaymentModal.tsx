"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PaymentMethodSection } from "@/components/settings/PaymentMethodSection";
import { ProfileProp } from "@/components/landing/PricingSection"; // Reuse type

interface LinkPaymentModalProps {
  profile: ProfileProp | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LinkPaymentModal({
  profile,
  isOpen,
  onClose,
  onSuccess,
}: LinkPaymentModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Hubungkan Metode Pembayaran</DialogTitle>
          <DialogDescription>
            Hubungkan kartu, e-wallet, atau VA untuk pembayaran berlangganan
            otomatis.
          </DialogDescription>
        </DialogHeader>
        <PaymentMethodSection profile={profile} onLinked={onSuccess} />
      </DialogContent>
    </Dialog>
  );
}
