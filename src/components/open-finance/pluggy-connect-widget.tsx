'use client'

import { useEffect, useRef } from 'react'

// Extend the window type to include the PluggyConnect widget loaded from CDN
declare global {
  interface Window {
    PluggyConnect?: new (config: PluggyConnectConfig) => PluggyConnectInstance
  }
}

interface PluggyConnectConfig {
  connectToken: string
  onSuccess?: (itemData: { itemId: string }) => void
  onError?: (error: { message: string; data?: unknown }) => void
  onClose?: () => void
}

interface PluggyConnectInstance {
  open: () => void
  close?: () => void
  destroy?: () => void
}

interface PluggyConnectWidgetProps {
  connectToken: string
  onSuccess: (itemId: string) => void
  onError?: (error: { message: string; data?: unknown }) => void
  onClose?: () => void
}

const PLUGGY_CONNECT_SCRIPT_URL =
  'https://cdn.pluggy.ai/pluggy-connect/v2/pluggy-connect.js'

/**
 * Loads the Pluggy Connect JS widget from CDN and opens it immediately.
 *
 * Place this component in the tree when you have a valid connectToken.
 * It auto-opens the widget and fires the callbacks when done.
 */
export function PluggyConnectWidget({
  connectToken,
  onSuccess,
  onError,
  onClose,
}: PluggyConnectWidgetProps) {
  const instanceRef = useRef<PluggyConnectInstance | null>(null)
  const scriptLoadedRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    function initWidget() {
      if (cancelled) return
      if (!window.PluggyConnect) {
        console.error('[PluggyConnectWidget] PluggyConnect not available after script load')
        return
      }

      try {
        instanceRef.current = new window.PluggyConnect({
          connectToken,
          onSuccess: (itemData) => {
            if (!cancelled) onSuccess(itemData.itemId)
          },
          onError: (error) => {
            if (!cancelled) onError?.(error)
          },
          onClose: () => {
            if (!cancelled) onClose?.()
          },
        })
        instanceRef.current.open()
      } catch (err) {
        console.error('[PluggyConnectWidget] Failed to init widget:', err)
      }
    }

    // If the script is already loaded, initialize immediately
    if (scriptLoadedRef.current || window.PluggyConnect) {
      scriptLoadedRef.current = true
      initWidget()
      return () => {
        cancelled = true
        instanceRef.current?.destroy?.()
      }
    }

    // Load the script and then initialize
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${PLUGGY_CONNECT_SCRIPT_URL}"]`
    )

    if (existingScript) {
      // Script tag exists but may still be loading
      existingScript.addEventListener('load', initWidget)
      return () => {
        cancelled = true
        existingScript.removeEventListener('load', initWidget)
        instanceRef.current?.destroy?.()
      }
    }

    const script = document.createElement('script')
    script.src = PLUGGY_CONNECT_SCRIPT_URL
    script.async = true
    script.onload = () => {
      scriptLoadedRef.current = true
      initWidget()
    }
    script.onerror = () => {
      console.error('[PluggyConnectWidget] Failed to load script from CDN')
    }
    document.head.appendChild(script)

    return () => {
      cancelled = true
      instanceRef.current?.destroy?.()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectToken])

  // This component renders nothing — the widget is an overlay managed by the script
  return null
}
