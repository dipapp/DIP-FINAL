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
    console.log('Calling PlateToVIN API with:', { licensePlate, state });
    
    const response = await fetch('https://platetovin.com/api/convert', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        plate: licensePlate,
        state: state,
      }),
    });

    console.log('PlateToVIN API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('PlateToVIN API error:', errorData);
      return NextResponse.json(
        { 
          error: 'Failed to lookup VIN from license plate',
          details: errorData.message || errorData.error || 'Unknown error',
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('PlateToVIN API response data:', data);
    
    // Check if the API response indicates success
    if (!data.success) {
      return NextResponse.json(
        { 
          error: 'Plate lookup failed',
          details: data.message || data.error || 'No vehicle found for this plate and state'
        },
        { status: 404 }
      );
    }
    
    // Extract vehicle details from the VIN object
    const vinData = data.vin || {};
    
    return NextResponse.json({
      success: true,
      vin: vinData.vin || vinData.number || null,
      year: vinData.year || null,
      make: vinData.make || null,
      model: vinData.model || null,
      color: vinData.color || null,
      vehicle: vinData || null,
    });

  } catch (error) {
    console.error('PlateToVIN API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
