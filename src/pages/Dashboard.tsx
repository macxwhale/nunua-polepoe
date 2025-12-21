import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
import { Users, Clock } from "lucide-react";

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

      setPaymentDistribution({
        paid: paidInvoices.length,
        unpaid: pendingInvoices.length,
      });

      const clientMap = new Map(clients.map((c) => [c.id, c.name || "Unknown"]));
      const latest = invoices.slice(0, 5).map((inv) => ({
        ...inv,
        clientName: clientMap.get(inv.client_id) || "Unknown",
      }));
      setLatestInvoices(latest);

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
  const PIE_COLORS = ["hsl(142, 70%, 40%)", "hsl(4, 74%, 49%)"];

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-md" />
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2 rounded-md" />
          <Skeleton className="h-64 rounded-md" />
        </div>
      </div>
    );
  }

  const totalPieValue = paymentDistribution.paid + paymentDistribution.unpaid;
  const paidPercentage = totalPieValue > 0 ? Math.round((paymentDistribution.paid / totalPieValue) * 100) : 0;
  const unpaidPercentage = totalPieValue > 0 ? Math.round((paymentDistribution.unpaid / totalPieValue) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">
          Overview
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, {getUserName()}.
        </p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue - Green Card */}
        <Card 
          className="cursor-pointer bg-primary border-0 hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
          onClick={() => navigate('/payments')}
        >
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center gap-2 text-primary-foreground/80 text-xs mb-1">
              <div className="w-2 h-2 rounded-full bg-primary-foreground/60" />
              Total Revenue
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary-foreground tracking-tight">
              KES {stats.totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        {/* Pending Payments - Red Card */}
        <Card 
          className="cursor-pointer bg-destructive border-0 hover:bg-destructive/90 shadow-lg hover:shadow-xl transition-all"
          onClick={() => navigate('/invoices')}
        >
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center gap-2 text-destructive-foreground/80 text-xs mb-1">
              <div className="w-2 h-2 rounded-full bg-destructive-foreground/60" />
              Pending Payments
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-destructive-foreground tracking-tight">
              KES {stats.pendingAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        {/* Active Clients - White Card */}
        <Card 
          className="cursor-pointer hover:bg-muted/50 shadow-lg hover:shadow-xl transition-all"
          onClick={() => navigate('/clients')}
        >
          <CardContent className="p-4 md:p-5 flex justify-between items-start">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Active Clients</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-foreground tracking-tight">
                {stats.totalClients}
              </div>
            </div>
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Unpaid Invoices - White Card */}
        <Card 
          className="cursor-pointer hover:bg-muted/50 shadow-lg hover:shadow-xl transition-all"
          onClick={() => navigate('/invoices')}
        >
          <CardContent className="p-4 md:p-5 flex justify-between items-start">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Unpaid Invoices</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-destructive tracking-tight">
                {stats.unpaidInvoices}
              </div>
            </div>
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <Clock className="h-4 w-4 md:h-5 md:w-5 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-3 grid-cols-1 lg:grid-cols-3">
        {/* Payment Records Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="text-sm font-medium">Payment Records</CardTitle>
              <div className="flex gap-3 text-[10px]">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm bg-primary" />
                  <span className="text-muted-foreground">This Week</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm bg-primary/40" />
                  <span className="text-muted-foreground">Last Week</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyPayments} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  tickFormatter={(value) => `${value / 1000}k`}
                  width={40}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="thisWeek" fill="hsl(142, 70%, 40%)" radius={[4, 4, 0, 0]} name="This Week" />
                <Bar dataKey="lastWeek" fill="hsl(142, 70%, 75%)" radius={[4, 4, 0, 0]} name="Last Week" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Distribution Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Payment Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
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
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-sm bg-success" />
                  <span className="text-muted-foreground">Paid</span>
                </div>
                <span className="font-medium">{paidPercentage}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-sm bg-destructive" />
                  <span className="text-muted-foreground">Unpaid</span>
                </div>
                <span className="font-medium">{unpaidPercentage}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices and Top Clients Row */}
      <div className="grid gap-3 grid-cols-1 lg:grid-cols-3">
        {/* Latest Invoices Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Latest Invoices</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Invoice #</TableHead>
                  <TableHead className="text-xs">Amount</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">Client</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Date</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6 text-xs">
                      No invoices yet
                    </TableCell>
                  </TableRow>
                ) : (
                  latestInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="cursor-pointer" onClick={() => navigate('/invoices')}>
                      <TableCell className="text-xs font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell className="text-xs font-semibold text-primary">KES {invoice.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-xs hidden sm:table-cell">{invoice.clientName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                        {new Date(invoice.created_at).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${invoice.status === "paid" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                          {invoice.status === "paid" ? "Paid" : "Unpaid"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Best Performing Clients */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Best Performing Clients</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {topClients.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-xs">No data yet</p>
              ) : (
                topClients.map((client, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between py-1.5 cursor-pointer hover:bg-muted/50 -mx-1 px-1 rounded"
                    onClick={() => navigate('/clients')}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-[10px] font-medium">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium truncate max-w-[100px]">{client.name}</span>
                    </div>
                    <span className="text-xs font-medium text-success">
                      KES {client.totalSpent.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Yearly Collection Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Collection Across the Year</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={yearlyCollection} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                tickFormatter={(value) => `${value / 1000}k`}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="hsl(var(--foreground))" 
                fillOpacity={1} 
                fill="url(#colorAmount)" 
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
