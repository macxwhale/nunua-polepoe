import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Smartphone, Plus, Trash2, Edit2, Check, X, CreditCard } from "lucide-react";
import { usePaymentDetails, useCreatePaymentDetail, useUpdatePaymentDetail, useDeletePaymentDetail } from "@/hooks/usePayments";
import type { PaymentDetail } from "@/api/payments.api";
import { DeleteConfirmDialog } from "@/shared/components/DeleteConfirmDialog";

const Payments = () => {
  const { data: paymentDetails = [], isLoading } = usePaymentDetails();
  const createPayment = useCreatePaymentDetail();
  const updatePayment = useUpdatePaymentDetail();
  const deletePayment = useDeletePaymentDetail();

  const [paymentType, setPaymentType] = useState<'mpesa_paybill' | 'mpesa_till'>('mpesa_paybill');
  const [name, setName] = useState("");
  const [paybill, setPaybill] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [till, setTill] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      await updatePayment.mutateAsync({
        id: editingId,
        updates: {
          payment_type: paymentType,
          name,
          paybill: paymentType === 'mpesa_paybill' ? paybill : undefined,
          account_no: paymentType === 'mpesa_paybill' ? accountNo : undefined,
          till: paymentType === 'mpesa_till' ? till : undefined,
        }
      });
      setEditingId(null);
    } else {
      await createPayment.mutateAsync({
        payment_type: paymentType,
        name,
        paybill: paymentType === 'mpesa_paybill' ? paybill : undefined,
        account_no: paymentType === 'mpesa_paybill' ? accountNo : undefined,
        till: paymentType === 'mpesa_till' ? till : undefined,
      });
    }

    setPaymentType('mpesa_paybill');
    setName("");
    setPaybill("");
    setAccountNo("");
    setTill("");
  };

  const handleEdit = (payment: PaymentDetail) => {
    setEditingId(payment.id);
    setPaymentType(payment.payment_type as 'mpesa_paybill' | 'mpesa_till');
    setName(payment.name);
    setPaybill(payment.paybill || "");
    setAccountNo(payment.account_no || "");
    setTill(payment.till || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setPaymentType('mpesa_paybill');
    setName("");
    setPaybill("");
    setAccountNo("");
    setTill("");
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingId) {
      await deletePayment.mutateAsync(deletingId);
      setDeletingId(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleToggleActive = async (payment: PaymentDetail) => {
    await updatePayment.mutateAsync({
      id: payment.id,
      updates: { is_active: !payment.is_active }
    });
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-foreground">
            Payment Settings
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure M-Pesa payment options for your clients
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Add/Edit Payment Form */}
          <Card className="border-border/40">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  editingId ? 'bg-secondary/10' : 'bg-primary/10'
                }`}>
                  {editingId ? (
                    <Edit2 className="h-5 w-5 text-secondary" />
                  ) : (
                    <Plus className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <CardTitle className="font-display text-lg">
                    {editingId ? "Edit Payment Details" : "Add Payment Details"}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {editingId ? "Update payment method details" : "Configure a new M-Pesa payment option"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Display Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Main Business Account"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-11 bg-muted/40 border-border/50 focus-visible:ring-primary/50 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium">Payment Type</Label>
                  <Select value={paymentType} onValueChange={(value: any) => setPaymentType(value)}>
                    <SelectTrigger className="h-11 bg-muted/40 border-border/50 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="mpesa_paybill" className="rounded-lg">M-Pesa Paybill</SelectItem>
                      <SelectItem value="mpesa_till" className="rounded-lg">M-Pesa Till</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {paymentType === 'mpesa_paybill' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="paybill" className="text-sm font-medium">Paybill Number</Label>
                      <Input
                        id="paybill"
                        placeholder="e.g., 522522"
                        value={paybill}
                        onChange={(e) => setPaybill(e.target.value)}
                        required
                        className="h-11 bg-muted/40 border-border/50 focus-visible:ring-primary/50 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountNo" className="text-sm font-medium">Account Number</Label>
                      <Input
                        id="accountNo"
                        placeholder="e.g., 44846464"
                        value={accountNo}
                        onChange={(e) => setAccountNo(e.target.value)}
                        required
                        className="h-11 bg-muted/40 border-border/50 focus-visible:ring-primary/50 rounded-xl"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="till" className="text-sm font-medium">Till Number</Label>
                    <Input
                      id="till"
                      placeholder="e.g., 4454554"
                      value={till}
                      onChange={(e) => setTill(e.target.value)}
                      required
                      className="h-11 bg-muted/40 border-border/50 focus-visible:ring-primary/50 rounded-xl"
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    className="flex-1 shadow-md hover:shadow-glow"
                    disabled={createPayment.isPending || updatePayment.isPending}
                  >
                    {createPayment.isPending || updatePayment.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingId ? "Updating..." : "Adding..."}
                      </>
                    ) : (
                      <>
                        {editingId ? <Check className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                        {editingId ? "Update Payment" : "Add Payment"}
                      </>
                    )}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={handleCancelEdit} className="rounded-xl">
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Configured Payment Details */}
          <Card className="border-border/40">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-display text-lg">Configured Payments</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Payment options shown to your clients
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : paymentDetails.length === 0 ? (
                <div className="text-center py-16 rounded-xl border border-dashed border-border/50 bg-muted/20">
                  <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="h-7 w-7 text-muted-foreground/50" />
                  </div>
                  <p className="font-medium text-foreground">No payment methods yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Add your first M-Pesa option using the form</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentDetails.map((payment, index) => {
                    const isEven = index % 2 === 0;
                    
                    return (
                      <div 
                        key={payment.id} 
                        className={`rounded-xl border p-4 transition-all duration-200 ${
                          payment.is_active 
                            ? `border-l-4 ${isEven ? 'border-l-primary border-primary/20 bg-primary/5' : 'border-l-secondary border-secondary/20 bg-secondary/5'}` 
                            : 'border-border/40 bg-muted/30'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                              payment.is_active 
                                ? isEven ? 'bg-primary/15' : 'bg-secondary/15'
                                : 'bg-muted'
                            }`}>
                              <Smartphone className={`h-4 w-4 ${
                                payment.is_active 
                                  ? isEven ? 'text-primary' : 'text-secondary'
                                  : 'text-muted-foreground'
                              }`} />
                            </div>
                            <div>
                              <h4 className="font-display font-semibold text-sm">{payment.name}</h4>
                              <span className="text-xs text-muted-foreground">
                                {payment.payment_type === 'mpesa_paybill' ? 'Paybill' : 'Till'}
                              </span>
                            </div>
                          </div>
                          <Badge 
                            className={payment.is_active 
                              ? "bg-primary/10 text-primary border-primary/20" 
                              : "bg-muted text-muted-foreground border-border/50"
                            }
                          >
                            {payment.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs mb-3 bg-background/50 rounded-lg p-3">
                          {payment.payment_type === 'mpesa_paybill' ? (
                            <>
                              <div>
                                <span className="text-muted-foreground">Paybill</span>
                                <p className="font-semibold text-foreground">{payment.paybill}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Account</span>
                                <p className="font-semibold text-foreground">{payment.account_no}</p>
                              </div>
                            </>
                          ) : (
                            <div>
                              <span className="text-muted-foreground">Till Number</span>
                              <p className="font-semibold text-foreground">{payment.till}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-border/30">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={payment.is_active}
                              onCheckedChange={() => handleToggleActive(payment)}
                              className="data-[state=checked]:bg-primary"
                            />
                            <span className="text-xs text-muted-foreground">Show to clients</span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(payment)}
                              className="h-8 w-8"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteClick(payment.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Payment Method"
        description="Are you sure you want to delete this payment method? This action cannot be undone."
      />
    </>
  );
};

export default Payments;