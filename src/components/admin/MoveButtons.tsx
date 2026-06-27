"use client";

export function MoveButtons({
  onUp,
  onDown,
  disableUp,
  disableDown,
}: {
  onUp: () => void;
  onDown: () => void;
  disableUp?: boolean;
  disableDown?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={onUp}
        disabled={disableUp}
        aria-label="Выше"
        className="grid h-7 w-7 place-items-center rounded-md border-gold text-heading/80 hover:text-heading disabled:opacity-30"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onDown}
        disabled={disableDown}
        aria-label="Ниже"
        className="grid h-7 w-7 place-items-center rounded-md border-gold text-heading/80 hover:text-heading disabled:opacity-30"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
