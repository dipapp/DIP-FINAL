import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { licensePlate, state } = await request.json();

    if (!licensePlate || !state) {
      return NextResponse.json(
        { error: 'License plate and state are required' },
        { status: 400 }
      );
    }

    // Get API key from environment variables
    const apiKey = process.env.PLATETOVIN_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'PlateToVIN API key not configured' },
        { status: 500 }
      );
    }

    // Call PlateToVIN API
    const response = await fetch('https://platetovin.com/api/v1/plate-to-vin', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plate: licensePlate,
        state: state,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: 'Failed to lookup VIN from license plate',
          details: errorData.message || 'Unknown error'
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      vin: data.vin,
      year: data.year || null,
      make: data.make || null,
      model: data.model || null,
      color: data.color || null,
      vehicle: data.vehicle || null,
    });

  } catch (error) {
    console.error('PlateToVIN API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
