import { Button } from "@/components/ui/button";
import { ArrowLeft, Compass, Home, Map } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/50 p-6 selection:bg-primary/10">
      <div className="max-w-xl w-full text-center space-y-12 animate-in fade-in zoom-in duration-700">

        {/* Visual Element */}
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
          <div className="relative p-10 bg-white rounded-[40px] border border-border shadow-2xl shadow-slate-200/50 rotate-3 hover:rotate-0 transition-transform duration-500 group">
            <div className="absolute -top-6 -left-6 p-4 bg-primary text-white rounded-2xl shadow-xl shadow-primary/30 group-hover:scale-110 transition-transform">
              <Compass className="h-8 w-8 animate-[spin_10s_linear_infinite]" />
            </div>
            <div className="space-y-2">
              <h1 className="text-[120px] font-black leading-none tracking-tighter text-slate-900 select-none">
                404
              </h1>
              <div className="h-1.5 w-1/2 bg-primary/20 mx-auto rounded-full overflow-hidden">
                <div className="h-full bg-primary w-1/3 animate-[shimmer_2s_infinite_ease-in-out]" />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Navigation Drift Error</h2>
            <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-md mx-auto">
              We couldn't resolve the business node at <code className="bg-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-700">{location.pathname}</code>.
              The signal may have been lost or the resource relocated.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="h-14 px-8 rounded-2xl font-black text-sm gap-2.5 shadow-xl shadow-primary/20 active:scale-95 transition-all">
              <Link to="/">
                <Home className="h-4 w-4" />
                Return to Surface
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 px-8 rounded-2xl border-border font-bold text-sm gap-2.5 bg-white hover:bg-slate-50 active:scale-95 transition-all text-slate-600">
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Return to Dashboard
              </Link>
            </Button>
          </div>
        </div>

        {/* System ID */}
        <div className="flex items-center justify-center gap-3 opacity-30 select-none">
          <Map className="h-3 w-3 text-slate-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">LipiaPolePole Infrastructure Grid</span>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
};

export default NotFound;
