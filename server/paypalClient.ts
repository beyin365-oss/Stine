import { Client, Environment, LogLevel } from '@paypal/paypal-server-sdk';

let paypalClient: Client | null = null;
let cachedClientId: string | null = null;
let cachedClientSecret: string | null = null;

async function getPayPalCredentials() {
  // 1. Direct env vars (Render, external hosting, or manual setup)
  const envClientId = process.env.PAYPAL_CLIENT_ID;
  const envClientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (envClientId && envClientSecret) {
    return { clientId: envClientId, clientSecret: envClientSecret };
  }

  // 2. Replit connector (fallback)
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!hostname || !xReplitToken) {
    throw new Error('PayPal credentials not found. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables.');
  }

  const connectorName = 'paypal';
  const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
  const targetEnvironment = isProduction ? 'production' : 'development';

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set('include_secrets', 'true');
  url.searchParams.set('connector_names', connectorName);
  url.searchParams.set('environment', targetEnvironment);

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'X_REPLIT_TOKEN': xReplitToken
    }
  });

  const data = await response.json();
  const connectionSettings = data.items?.[0];

  if (!connectionSettings || (!connectionSettings.settings.clientId || !connectionSettings.settings.clientSecret)) {
    throw new Error(`PayPal ${targetEnvironment} connection not found`);
  }

  return {
    clientId: connectionSettings.settings.clientId,
    clientSecret: connectionSettings.settings.clientSecret,
  };
}

export async function getPayPalClient() {
  if (!paypalClient) {
    const { clientId, clientSecret } = await getPayPalCredentials();
    const isProduction = process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === '1';

    paypalClient = new Client({
      clientId,
      clientSecret,
      environment: isProduction ? Environment.Production : Environment.Sandbox,
      logging: {
        logLevel: LogLevel.Info,
        logRequest: { logBody: true },
        logResponse: { logBody: true }
      }
    });
  }
  return paypalClient;
}

export async function getPayPalClientId() {
  if (cachedClientId) return cachedClientId;
  const { clientId } = await getPayPalCredentials();
  cachedClientId = clientId;
  return clientId;
}

export async function getPayPalClientSecret() {
  if (cachedClientSecret) return cachedClientSecret;
  const { clientSecret } = await getPayPalCredentials();
  cachedClientSecret = clientSecret;
  return clientSecret;
}
