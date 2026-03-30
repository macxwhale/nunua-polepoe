import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mail, User, Phone, Save, Loader2, ShieldCheck, Clock, CheckCircle2, CreditCard, Zap, AlertCircle, Paintbrush, Plus } from 'lucide-react';
import { FeatureGate } from '@/components/FeatureGate';
import { useSubscription } from '@/hooks/useSubscription';
import { paystackConfig } from '@/lib/paystackConfig';
import { toast } from 'sonner';
import { getUserProfile, updateUserProfile, type UserProfile } from '@/api/profile.api';
import { getBillingHistory, cancelSubscription, type BillingHistory } from '@/api/subscription.api';
const Settings = () => {
  const { status, plan, nextPaymentDate, paystackSubscriptionCode, trialDaysLeft, isLoading: loadingSub, refetch: refetchSub } = useSubscription();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
  });

  useEffect(() => {
    fetchProfile();
    fetchBillingHistory();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getUserProfile();
      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        email: data.email || '',
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile settings: ' + (error.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingHistory = async () => {
    if (!profile?.tenant_id) {
       // We'll retry if we don't have tenantId yet or just rely on the first fetch
    }
    
    try {
      setLoadingHistory(true);
      const data = await getBillingHistory(profile?.tenant_id || '');
      setBillingHistory(data);
    } catch (error) {
      console.error('Error fetching billing history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fetch billing history once profile is loaded so we have tenant_id
  useEffect(() => {
    if (profile?.tenant_id) {
      fetchBillingHistory();
    }
  }, [profile?.tenant_id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateUserProfile({
        full_name: formData.full_name,
        email: formData.email,
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!paystackSubscriptionCode) {
      toast.error('Subscription details not found.');
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel your subscription? You will lose access to premium features after your current billing period ends."
    );

    if (!confirmed) return;

    try {
      setCancelling(true);
      await cancelSubscription(paystackSubscriptionCode);
      toast.success('Subscription cancelled. You will not be charged again.');
      refetchSub(); // Refresh subscription info
    } catch (error) {
      console.error('Cancellation error:', error);
      toast.error('Failed to cancel subscription. Please contact support.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account preferences and profile information.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border/40 shadow-lg overflow-hidden">
            <CardHeader className="border-b border-border/10 bg-muted/30 pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your name and contact details used for notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="John Doe"
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        className="pl-10 h-11"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      This email will be used for Paystack payment receipts and system notifications.
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone_number"
                        value={profile?.phone_number || ''}
                        disabled
                        className="pl-10 h-11 bg-muted/50 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">
                      Phone number cannot be changed as it is your primary login identifier.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={saving} className="h-11 px-8 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-lg overflow-hidden">
            <FeatureGate 
              feature="customBranding" 
              fallback="lock"
              upgradeMessage="Unlock custom logos and brand themes on invoices with an Elite plan."
            >
              <CardHeader className="border-b border-border/10 bg-muted/30 pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Paintbrush className="h-5 w-5 text-primary" />
                  Branding & Identity
                </CardTitle>
                <CardDescription>
                  Customize how your business appears to clients on invoices and reports.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Business Logo</Label>
                    <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-2 bg-muted/20">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Plus className="h-5 w-5 text-primary" />
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Upload PNG or JPEG</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label>Primary Brand Color</Label>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary shadow-sm ring-2 ring-primary/20" />
                        <Input value="#22c55e" readOnly className="h-10 font-mono text-xs max-w-[120px]" />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Accent Color</Label>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500 shadow-sm ring-2 ring-amber-500/20" />
                        <Input value="#f59e0b" readOnly className="h-10 font-mono text-xs max-w-[120px]" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end italic text-[10px] text-muted-foreground">
                  Branding changes will automatically apply to all PDF exports.
                </div>
              </CardContent>
            </FeatureGate>
          </Card>

          <Card className="border-border/40 shadow-lg overflow-hidden">
            <CardHeader className="border-b border-border/10 bg-muted/30 pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Billing History
              </CardTitle>
              <CardDescription>
                Review your previous plan payments and subscription renewals.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 px-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/50 border-b border-border/10">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Date</th>
                      <th className="px-6 py-3 font-semibold">Plan</th>
                      <th className="px-6 py-3 font-semibold">Amount</th>
                      <th className="px-6 py-3 font-semibold">Reference</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10">
                    {loadingHistory ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading history...
                        </td>
                      </tr>
                    ) : billingHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground italic">
                          No payment history found.
                        </td>
                      </tr>
                    ) : (
                      billingHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 font-medium">
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-xs font-mono uppercase">
                            {item.plan_code ? item.plan_code.split('_').pop()?.slice(0, 8) : 'Essential'}
                          </td>
                          <td className="px-6 py-4 font-semibold text-foreground">
                            {item.currency} {item.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-[10px] font-mono text-muted-foreground truncate max-w-[100px]" title={item.paystack_reference}>
                            {item.paystack_reference}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-green-500/10 text-green-600 border border-green-500/20">
                              <CheckCircle2 className="h-2 w-2" /> {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-primary/5 border-primary/10">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Verified Account</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your account is secured with end-to-end encryption. Your business data is only accessible by authorized members of your team.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/40 overflow-hidden shadow-md bg-muted/20">
            <CardHeader className="pb-4 border-b border-border/10">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight">Current Plan</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground">
                    {plan === paystackConfig.planCodes.monthly ? 'Monthly Essential' : 
                     plan === paystackConfig.planCodes['6month'] ? '6 Months Professional' : 
                     plan === paystackConfig.planCodes['12month'] ? '12 Months Elite' : 
                     status === 'trial' ? 'Free Trial' : 'No Active Plan'}
                  </p>
                  {status === 'active' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : status === 'trial' ? (
                    <Zap className="h-4 w-4 text-blue-500" />
                  ) : null}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight">Status</p>
                {status === 'active' ? (
                  <div className="flex items-center gap-2 text-sm font-medium text-green-600 bg-green-500/10 px-2 py-1 rounded-md w-fit border border-green-500/20">
                    <CheckCircle2 className="h-3 w-3" /> Active
                  </div>
                ) : status === 'trial' ? (
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-500/10 px-2 py-1 rounded-md w-fit border border-blue-500/20">
                    <Clock className="h-3 w-3" /> Trial ({trialDaysLeft}d left)
                  </div>
                ) : (
                  <div className="text-sm font-medium text-red-600">
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </div>
                )}
              </div>

              {nextPaymentDate && (
                <div className="space-y-1 pt-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight">Next Billing Date</p>
                  <p className="text-sm font-semibold">{new Date(nextPaymentDate).toLocaleDateString()}</p>
                </div>
              )}

              <div className="pt-4 border-t border-border/10 space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full text-xs h-9 bg-background hover:bg-muted font-semibold transition-all shadow-sm"
                  onClick={() => window.location.href = '/subscription'}
                >
                  {status === 'active' ? 'Change My Plan' : 'Upgrade Now'}
                </Button>

                {status === 'active' && paystackSubscriptionCode && (
                  <Button 
                    variant="ghost" 
                    className="w-full text-xs h-9 text-red-500 hover:text-red-600 hover:bg-red-500/10 font-medium transition-all"
                    onClick={handleCancelSubscription}
                    disabled={cancelling}
                  >
                    {cancelling ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-2" />
                    )}
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/40 overflow-hidden shadow-sm bg-muted/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Tenant ID</span>
                <span className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded truncate max-w-[100px]" title={profile?.tenant_id}>
                  {profile?.tenant_id?.slice(0, 8)}...
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Joined</span>
                <span className="text-xs font-medium">
                  {profile ? new Date(profile.created_at).toLocaleDateString() : '-'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
