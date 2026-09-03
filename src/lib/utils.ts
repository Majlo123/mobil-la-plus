import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Spaja Tailwind klase bez konflikata (shadcn-stil). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
