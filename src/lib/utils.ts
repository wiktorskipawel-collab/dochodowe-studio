import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Łączy klasy Tailwind bez konfliktów (standardowa funkcja shadcn/ui).
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
