'use client';

interface ContactButtonProps {
  onContact: () => void;
}

export default function ContactButton({ onContact }: ContactButtonProps) {
  return (
    <div
      onClick={onContact}
      className="mx-6 mb-5 p-5 rounded-xl bg-white/[0.03] border border-white/[0.08] cursor-pointer flex items-center gap-4 transition-all duration-200 hover:bg-white/[0.05]"
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="#a78bfa" width="20" height="20">
          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
        </svg>
      </div>
      <div className="flex-1">
        <h4 className="text-[15px] font-bold text-white m-0">
          Contact the Band
        </h4>
        <p className="text-xs text-white/50 m-0">
          Booking inquiries, collabs, or just say hi
        </p>
      </div>
      <svg
        viewBox="0 0 24 24"
        fill="rgba(255,255,255,0.3)"
        width="20"
        height="20"
      >
        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
      </svg>
    </div>
  );
}
