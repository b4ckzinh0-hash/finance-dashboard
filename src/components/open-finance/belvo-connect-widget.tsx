'use client'

import { useEffect, useRef } from 'react'

// Extend the window type to include the Belvo Connect widget loaded from CDN
declare global {
  interface Window {
    belvoSDK?: {
      createWidget: (token: string, config: BelvoWidgetConfig) => BelvoWidgetInstance
    }
  }
}

interface BelvoWidgetConfig {
  locale?: string
  company_name?: string
  company_logo?: string
  country_codes?: string[]
  access_mode?: 'single' | 'recurrent'
  resources?: string[]
  callback: (link: string, institution: string) => void
  onExit?: (data: unknown) => void
  onEvent?: (event: unknown) => void
}

interface BelvoWidgetInstance {
  build: () => void
  destroy?: () => void
}

interface BelvoConnectWidgetProps {
  connectToken: string
  onSuccess: (linkId: string, institution: string) => void
  onError?: (error: { message: string; data?: unknown }) => void
  onClose?: () => void
}

const BELVO_CONNECT_SCRIPT_URL = 'https://cdn.belvo.io/belvo-widget-1-stable.js'

/** Timeout (ms) to wait for the CDN script before giving up. */
const SCRIPT_LOAD_TIMEOUT_MS = 10_000

/**
 * Loads the Belvo Connect JS widget from CDN and opens it immediately.
 *
 * Place this component in the tree when you have a valid connectToken.
 * It auto-opens the widget and fires the callbacks when done.
 */
export function BelvoConnectWidget({
  connectToken,
  onSuccess,
  onError,
  onClose,
}: BelvoConnectWidgetProps) {
  const instanceRef = useRef<BelvoWidgetInstance | null>(null)
  const scriptLoadedRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    function handleScriptFailure(reason: string) {
      if (cancelled) return
      console.error('[BelvoConnectWidget]', reason)
      onError?.({ message: reason })
      onClose?.()
    }

    function initWidget() {
      if (cancelled) return
      if (!window.belvoSDK) {
        handleScriptFailure('Widget Belvo Connect não disponível. Verifique sua conexão e tente novamente.')
        return
      }

      try {
        instanceRef.current = window.belvoSDK.createWidget(connectToken, {
          locale: 'pt',
          callback: (linkId: string, institution: string) => {
            if (!cancelled) onSuccess(linkId, institution)
          },
          onExit: () => {
            if (!cancelled) onClose?.()
          },
        })
        instanceRef.current.build()
      } catch (err) {
        console.error('[BelvoConnectWidget] Failed to init widget:', err)
        handleScriptFailure('Falha ao inicializar widget de conexão Belvo. Tente novamente.')
      }
    }

    // If the script is already loaded, initialize immediately
    if (scriptLoadedRef.current || window.belvoSDK) {
      scriptLoadedRef.current = true
      initWidget()
      return () => {
        cancelled = true
        instanceRef.current?.destroy?.()
      }
    }

    // Load the script and then initialize
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${BELVO_CONNECT_SCRIPT_URL}"]`
    )

    if (existingScript) {
      const scriptTimeout = setTimeout(() => {
        handleScriptFailure('Tempo esgotado ao carregar widget Belvo. Verifique sua conexão e tente novamente.')
      }, SCRIPT_LOAD_TIMEOUT_MS)

      existingScript.addEventListener('load', () => {
        clearTimeout(scriptTimeout)
        initWidget()
      })
      existingScript.addEventListener('error', () => {
        clearTimeout(scriptTimeout)
        handleScriptFailure('Falha ao carregar widget Belvo. Verifique sua conexão e tente novamente.')
      })
      return () => {
        cancelled = true
        clearTimeout(scriptTimeout)
        instanceRef.current?.destroy?.()
      }
    }

    const script = document.createElement('script')
    script.src = BELVO_CONNECT_SCRIPT_URL
    script.async = true

    const scriptTimeout = setTimeout(() => {
      handleScriptFailure('Tempo esgotado ao carregar widget Belvo. Verifique sua conexão e tente novamente.')
    }, SCRIPT_LOAD_TIMEOUT_MS)

    script.onload = () => {
      clearTimeout(scriptTimeout)
      scriptLoadedRef.current = true
      initWidget()
    }
    script.onerror = () => {
      clearTimeout(scriptTimeout)
      handleScriptFailure('Falha ao carregar widget Belvo. Verifique sua conexão e tente novamente.')
    }
    document.head.appendChild(script)

    return () => {
      cancelled = true
      clearTimeout(scriptTimeout)
      instanceRef.current?.destroy?.()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectToken])

  // This component renders nothing — the widget is an overlay managed by the script
  return null
}
