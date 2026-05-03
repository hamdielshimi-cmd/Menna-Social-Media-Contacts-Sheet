import { NextRequest, NextResponse } from 'next/server'

const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL

export async function GET() {
  try {
    if (!APPS_SCRIPT_URL) {
      return NextResponse.json(
        { success: false, error: 'Apps Script URL not configured' },
        { status: 500 }
      )
    }

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'GET',
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!APPS_SCRIPT_URL) {
      return NextResponse.json(
        { success: false, error: 'Apps Script URL not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
