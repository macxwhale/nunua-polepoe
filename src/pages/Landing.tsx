import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  FileText,
  Menu,
  Package,
  Shield,
  Users,
  Wallet
} from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const NavLinks = ({ mobile = false, onClick = () => { } }: { mobile?: boolean; onClick?: () => void }) => (
    <div className={mobile ? "flex flex-col gap-4 mt-8" : "hidden md:flex items-center gap-8 mr-8"}>
      <button
        onClick={() => { scrollToSection('features'); onClick(); }}
        className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors text-left"
      >
        Features
      </button>
      <button
        onClick={() => { scrollToSection('pricing'); onClick(); }}
        className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors text-left"
      >
        Pricing
      </button>
      <button
        onClick={() => { scrollToSection('benefits'); onClick(); }}
        className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors text-left"
      >
        Benefits
      </button>
    </div>
  );

  const features = [
    {
      icon: Users,
      title: "Client Management",
      description: "Track client balances, transactions, and communication all in one place."
    },
    {
      icon: FileText,
      title: "Smart Invoicing",
      description: "Generate professional invoices instantly with automated calculations."
    },
    {
      icon: Wallet,
      title: "Credit Tracking",
      description: "Monitor credit balances, top-ups, and payment schedules with ease."
    },
    {
      icon: Package,
      title: "Product Catalog",
      description: "Organize your products and services with flexible pricing options."
    },
    {
      icon: Bell,
      title: "Real-time Notifications",
      description: "Stay informed with instant alerts on payments and client activities."
    },
    {
      icon: BarChart3,
      title: "Business Insights",
      description: "Visual dashboards to track revenue, growth, and client metrics."
    }
  ];

  const benefits = [
    "Unlimited clients and invoices",
    "Real-time balance tracking",
    "Multi-tenant architecture",
    "Secure data encryption",
    "Mobile-friendly interface",
    "Instant PDF generation"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img src="/logo.png" alt="Lipia Pole Pole Logo" className="h-12 w-auto" />
            </div>

            <div className="flex items-center gap-2">
              <NavLinks />
              <div className="hidden md:flex items-center gap-3">
                <Button variant="ghost" onClick={() => navigate("/auth")}>
                  Sign In
                </Button>
                <Button onClick={() => navigate("/auth")}>
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {/* Mobile Menu */}
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                    <SheetHeader className="text-left">
                      <SheetTitle>
                        <img src="/logo.png" alt="Logo" className="h-10 w-auto mb-4" />
                      </SheetTitle>
                    </SheetHeader>
                    <NavLinks mobile onClick={() => { }} />
                    <div className="flex flex-col gap-3 mt-8 pt-8 border-t">
                      <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/auth")}>
                        Sign In
                      </Button>
                      <Button className="w-full justify-start" onClick={() => navigate("/auth")}>
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[5%] w-[30%] h-[30%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[10%] right-[5%] w-[35%] h-[35%] bg-primary/10 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '3s' }} />
          <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left space-y-8 max-w-2xl mx-auto lg:mx-0">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-xs sm:text-sm font-bold tracking-wide uppercase animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Shield className="h-4 w-4" />
                Trusted by 500+ Kenyan businesses
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-black text-foreground leading-[1.05] tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                Manage Credit Sales <br />
                <span className="text-primary italic relative">
                  With Confidence
                  <span className="absolute bottom-2 left-0 w-full h-3 bg-primary/10 -z-10 rounded-full" />
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                The most intuitive credit management system for Kenyan growth.
                Track balances, automate invoicing, and monitor collections in one
                <span className="text-foreground font-semibold"> secure, high-speed</span> platform.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                <Button size="lg" className="text-base px-8 py-7 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02]" onClick={() => navigate("/auth")}>
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="text-base px-8 py-7 rounded-2xl border-2 hover:bg-primary/5 transition-all duration-300">
                  Watch Product Tour
                </Button>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-6 pt-6 animate-in fade-in duration-1000 delay-500">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  <span className="text-foreground font-bold italic">Excellent</span> 4.9/5 from 200+ reviews
                </div>
              </div>
            </div>

            {/* Right Visual Showcase */}
            <div className="flex-1 w-full max-w-[600px] relative animate-in fade-in zoom-in-95 duration-1000 delay-300">
              <div className="relative group">
                {/* Decorative glow */}
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-primary/10 rounded-[2.5rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />

                <Card className="relative border-border/40 bg-card/70 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden border-2">
                  <CardContent className="p-0">
                    <div className="bg-muted/30 border-b border-border/40 p-4 flex items-center justify-between">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-destructive/60" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                        <div className="w-3 h-3 rounded-full bg-green-500/60" />
                      </div>
                      <div className="bg-background/80 px-3 py-1 rounded-full text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                        Real-time Dashboard
                      </div>
                    </div>

                    <div className="p-8 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-1">
                          <p className="text-[10px] font-bold text-primary tracking-wider uppercase">Active Invoices</p>
                          <p className="text-2xl font-black text-foreground">1,280</p>
                        </div>
                        <div className="bg-green-500/5 p-4 rounded-2xl border border-green-500/10 space-y-1">
                          <p className="text-[10px] font-bold text-green-600 tracking-wider uppercase">Total Recieved</p>
                          <p className="text-2xl font-black text-foreground">KSh 4.2M</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="h-4 bg-muted/40 rounded-full w-3/4" />
                        <div className="h-32 bg-muted/20 rounded-2xl relative overflow-hidden flex items-end px-4 gap-2 py-4">
                          {/* Simple bar chart mockup */}
                          {[40, 70, 45, 90, 65, 80, 50, 85, 60, 95].map((h, i) => (
                            <div key={i} className="flex-1 bg-primary/20 rounded-t-md transition-all duration-700 hover:bg-primary/40 cursor-default" style={{ height: `${h}%` }} />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 pt-2">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <BarChart3 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="h-2.5 bg-muted rounded-full w-1/2" />
                          <div className="h-2 bg-muted/50 rounded-full w-1/3" />
                        </div>
                        <div className="text-xs font-bold text-green-600">+12.5%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Floating elements */}
                <div className="absolute -top-6 -right-6 bg-white dark:bg-black p-4 rounded-2xl shadow-xl border border-border/40 animate-bounce-subtle hidden sm:block">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none">New Payment</p>
                      <p className="text-xs font-black text-foreground">KSh 15,000</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-6 bg-white dark:bg-black p-4 rounded-2xl shadow-xl border border-border/40 animate-float hidden sm:block delay-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none">New Clients</p>
                      <p className="text-xs font-black text-foreground">+42 this week</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to streamline your business operations and boost productivity.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card"
              >
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Built for Kenyan Businesses
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Whether you're a shop owner, distributor, or growing enterprise,
                Lipia Pole Pole scales with your needs.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-3xl p-8">
                <div className="bg-card rounded-2xl shadow-2xl p-6 border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-3 w-3 rounded-full bg-destructive" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <div className="space-y-4">
                    <div className="h-8 bg-muted rounded-lg w-3/4" />
                    <div className="h-24 bg-muted/50 rounded-lg" />
                    <div className="flex gap-4">
                      <div className="h-10 bg-primary/20 rounded-lg flex-1" />
                      <div className="h-10 bg-muted rounded-lg flex-1" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that best fits your business needs. All plans include
              full access to all features.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Monthly Tier */}
            <Card className="relative overflow-hidden border-border/50 bg-card hover:shadow-xl transition-all duration-300 flex flex-col">
              <CardContent className="p-8 flex-1 flex flex-col">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">Monthly</h3>
                  <p className="text-muted-foreground text-sm">Best for small businesses starting out.</p>
                </div>
                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-primary">KES 1,700</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="text-muted-foreground line-through">KES 2,500</span>
                    <span className="ml-2 text-green-600 font-medium">Save 32%</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {[
                    "Unlimited Clients",
                    "Smart Invoicing",
                    "Real-time Notifications",
                    "Mobile App Access"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant="outline" onClick={() => navigate("/auth")}>
                  Select Monthly
                </Button>
              </CardContent>
            </Card>

            {/* 6 Months Tier */}
            <Card className="relative overflow-hidden border-primary bg-card shadow-lg hover:shadow-xl transition-all duration-300 transform md:-translate-y-2 flex flex-col scale-105 z-10">
              <div className="bg-primary text-primary-foreground text-center py-1.5 text-sm font-bold">
                MOST POPULAR
              </div>
              <CardContent className="p-8 flex-1 flex flex-col">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">6 Months</h3>
                  <p className="text-muted-foreground text-sm">Perfect for growing enterprises.</p>
                </div>
                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-primary">KES 9,600</span>
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="text-muted-foreground line-through">KES 12,000</span>
                    <span className="ml-2 text-green-600 font-medium">Save 20%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Equivalent to KES 1,600/mo</p>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {[
                    "Priority Support",
                    "Business Insights",
                    "PDF Report Export",
                    "Everything in Monthly"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full shadow-md" onClick={() => navigate("/auth")}>
                  Select 6 Months
                </Button>
              </CardContent>
            </Card>

            {/* 12 Months Tier */}
            <Card className="relative overflow-hidden border-border/50 bg-card hover:shadow-xl transition-all duration-300 flex flex-col">
              <CardContent className="p-8 flex-1 flex flex-col">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">12 Months</h3>
                  <p className="text-muted-foreground text-sm">Best value for long-term partners.</p>
                </div>
                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-primary">KES 17,000</span>
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="text-muted-foreground line-through">KES 19,600</span>
                    <span className="ml-2 text-green-600 font-medium">Save 13%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Equivalent to KES 1,417/mo</p>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {[
                    "Dedicated Account Manager",
                    "Custom Branding",
                    "Bulk Data Operations",
                    "Everything in 6 Months"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant="outline" onClick={() => navigate("/auth")}>
                  Select 12 Months
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl sm:text-5xl font-bold mb-2">500+</div>
              <div className="text-primary-foreground/80">Active Businesses</div>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-bold mb-2">50K+</div>
              <div className="text-primary-foreground/80">Invoices Generated</div>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-bold mb-2">KES 1M+</div>
              <div className="text-primary-foreground/80">Credit Tracked</div>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-bold mb-2">99.9%</div>
              <div className="text-primary-foreground/80">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
            Ready to Simplify Your Credit Management?
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Join hundreds of Kenyan businesses already using Lipia Pole Pole to manage their
            credit sales and customer balances.
          </p>
          <Button size="lg" className="text-lg px-10 py-6" onClick={() => navigate("/auth")}>
            Get Started for Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required • Free 14-day trial
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center">
              <img src="/logo.png" alt="Lipia Pole Pole Logo" className="h-10 w-auto" />
            </div>
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} Lipia Pole Pole. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
