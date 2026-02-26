import { z } from 'zod';

const tokenSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
});

let token: {
  value: string;
  expires: number;
} | null = null;

export async function getSentinelToken(): Promise<string> {
  if (token && token.expires > Date.now()) {
    return token.value;
  }

  const clientId = process.env.SENTINEL_CLIENT_ID;
  const clientSecret = process.env.SENTINEL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Sentinel Hub credentials are not configured.');
  }

  const response = await fetch(
    'https://services.sentinel-hub.com/auth/realms/main/protocol/openid-connect/token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch Sentinel Hub token: ${response.statusText}`);
  }

  const tokenData = await response.json();
  const parsedToken = tokenSchema.safeParse(tokenData);

  if (!parsedToken.success) {
    throw new Error('Failed to parse Sentinel Hub token response.');
  }

  token = {
    value: parsedToken.data.access_token,
    expires: Date.now() + parsedToken.data.expires_in * 1000 - 60000, // 60-second buffer
  };

  return token.value;
}
