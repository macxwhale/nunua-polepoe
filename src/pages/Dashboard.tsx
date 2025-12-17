import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Users, FileText, TrendingUp, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  created_at: string;
  client_id: string;
}

interface Client {
  id: string;
  name: string | null;
  total_balance: number;
}

interface Transaction {
  amount: number;
  type: string;
  date: string;
  client_id: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalClients: 0,
    totalInvoices: 0,
    pendingAmount: 0,
    totalRevenue: 0,
    unpaidInvoices: 0,
  });
  const [loading, setLoading] = useState(true);
  const [latestInvoices, setLatestInvoices] = useState<(Invoice & { clientName: string })[]>([]);
  const [topClients, setTopClients] = useState<{ name: string; totalSpent: number }[]>([]);
  const [paymentDistribution, setPaymentDistribution] = useState({ paid: 0, unpaid: 0 });
  const [weeklyPayments, setWeeklyPayments] = useState<{ day: string; thisWeek: number; lastWeek: number }[]>([]);
  const [yearlyCollection, setYearlyCollection] = useState<{ month: string; amount: number }[]>([]);

  const getUserName = () => {
    if (!user) return "there";
    const name = user.user_metadata?.full_name || user.email?.split('@')[0] || "there";
    return name.split(' ')[0];
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [clientsRes, invoicesRes, transactionsRes] = await Promise.all([
        supabase.from("clients").select("*"),
        supabase.from("invoices").select("*").order("created_at", { ascending: false }),
        supabase.from("transactions").select("*"),
      ]);

      const clients = clientsRes.data || [];
      const invoices = invoicesRes.data || [];
      const transactions = transactionsRes.data || [];

      // Basic stats
      const totalClients = clients.length;
      const totalInvoices = invoices.length;
      const pendingInvoices = invoices.filter((inv) => inv.status === "pending");
      const paidInvoices = invoices.filter((inv) => inv.status === "paid");
      const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
      const totalRevenue = transactions
        .filter((txn) => txn.type === "payment")
        .reduce((sum, txn) => sum + Number(txn.amount), 0);

      setStats({
        totalClients,
        totalInvoices,
        pendingAmount,
        totalRevenue,
        unpaidInvoices: pendingInvoices.length,
      });

      // Payment distribution
      setPaymentDistribution({
        paid: paidInvoices.length,
        unpaid: pendingInvoices.length,
      });

      // Latest invoices with client names
      const clientMap = new Map(clients.map((c) => [c.id, c.name || "Unknown"]));
      const latest = invoices.slice(0, 5).map((inv) => ({
        ...inv,
        clientName: clientMap.get(inv.client_id) || "Unknown",
      }));
      setLatestInvoices(latest);

      // Top clients by total payments
      const clientPayments = new Map<string, number>();
      transactions
        .filter((t) => t.type === "payment")
        .forEach((t) => {
          const current = clientPayments.get(t.client_id) || 0;
          clientPayments.set(t.client_id, current + Number(t.amount));
        });

      const topClientsList = Array.from(clientPayments.entries())
        .map(([clientId, total]) => ({
          name: clientMap.get(clientId) || "Unknown",
          totalSpent: total,
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);
      setTopClients(topClientsList);

      // Weekly payments data
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const today = new Date();
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay() + 1);
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);

      const weeklyData = days.map((day, index) => {
        const thisWeekDay = new Date(thisWeekStart);
        thisWeekDay.setDate(thisWeekStart.getDate() + index);
        const lastWeekDay = new Date(lastWeekStart);
        lastWeekDay.setDate(lastWeekStart.getDate() + index);

        const thisWeekTotal = transactions
          .filter((t) => {
            const tDate = new Date(t.date);
            return t.type === "payment" && tDate.toDateString() === thisWeekDay.toDateString();
          })
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const lastWeekTotal = transactions
          .filter((t) => {
            const tDate = new Date(t.date);
            return t.type === "payment" && tDate.toDateString() === lastWeekDay.toDateString();
          })
          .reduce((sum, t) => sum + Number(t.amount), 0);

        return { day, thisWeek: thisWeekTotal, lastWeek: lastWeekTotal };
      });
      setWeeklyPayments(weeklyData);

      // Yearly collection data
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const currentYear = today.getFullYear();
      const yearlyData = months.map((month, index) => {
        const monthTotal = transactions
          .filter((t) => {
            const tDate = new Date(t.date);
            return t.type === "payment" && tDate.getMonth() === index && tDate.getFullYear() === currentYear;
          })
          .reduce((sum, t) => sum + Number(t.amount), 0);
        return { month, amount: monthTotal };
      });
      setYearlyCollection(yearlyData);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const pieData = [
    { name: "Paid", value: paymentDistribution.paid },
    { name: "Unpaid", value: paymentDistribution.unpaid },
  ];
  const PIE_COLORS = ["hsl(142, 70%, 49%)", "hsl(6, 78%, 57%)"];

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 p-4 sm:p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const totalPieValue = paymentDistribution.paid + paymentDistribution.unpaid;
  const paidPercentage = totalPieValue > 0 ? Math.round((paymentDistribution.paid / totalPieValue) * 100) : 0;
  const unpaidPercentage = totalPieValue > 0 ? Math.round((paymentDistribution.unpaid / totalPieValue) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-4 sm:p-6 bg-muted/30 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, {getUserName()}! Here's your business summary.
          </p>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue - Green */}
        <Card 
          className="overflow-hidden cursor-pointer hover-lift bg-primary text-primary-foreground border-0 shadow-lg"
          onClick={() => navigate('/payments')}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-white/80" />
              <span className="text-xs sm:text-sm font-medium opacity-90">Total Revenue</span>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold">
              KES {stats.totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        {/* Pending Payments - Red */}
        <Card 
          className="overflow-hidden cursor-pointer hover-lift bg-destructive text-destructive-foreground border-0 shadow-lg"
          onClick={() => navigate('/invoices')}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-white/80" />
              <span className="text-xs sm:text-sm font-medium opacity-90">Pending Payments</span>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold">
              KES {stats.pendingAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        {/* Active Clients - White */}
        <Card 
          className="overflow-hidden cursor-pointer hover-lift shadow-lg"
          onClick={() => navigate('/clients')}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Active Clients</p>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                  {stats.totalClients}
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-muted rounded-full">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unpaid Invoices - White */}
        <Card 
          className="overflow-hidden cursor-pointer hover-lift shadow-lg"
          onClick={() => navigate('/invoices')}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Unpaid Invoices</p>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                  {stats.unpaidInvoices}
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-muted rounded-full">
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Payment Records Bar Chart */}
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg font-semibold">Payment Records</CardTitle>
            <div className="flex gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary" />
                <span className="text-muted-foreground">This Week Payments</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-destructive" />
                <span className="text-muted-foreground">Last Week Payments</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weeklyPayments} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="thisWeek" fill="hsl(142, 70%, 49%)" radius={[4, 4, 0, 0]} name="This Week" />
                <Bar dataKey="lastWeek" fill="hsl(6, 78%, 57%)" radius={[4, 4, 0, 0]} name="Last Week" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Distribution Pie Chart */}
        <Card className="shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg font-semibold">Payment Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <span className="text-muted-foreground">Unpaid Invoices</span>
                </div>
                <span className="font-medium">{unpaidPercentage}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Paid Invoices</span>
                </div>
                <span className="font-medium">{paidPercentage}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices and Top Clients Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Latest Invoices Table */}
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg font-semibold">Latest Invoices</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Invoice #</TableHead>
                    <TableHead className="text-xs">Amount</TableHead>
                    <TableHead className="text-xs">Client</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latestInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No invoices yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    latestInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate('/invoices')}>
                        <TableCell className="font-medium text-xs sm:text-sm">{invoice.invoice_number}</TableCell>
                        <TableCell className="text-xs sm:text-sm">KES {invoice.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{invoice.clientName}</TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {new Date(invoice.created_at).toLocaleDateString('en-GB')}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={invoice.status === "paid" ? "default" : "destructive"}
                            className={`text-xs ${invoice.status === "paid" ? "bg-primary" : "bg-destructive"}`}
                          >
                            {invoice.status === "paid" ? "Paid" : "Unpaid"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Best Performing Clients */}
        <Card className="shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg font-semibold">Best Performing Clients</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {topClients.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No data yet</p>
              ) : (
                topClients.map((client, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate('/clients')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium truncate max-w-[120px]">{client.name}</span>
                    </div>
                    <Badge variant="default" className="bg-primary text-xs">
                      KES {client.totalSpent.toLocaleString()}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Yearly Collection Chart */}
      <Card className="shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg font-semibold">Collection Across the Year</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={yearlyCollection} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 70%, 49%)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(142, 70%, 49%)" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(value) => `${value / 1000}k`}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="hsl(142, 70%, 49%)" 
                fillOpacity={1} 
                fill="url(#colorAmount)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
