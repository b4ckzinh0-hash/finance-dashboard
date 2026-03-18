'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  isPushSupported,
  getPermissionStatus,
  requestPermission,
  notifyUpcomingBill,
  notifyBudgetAlert,
  notifyLowBalance,
} from '@/lib/notifications/push'
import { useTransactions } from './use-transactions'
import { useAccounts } from './use-accounts'
import { useCategories } from './use-categories'
import { usePlanning } from './use-planning'

const PREFS_KEY = 'push_notification_prefs'

export interface PushNotificationPrefs {
  enabled: boolean
  upcomingBills: boolean
  budgetAlerts: boolean
  lowBalance: boolean
  lowBalanceThreshold: number // R$
}

const DEFAULT_PREFS: PushNotificationPrefs = {
  enabled: false,
  upcomingBills: true,
  budgetAlerts: true,
  lowBalance: true,
  lowBalanceThreshold: 100,
}

function loadPrefs(): PushNotificationPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return DEFAULT_PREFS
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_PREFS
  }
}

function savePrefs(prefs: PushNotificationPrefs) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

export function usePushNotifications() {
  const [prefs, setPrefsState] = useState<PushNotificationPrefs>(DEFAULT_PREFS)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [supported] = useState(() => isPushSupported())

  const { transactions } = useTransactions()
  const { accounts } = useAccounts()
  const { categories } = useCategories()
  const { recurringExpenses } = usePlanning()

  useEffect(() => {
    setPrefsState(loadPrefs())
    setPermission(getPermissionStatus())
  }, [])

  const updatePrefs = useCallback((updates: Partial<PushNotificationPrefs>) => {
    setPrefsState((prev) => {
      const next = { ...prev, ...updates }
      savePrefs(next)
      return next
    })
  }, [])

  const enable = useCallback(async (): Promise<boolean> => {
    const result = await requestPermission()
    setPermission(result)
    if (result === 'granted') {
      updatePrefs({ enabled: true })
      return true
    }
    return false
  }, [updatePrefs])

  const disable = useCallback(() => {
    updatePrefs({ enabled: false })
  }, [updatePrefs])

  /**
   * Run all notification checks and fire applicable push notifications.
   * Call this on page load or on a timer.
   */
  const runChecks = useCallback(() => {
    if (!prefs.enabled || permission !== 'granted') return

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // ─── Upcoming bills ────────────────────────────────────────────────
    if (prefs.upcomingBills) {
      recurringExpenses.forEach((expense) => {
        if (!expense.is_active || !expense.next_due_date) return
        const due = new Date(expense.next_due_date)
        due.setHours(0, 0, 0, 0)
        const diff = Math.round((due.getTime() - today.getTime()) / 86400000)
        if (diff >= 0 && diff <= 3) {
          notifyUpcomingBill(expense.name, diff, expense.amount)
        }
      })
    }

    // ─── Budget alerts (spending > 80% of monthly average) ─────────────
    if (prefs.budgetAlerts) {
      const now = new Date()
      const monthTxs = transactions.filter((t) => {
        const d = new Date(t.date)
        return (
          t.type === 'expense' &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        )
      })

      // Group spending by category
      const byCategory = new Map<string, { name: string; total: number }>()
      const categoryMap = new Map(categories.map((c) => [c.id, c.name]))
      monthTxs.forEach((t) => {
        if (!t.category_id) return
        const key = t.category_id
        const catName = categoryMap.get(key) ?? t.description
        if (!byCategory.has(key)) byCategory.set(key, { name: catName, total: 0 })
        byCategory.get(key)!.total += t.amount
      })

      // Compare to last 3-month average
      const past3Months = [1, 2, 3].map((offset) => {
        const d = new Date(now)
        d.setMonth(d.getMonth() - offset)
        return d
      })

      byCategory.forEach(({ name, total }, catId) => {
        let historicalTotal = 0
        let historicalMonths = 0
        past3Months.forEach((m) => {
          const monthTotal = transactions
            .filter((t) => {
              const d = new Date(t.date)
              return (
                t.type === 'expense' &&
                t.category_id === catId &&
                d.getMonth() === m.getMonth() &&
                d.getFullYear() === m.getFullYear()
              )
            })
            .reduce((s, t) => s + t.amount, 0)
          if (monthTotal > 0) {
            historicalTotal += monthTotal
            historicalMonths++
          }
        })

        if (historicalMonths === 0) return
        const avg = historicalTotal / historicalMonths
        const pct = avg > 0 ? (total / avg) * 100 : 0
        if (pct >= 80) {
          notifyBudgetAlert(name, pct)
        }
      })
    }

    // ─── Low balance ────────────────────────────────────────────────────
    if (prefs.lowBalance) {
      accounts.forEach((acc) => {
        if (acc.is_active && acc.balance < prefs.lowBalanceThreshold) {
          notifyLowBalance(acc.name, acc.balance)
        }
      })
    }
  }, [prefs, permission, recurringExpenses, transactions, accounts, categories])

  // Run checks on mount and whenever deps change
  useEffect(() => {
    runChecks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.enabled])

  return {
    supported,
    permission,
    prefs,
    updatePrefs,
    enable,
    disable,
    runChecks,
  }
}
