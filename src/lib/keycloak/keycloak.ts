import Keycloak from 'keycloak-js'

// Public SPA configuration only. Never put a client secret in a VITE_ variable.
export const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || 'https://hopon-auth.duckdns.org',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'hopon',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'hopon-admin-web',
}

export const keycloak = new Keycloak(keycloakConfig)
