import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test the PlateToVIN API with a sample request
    const apiKey = process.env.PLATETOVIN_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'PlateToVIN API key not configured' },
        { status: 500 }
      );
    }

    console.log('Testing PlateToVIN API with key:', apiKey.substring(0, 8) + '...');
    
    // Test with a sample plate
    const response = await fetch('https://platetovin.com/api/convert', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        plate: '9AIS637',
        state: 'CA',
      }),
    });

    console.log('Test response status:', response.status);
    
    const data = await response.json();
    console.log('Test response data:', data);
    
    return NextResponse.json({
      status: response.status,
      success: response.ok,
      data: data,
      headers: Object.fromEntries(response.headers.entries())
    });

  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}







