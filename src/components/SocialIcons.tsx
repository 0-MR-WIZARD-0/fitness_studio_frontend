export function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M21.94 4.3 18.9 19.1c-.23 1.02-.84 1.27-1.7.79l-4.7-3.47-2.27 2.19c-.25.25-.46.46-.95.46l.34-4.8 8.73-7.9c.38-.34-.08-.53-.59-.19l-10.8 6.8-4.65-1.46c-1.01-.32-1.03-1.01.21-1.5l18.2-7.01c.84-.31 1.58.2 1.22 1.29Z" />
    </svg>
  );
}

export function MaxIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 3.6c4.9 0 8.4 3.3 8.4 7.7 0 4.4-3.5 7.7-8.4 7.7-.9 0-1.8-.1-2.6-.3l-3.6 2.1c-.4.2-.9-.1-.8-.6l.6-3c-1.6-1.4-2.5-3.4-2.5-5.6 0-4.4 3.9-8 8.9-8Z" />
    </svg>
  );
}
