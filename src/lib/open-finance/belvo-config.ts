/**
 * Validates Belvo environment variables and exports configuration helpers.
 * Used by API routes to check whether the integration is configured.
 * Reference: https://developers.belvo.com/reference
 */

/**
 * Returns the Belvo base URL depending on the configured environment.
 * Default is 'sandbox'.
 */
export function getBelvoBaseUrl(): string {
  const env = process.env.BELVO_ENVIRONMENT ?? 'sandbox'
  return env === 'production' ? 'https://api.belvo.com' : 'https://sandbox.belvo.com'
}

/**
 * Returns true if the required Belvo environment variables are set.
 * Call this on the server side only (API routes).
 */
export function isBelvoConfigured(): boolean {
  return !!(process.env.BELVO_SECRET_ID && process.env.BELVO_SECRET_PASSWORD)
}

/**
 * Returns the Belvo credentials from environment variables.
 * Throws if they are not set.
 */
export function getBelvoCredentials(): { secretId: string; secretPassword: string } {
  const secretId = process.env.BELVO_SECRET_ID
  const secretPassword = process.env.BELVO_SECRET_PASSWORD

  if (!secretId || !secretPassword) {
    throw new Error('Configure as variáveis BELVO_SECRET_ID e BELVO_SECRET_PASSWORD')
  }

  return { secretId, secretPassword }
}
