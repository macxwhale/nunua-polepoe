import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, User, LogOut, Smartphone, Menu, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useActivePaymentDetails } from '@/hooks/usePayments';

interface ClientData {
  id: string;
  name: string;
  phone_number: string;
  total_balance: number;
  status: string;
}

const ClientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { data: paymentDetails = [], isLoading: paymentsLoading } = useActivePaymentDetails();

  useEffect(() => {
    if (user) {
      fetchClientData();
    }
  }, [user]);

  const fetchClientData = async () => {
    try {
      setLoading(true);

      // Get phone number from user's email
      const phoneNumber = user?.email?.replace('@client.internal', '');

      if (!phoneNumber) {
        toast.error('Invalid user data');
        return;
      }

      // Fetch client data
      const { data: clientInfo, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      if (clientError) {
        console.error('Error fetching client:', clientError);
        toast.error('Failed to load account information');
        return;
      }

      setClientData(clientInfo);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Logged out successfully');
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  if (loading || paymentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Account Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We couldn't find an account associated with your phone number.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Menu className="h-6 w-6 text-muted-foreground" />
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {clientData?.name || 'My Account'}
                </h2>
                <p className="text-sm text-muted-foreground">{clientData?.phone_number}</p>
              </div>
            </div>
            <Button 
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Log Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
            Payment Options
          </h1>
          <p className="text-muted-foreground">Choose a payment method below</p>
        </div>

        {/* Payment Options Grid */}
        {paymentDetails.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
                <Smartphone className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Payment Methods</h3>
              <p className="text-center text-muted-foreground max-w-sm">
                No payment methods have been configured yet. Please contact support.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paymentDetails.map((payment) => (
              <Card 
                key={payment.id} 
                className="group overflow-hidden bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-teal-500/10 hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-2xl border-2 border-primary/20"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                      <Smartphone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{payment.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {payment.payment_type === 'mpesa_paybill' ? 'Mpesa Paybill' : 'Mpesa Till'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {payment.payment_type === 'mpesa_paybill' ? (
                      <>
                        <div className="p-3 bg-background/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Paybill Number</p>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-lg font-bold text-foreground">{payment.paybill}</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopy(payment.paybill || '', `paybill-${payment.id}`)}
                              className="h-8 w-8 p-0"
                            >
                              {copiedId === `paybill-${payment.id}` ? (
                                <CheckCircle2 className="h-4 w-4 text-success" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="p-3 bg-background/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Account Number</p>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-lg font-bold text-foreground">{payment.account_no}</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopy(payment.account_no || '', `account-${payment.id}`)}
                              className="h-8 w-8 p-0"
                            >
                              {copiedId === `account-${payment.id}` ? (
                                <CheckCircle2 className="h-4 w-4 text-success" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-3 bg-background/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Till Number</p>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-lg font-bold text-foreground">{payment.till}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopy(payment.till || '', `till-${payment.id}`)}
                            className="h-8 w-8 p-0"
                          >
                            {copiedId === `till-${payment.id}` ? (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientDashboard;
