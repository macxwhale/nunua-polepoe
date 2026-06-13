import { useState } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogOverlay,
} from '@/components/ui/dialog';

const WHATSAPP_PHONE = '+254719308600';
const BUSINESS_NAME = 'Lipia Pole Pole';

// WhatsApp SVG Icon component for brand consistency
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 32 32"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.926 15.926 0 0016.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.334 22.594c-.39 1.1-1.932 2.014-3.186 2.28-.858.18-1.978.324-5.75-1.236-4.828-1.998-7.936-6.9-8.176-7.22-.23-.32-1.936-2.576-1.936-4.914s1.226-3.486 1.662-3.964c.39-.428 1.03-.64 1.644-.64.198 0 .376.01.536.018.436.02.654.046.942.728.36.852 1.236 3.012 1.344 3.232.11.22.182.478.036.768-.136.3-.206.486-.406.746-.2.26-.42.58-.6.778-.2.22-.408.46-.176.9.232.44 1.032 1.7 2.216 2.754 1.524 1.358 2.806 1.78 3.206 1.978.4.198.634.166.868-.1.244-.278 1.042-1.216 1.32-1.634.268-.418.546-.348.912-.21.372.13 2.354 1.11 2.756 1.312.4.2.668.302.766.468.1.166.1.966-.29 2.066z" />
  </svg>
);

export const WhatsAppButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleStartChat = () => {
    const message = encodeURIComponent('Hello! I\'d like to learn more about Lipia Pole Pole.');
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE.replace(/\+/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating WhatsApp Button with breathing animation */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 animate-whatsapp-pulse"
        aria-label="Contact us on WhatsApp"
      >
        <WhatsAppIcon className="h-7 w-7" />
      </button>

      {/* WhatsApp Chat Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[360px] p-0 overflow-hidden border-0 rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="bg-[#075E54] p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
              <img src="/logo.png" alt={BUSINESS_NAME} className="h-10 w-10 object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-base leading-tight">{BUSINESS_NAME}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-2 w-2 rounded-full bg-[#25D366]" />
                <p className="text-white/80 text-xs">Online — ready to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Chat bubble */}
          <div className="p-4 bg-[#ECE5DD]">
            <div className="bg-white rounded-lg rounded-tl-none p-4 shadow-sm max-w-[280px]">
              <p className="text-gray-800 text-sm leading-relaxed">
                👋 Hi there! Welcome to <strong>Lipia Pole Pole</strong>. Have a question about managing your credit sales or getting started? We're here to help!
              </p>
              <p className="text-[10px] text-gray-400 text-right mt-2">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Start chat button */}
          <div className="p-4 bg-white border-t">
            <button
              onClick={handleStartChat}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-semibold text-sm transition-colors shadow-sm"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Start Chat on WhatsApp
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">Typically replies within minutes</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom animation styles */}
      <style>{`
        @keyframes whatsapp-pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.4);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 0 12px rgba(37, 211, 102, 0);
          }
        }
        .animate-whatsapp-pulse {
          animation: whatsapp-pulse 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};
