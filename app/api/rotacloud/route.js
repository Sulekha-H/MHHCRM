import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";

const ROTACLOUD_API_KEY = process.env.ROTACLOUD_API_KEY;
const ROTACLOUD_BASE_URL = 'https://api.rotacloud.com/v1';

// Security: Allowlist of permitted RotaCloud endpoints
const ALLOWED_ENDPOINTS = ['users', 'shifts', 'leave', 'locations', 'roles', 'leave_types'];

export async function GET(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'No Clerk session found.'
      }, { status: 401 });
    }

    if (!ROTACLOUD_API_KEY) {
      return NextResponse.json({
        error: 'Configuration Error',
        message: 'ROTACLOUD_API_KEY is missing on the server.'
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint || !ALLOWED_ENDPOINTS.includes(endpoint)) {
      return NextResponse.json({
        error: 'Invalid Request',
        message: `Endpoint '${endpoint}' is not allowed or missing.`
      }, { status: 400 });
    }

    // Build the target URL with any additional query params except 'endpoint'
    const targetUrl = new URL(`${ROTACLOUD_BASE_URL}/${endpoint}`);
    searchParams.forEach((value, key) => {
      if (key !== 'endpoint') {
        targetUrl.searchParams.append(key, value);
      }
    });

    // RotaCloud uses Basic Auth: API Key as username, empty password
    const authHeader = `Basic ${Buffer.from(`${ROTACLOUD_API_KEY}:`).toString('base64')}`;

    const response = await fetch(targetUrl.toString(), {
      headers: {
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({
        error: 'RotaCloud API Error',
        message: errorData.error || `Failed to fetch data from RotaCloud (${response.status}).`
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in GET /api/rotacloud:', error);
    return NextResponse.json({ error: 'Server Error', message: error.message }, { status: 500 });
  }
}
