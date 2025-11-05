import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Coins, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { ClientWithDetails } from "@/api/clients.api";
import { useActivePaymentDetails } from "@/hooks/usePayments";

interface ClientTopUpDialogProps {
  open: boolean;
  onClose: () => void;
  client: ClientWithDetails | null;
}

export function ClientTopUpDialog({ open, onClose, client }: ClientTopUpDialogProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { data: paymentDetails = [] } = useActivePaymentDetails();

  if (!client) return null;

  const handleCopyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[500px] mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Coins className="h-5 w-5 text-accent" />
            Client Account Top-up
          </DialogTitle>
          <DialogDescription className="text-sm">View available payment options</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 sm:space-y-6">
          {/* Payment Options */}
          {paymentDetails.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Payment Options</h3>
              <div className="space-y-2">
                {paymentDetails.map((payment) => (
                  <Card key={payment.id} className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-base flex items-center gap-2">
                          <Coins className="h-4 w-4 text-primary" />
                          {payment.name}
                        </h4>
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
                          {payment.payment_type === 'mpesa_paybill' ? 'Mpesa Paybill' : 'Mpesa Till'}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        {payment.payment_type === 'mpesa_paybill' ? (
                          <>
                            <div className="flex items-center justify-between p-2 bg-background/50 rounded">
                              <span className="text-muted-foreground">Paybill:</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-semibold">{payment.paybill}</span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleCopyToClipboard(payment.paybill || '', `paybill-${payment.id}`)}
                                >
                                  {copiedId === `paybill-${payment.id}` ? (
                                    <CheckCircle2 className="h-3 w-3 text-success" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-background/50 rounded">
                              <span className="text-muted-foreground">Account No:</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-semibold">{payment.account_no}</span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleCopyToClipboard(payment.account_no || '', `account-${payment.id}`)}
                                >
                                  {copiedId === `account-${payment.id}` ? (
                                    <CheckCircle2 className="h-3 w-3 text-success" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-between p-2 bg-background/50 rounded">
                            <span className="text-muted-foreground">Till Number:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold">{payment.till}</span>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => handleCopyToClipboard(payment.till || '', `till-${payment.id}`)}
                              >
                                {copiedId === `till-${payment.id}` ? (
                                  <CheckCircle2 className="h-3 w-3 text-success" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No payment options configured</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
