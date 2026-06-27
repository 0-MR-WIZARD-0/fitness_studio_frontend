import { clsx } from "@/lib/clsx";

export function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("mx-auto w-full px-5 md:px-20", className)}>
      {children}
    </div>
  );
}

export function Grid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("grid grid-cols-12 gap-4 md:gap-6", className)}>
      {children}
    </div>
  );
}
