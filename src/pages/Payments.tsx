import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Smartphone, Plus, Trash2, Edit2, Check, X } from "lucide-react";
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
      // Update existing
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
      // Create new
      await createPayment.mutateAsync({
        payment_type: paymentType,
        name,
        paybill: paymentType === 'mpesa_paybill' ? paybill : undefined,
        account_no: paymentType === 'mpesa_paybill' ? accountNo : undefined,
        till: paymentType === 'mpesa_till' ? till : undefined,
      });
    }

    // Reset form
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
      <div className="container mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
            Payment Settings
          </h1>
          <p className="text-muted-foreground">Configure payment options for clients in Kenya</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Add/Edit Payment Form */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                {editingId ? "Edit Payment Details" : "Add Payment Details"}
              </CardTitle>
              <CardDescription>
                {editingId ? "Update payment method details" : "Configure a new payment option for Kenya"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Main Business Account"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="type">Payment Type</Label>
                  <Select value={paymentType} onValueChange={(value: any) => setPaymentType(value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mpesa_paybill">Mpesa - Paybill</SelectItem>
                      <SelectItem value="mpesa_till">Mpesa - Till</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {paymentType === 'mpesa_paybill' ? (
                  <>
                    <div>
                      <Label htmlFor="paybill">Paybill Number</Label>
                      <Input
                        id="paybill"
                        placeholder="e.g., 522522"
                        value={paybill}
                        onChange={(e) => setPaybill(e.target.value)}
                        required
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="accountNo">Account Number</Label>
                      <Input
                        id="accountNo"
                        placeholder="e.g., 44846464"
                        value={accountNo}
                        onChange={(e) => setAccountNo(e.target.value)}
                        required
                        className="mt-2"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <Label htmlFor="till">Till Number</Label>
                    <Input
                      id="till"
                      placeholder="e.g., 4454554"
                      value={till}
                      onChange={(e) => setTill(e.target.value)}
                      required
                      className="mt-2"
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
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
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Configured Payment Details */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                Configured Payment Details
              </CardTitle>
              <CardDescription>
                Pre-set payment options shown to clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : paymentDetails.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Smartphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No payment methods configured yet</p>
                  <p className="text-sm mt-1">Add your first payment option using the form</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentDetails.map((payment) => (
                    <Card key={payment.id} className={`border-2 ${payment.is_active ? 'border-primary/30 bg-primary/5' : 'border-muted bg-muted/30'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-primary" />
                            <h4 className="font-semibold">{payment.name}</h4>
                          </div>
                          <Badge variant={payment.is_active ? "default" : "secondary"}>
                            {payment.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm mb-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type:</span>
                            <span className="font-medium">
                              {payment.payment_type === 'mpesa_paybill' ? 'Mpesa Paybill' : 'Mpesa Till'}
                            </span>
                          </div>

                          {payment.payment_type === 'mpesa_paybill' ? (
                            <>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Paybill:</span>
                                <span className="font-medium">{payment.paybill}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Account No:</span>
                                <span className="font-medium">{payment.account_no}</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Till:</span>
                              <span className="font-medium">{payment.till}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={payment.is_active}
                              onCheckedChange={() => handleToggleActive(payment)}
                            />
                            <span className="text-xs text-muted-foreground">Show to clients</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(payment)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteClick(payment.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
