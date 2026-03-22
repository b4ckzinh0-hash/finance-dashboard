// Browser Push Notification API wrapper

export type PushNotificationPayload = {
  title: string
  body: string
  icon?: string
  tag?: string
}

/**
 * Check if browser push notifications are supported
 */
export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

/**
 * Get the current notification permission status
 */
export function getPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported'
  return Notification.permission
}

/**
 * Request notification permission from the user
 * Returns the resulting permission status
 */
export async function requestPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return 'denied'
  const result = await Notification.requestPermission()
  return result
}

/**
 * Send a browser push notification
 * Returns true if sent successfully, false otherwise
 */
export function sendNotification(payload: PushNotificationPayload): boolean {
  if (!isPushSupported()) return false
  if (Notification.permission !== 'granted') return false

  try {
    new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon ?? '/icons/icon-192x192.png',
      tag: payload.tag,
    })
    return true
  } catch {
    return false
  }
}

/**
 * Send a notification about an upcoming bill
 */
export function notifyUpcomingBill(billName: string, daysUntilDue: number, amount: number): boolean {
  const body =
    daysUntilDue === 0
      ? `"${billName}" vence hoje! Valor: R$ ${amount.toFixed(2)}`
      : `"${billName}" vence em ${daysUntilDue} dia${daysUntilDue > 1 ? 's' : ''}. Valor: R$ ${amount.toFixed(2)}`
  return sendNotification({
    title: '⏰ Conta a vencer',
    body,
    tag: `bill-${billName}`,
  })
}

/**
 * Send a budget alert notification
 */
export function notifyBudgetAlert(categoryName: string, percentUsed: number): boolean {
  return sendNotification({
    title: '⚠️ Alerta de orçamento',
    body: `Você usou ${percentUsed.toFixed(0)}% do orçamento de ${categoryName} este mês.`,
    tag: `budget-${categoryName}`,
  })
}

/**
 * Send a low balance notification
 */
export function notifyLowBalance(accountName: string, balance: number): boolean {
  return sendNotification({
    title: '💸 Saldo baixo',
    body: `A conta "${accountName}" está com saldo de R$ ${balance.toFixed(2)}.`,
    tag: `balance-${accountName}`,
  })
}
