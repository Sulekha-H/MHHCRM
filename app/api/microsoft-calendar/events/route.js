import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";

const CLIENT_ID = process.env.MS_CLIENT_ID;
const TENANT_ID = process.env.MS_TENANT_ID;
const CLIENT_SECRET = process.env.MS_CLIENT_SECRET;
const SHARED_MAILBOX = process.env.MS_SHARED_MAILBOX;

async function getAccessToken() {
  const url = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    scope: 'https://graph.microsoft.com/.default',
    client_secret: CLIENT_SECRET,
    grant_type: 'client_credentials',
  });

  const response = await fetch(url, {
    method: 'POST',
    body: body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Microsoft Auth Error: ${data.error_description || data.error || response.statusText}`);
  }
  return data.access_token;
}

export async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', message: 'You must be logged in to access the calendar.' }, { status: 401 });
    }

    if (!CLIENT_ID || !TENANT_ID || !CLIENT_SECRET || !SHARED_MAILBOX) {
      return NextResponse.json({ error: 'Configuration Error', message: 'Microsoft 365 credentials are not fully configured on the server.' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    let token;
    try {
      token = await getAccessToken();
    } catch (authError) {
      console.error('[API] Microsoft Token Error:', authError.message);
      return NextResponse.json({ error: 'Authentication Failed', message: authError.message }, { status: 401 });
    }

    let url = `https://graph.microsoft.com/v1.0/users/${SHARED_MAILBOX}/calendar/events`;

    if (start && end) {
      url = `https://graph.microsoft.com/v1.0/users/${SHARED_MAILBOX}/calendar/calendarView?startDateTime=${start}&endDateTime=${end}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Prefer: 'outlook.timezone="UTC"',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[API] Microsoft Graph API Error (GET):', errorData);
      return NextResponse.json({
        error: 'Microsoft API Error',
        message: errorData.error?.message || 'Failed to fetch events from Microsoft.'
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data.value || []);
  } catch (error) {
    console.error('Unexpected error in GET /api/microsoft-calendar/events:', error);
    return NextResponse.json({ error: 'Server Error', message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', message: 'You must be logged in to access the calendar.' }, { status: 401 });
    }

    const eventData = await request.json();

    let token;
    try {
      token = await getAccessToken();
    } catch (authError) {
      return NextResponse.json({ error: 'Authentication Failed', message: authError.message }, { status: 401 });
    }

    const response = await fetch(`https://graph.microsoft.com/v1.0/users/${SHARED_MAILBOX}/calendar/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[API] Microsoft Graph API Error (POST):', data);
      return NextResponse.json({
        error: 'Microsoft API Error',
        message: data.error?.message || 'Failed to create event in Microsoft.'
      }, { status: response.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in POST /api/microsoft-calendar/events:', error);
    return NextResponse.json({ error: 'Server Error', message: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', message: 'You must be logged in.' }, { status: 401 });
    }

    const { id, ...eventData } = await request.json();

    let token;
    try {
      token = await getAccessToken();
    } catch (authError) {
      return NextResponse.json({ error: 'Authentication Failed', message: authError.message }, { status: 401 });
    }

    const response = await fetch(`https://graph.microsoft.com/v1.0/users/${SHARED_MAILBOX}/calendar/events/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[API] Microsoft Graph API Error (PATCH):', data);
      return NextResponse.json({
        error: 'Microsoft API Error',
        message: data.error?.message || 'Failed to update event in Microsoft.'
      }, { status: response.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in PATCH /api/microsoft-calendar/events:', error);
    return NextResponse.json({ error: 'Server Error', message: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    let token;
    try {
      token = await getAccessToken();
    } catch (authError) {
      return NextResponse.json({ error: 'Authentication Failed', message: authError.message }, { status: 401 });
    }

    const response = await fetch(`https://graph.microsoft.com/v1.0/users/${SHARED_MAILBOX}/calendar/events/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 204) {
      return NextResponse.json({ success: true });
    } else {
      const data = await response.json();
      console.error('[API] Microsoft Graph API Error (DELETE):', data);
      return NextResponse.json({
        error: 'Microsoft API Error',
        message: data.error?.message || 'Failed to delete event in Microsoft.'
      }, { status: response.status });
    }
  } catch (error) {
    console.error('Unexpected error in DELETE /api/microsoft-calendar/events:', error);
    return NextResponse.json({ error: 'Server Error', message: error.message }, { status: 500 });
  }
}
