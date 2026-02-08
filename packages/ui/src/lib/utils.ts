import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: string | number, currency: string = "EUR"): string {
  const numPrice = typeof price === "string" ? parseFloat(price) : price
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency,
  }).format(numPrice)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d)
}
