import { MessageCircle } from 'lucide-react';

const WHATSAPP_PHONE = '+254719308600';

export const WhatsAppButton = () => {
  const handleClick = () => {
    const message = encodeURIComponent('Hello! I would like to get in touch.');
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE.replace(/\+/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="h-7 w-7" fill="currentColor" />
    </button>
  );
};
