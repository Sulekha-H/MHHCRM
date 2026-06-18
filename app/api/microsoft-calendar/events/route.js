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
  return data.access_token;
}

export async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const token = await getAccessToken();
    let url = `https://graph.microsoft.com/v1.0/users/${SHARED_MAILBOX}/calendar/events`;

    if (start && end) {
        // Use calendarView for a expanded view of recurring events
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
        return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data.value || []);
  } catch (error) {
    console.error('Error fetching Microsoft Calendar events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventData = await request.json();
    const token = await getAccessToken();

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
        return NextResponse.json(data, { status: response.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating Microsoft Calendar event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}

export async function PATCH(request) {
    try {
      const { userId } = await auth();
      if (!userId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { id, ...eventData } = await request.json();
      const token = await getAccessToken();

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
          return NextResponse.json(data, { status: response.status });
      }
      return NextResponse.json(data);
    } catch (error) {
      console.error('Error updating Microsoft Calendar event:', error);
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
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
      const token = await getAccessToken();

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
          return NextResponse.json(data, { status: response.status });
      }
    } catch (error) {
      console.error('Error deleting Microsoft Calendar event:', error);
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }
  }
