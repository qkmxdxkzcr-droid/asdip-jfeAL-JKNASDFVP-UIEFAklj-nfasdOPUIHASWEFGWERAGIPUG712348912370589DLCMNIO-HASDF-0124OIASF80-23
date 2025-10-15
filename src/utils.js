import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function createPageUrl(pageName) {
  const baseUrl = process.env.NODE_ENV === 'production' ? '/some-bulshit-bracker-scheduler' : '';
  return `${baseUrl}/${pageName.toLowerCase()}`;
}
