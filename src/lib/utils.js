import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

export function formatCurrency(amount) {
  if (amount == null) return '₹0.00'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 2,
  }).format(amount)
}

export function statusColor(status) {
  const map = {
    PENDING:     'bg-yellow-100 text-yellow-800',
    CONFIRMED:   'bg-blue-100 text-blue-800',
    CHECKED_IN:  'bg-indigo-100 text-indigo-800',
    IN_PROGRESS: 'bg-purple-100 text-purple-800',
    COMPLETED:   'bg-green-100 text-green-800',
    CANCELLED:   'bg-red-100 text-red-800',
    NO_SHOW:     'bg-gray-100 text-gray-600',
    PAID:        'bg-green-100 text-green-800',
    WAITING:     'bg-yellow-100 text-yellow-800',
    CALLED:      'bg-amber-100 text-amber-800',
    DONE:        'bg-green-100 text-green-800',
    SKIPPED:     'bg-gray-100 text-gray-500',
  }
  return map[status] ?? 'bg-gray-100 text-gray-700'
}
