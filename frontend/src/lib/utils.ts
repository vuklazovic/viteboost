import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  try {
    // Handle server timestamps that are in UTC but missing 'Z' suffix
    let normalizedDateString = dateString;

    // If the string looks like "2025-09-23T10:05:41.250143" (no timezone info)
    // and appears to be from our API, treat it as UTC
    if (dateString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+$/) && !dateString.endsWith('Z')) {
      normalizedDateString = dateString + 'Z';
    }

    const date = new Date(normalizedDateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Date formatting error:', error, dateString);
    return 'Unknown date';
  }
}
