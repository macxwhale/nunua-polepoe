import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  FileText,
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
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
              <Button onClick={() => navigate("/auth")}>
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Shield className="h-4 w-4" />
            Trusted by Kenyan businesses
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Manage Credit Sales
            <br />
            <span className="text-primary">With Confidence</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            The all-in-one credit management system for Kenyan businesses. Track client balances,
            create invoices, and monitor payments effortlessly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="text-lg px-8 py-6" onClick={() => navigate("/auth")}>
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
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
      <section className="py-20 px-4 sm:px-6 lg:px-8">
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
              <div className="text-4xl sm:text-5xl font-bold mb-2">KES 200M+</div>
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
