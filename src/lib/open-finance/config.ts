/**
 * Validates Pluggy environment variables and exports configuration helpers.
 * Used by API routes to check whether the integration is configured.
 */

export const PLUGGY_BASE_URL = 'https://api.pluggy.ai'

/**
 * Returns true if the required Pluggy environment variables are set.
 * Call this on the server side only (API routes).
 */
export function isPluggyConfigured(): boolean {
  return !!(process.env.PLUGGY_CLIENT_ID && process.env.PLUGGY_CLIENT_SECRET)
}

/**
 * Returns the Pluggy client credentials from environment variables.
 * Throws if they are not set.
 */
export function getPluggyCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.PLUGGY_CLIENT_ID
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error(
      'Configure as variáveis PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET'
    )
  }

  return { clientId, clientSecret }
}
