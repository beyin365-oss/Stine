import { Client, Environment, LogLevel } from '@paypal/paypal-server-sdk';

let paypalClient: Client | null = null;

async function getPayPalCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
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
    const isProduction = process.env.REPLIT_DEPLOYMENT === '1';

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
  const { clientId } = await getPayPalCredentials();
  return clientId;
}

export async function getPayPalClientSecret() {
  const { clientSecret } = await getPayPalCredentials();
  return clientSecret;
}
