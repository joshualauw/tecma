import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function standardizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function limitText(text: string, limit: number = 120): string {
  return text.length > limit ? text.slice(0, limit) + "..." : text;
}

export function firstLetterUppercase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
