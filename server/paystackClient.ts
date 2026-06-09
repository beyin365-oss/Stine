import https from 'https';

let cachedSecretKey: string | null = null;
let cachedPublicKey: string | null = null;

async function getPaystackCredentials() {
  // 1. Direct env vars (Render, external hosting, or manual setup)
  const envPublic = process.env.PAYSTACK_PUBLIC_KEY;
  const envSecret = process.env.PAYSTACK_SECRET_KEY;
  if (envPublic && envSecret) {
    return { publicKey: envPublic, secretKey: envSecret };
  }

  // 2. Replit connector (fallback)
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!hostname || !xReplitToken) {
    throw new Error('Paystack credentials not found. Set PAYSTACK_PUBLIC_KEY and PAYSTACK_SECRET_KEY environment variables.');
  }

  const connectorName = 'paystack';
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

  if (!connectionSettings || !connectionSettings.settings.publicKey || !connectionSettings.settings.secretKey) {
    throw new Error(`Paystack ${targetEnvironment} connection not found`);
  }

  return {
    publicKey: connectionSettings.settings.publicKey,
    secretKey: connectionSettings.settings.secretKey,
  };
}

export async function getPaystackPublicKey() {
  if (cachedPublicKey) return cachedPublicKey;
  const { publicKey } = await getPaystackCredentials();
  cachedPublicKey = publicKey;
  return publicKey;
}

export async function getPaystackSecretKey() {
  if (cachedSecretKey) return cachedSecretKey;
  const { secretKey } = await getPaystackCredentials();
  cachedSecretKey = secretKey;
  return secretKey;
}

// Initialize Paystack charge
export async function initializePaystackCharge(email: string, amount: number, reference: string) {
  const secretKey = await getPaystackSecretKey();

  const params = JSON.stringify({
    email,
    amount: Math.round(amount * 100), // Convert to kobo
    reference,
    currency: 'NGN'
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/transaction/initialize',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
        'Content-Length': params.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { resolve(JSON.parse(data)); });
    });

    req.on('error', reject);
    req.write(params);
    req.end();
  });
}

// Verify Paystack transaction
export async function verifyPaystackTransaction(reference: string) {
  const secretKey = await getPaystackSecretKey();

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: `/transaction/verify/${reference}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { resolve(JSON.parse(data)); });
    });

    req.on('error', reject);
    req.end();
  });
}
