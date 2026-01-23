import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const providerData = await request.json();

    // Format the email content with all provider information
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">New Provider Application</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9fafb;">
          <p style="color: #374151; font-size: 16px;">A new service provider application has been submitted and requires your review.</p>
          
          <div style="background-color: white; border-radius: 8px; padding: 20px; margin-top: 20px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Business Information</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 40%;">Business Name:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${providerData.businessName || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Legal Entity Name:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${providerData.legalEntityName || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">EIN Number:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${providerData.ein || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Bar Number:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${providerData.barNumber || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">City Business License:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${providerData.businessLicense || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Years in Business:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${providerData.yearsInBusiness || 'N/A'}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: white; border-radius: 8px; padding: 20px; margin-top: 20px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Insurance Information</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 40%;">Insurance Provider:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${providerData.insuranceProvider || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Policy Number:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${providerData.insurancePolicyNumber || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Expiration Date:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${providerData.insuranceExpiry || 'N/A'}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: white; border-radius: 8px; padding: 20px; margin-top: 20px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Contact Information</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 40%;">Contact Person:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${providerData.contactPerson || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Email:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${providerData.email || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Primary Phone:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${providerData.phone || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Alternate Phone:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${providerData.alternatePhone || 'N/A'}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: white; border-radius: 8px; padding: 20px; margin-top: 20px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Business Address</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 40%;">Address:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${providerData.address || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">City:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${providerData.city || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">State:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${providerData.state || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">ZIP Code:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${providerData.zipCode || 'N/A'}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: white; border-radius: 8px; padding: 20px; margin-top: 20px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Application Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 40%;">Provider ID:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${providerData.providerId || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">W-9 Form Status:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${providerData.w9Form || 'Not specified'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Terms Accepted:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${providerData.agreedToTerms ? '✓ Yes' : '✗ No'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Background Check Consent:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${providerData.agreedToBackgroundCheck ? '✓ Yes' : '✗ No'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Compliance Agreement:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${providerData.agreedToCompliance ? '✓ Yes' : '✗ No'}</td>
              </tr>
            </table>
          </div>

          <div style="margin-top: 30px; text-align: center;">
            <a href="https://dipmembers.com/admin?tab=providers" 
               style="display: inline-block; background-color: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Review Application
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
            This is an automated notification from DIP Digital Car Wallet.
          </p>
        </div>
      </div>
    `;

    // Use onboarding@resend.dev until dipmembers.com domain is verified in Resend
    // After domain verification, change to: 'DIP Notifications <notifications@dipmembers.com>'
    const { data, error } = await resend.emails.send({
      from: 'DIP Notifications <onboarding@resend.dev>',
      to: ['admin@dipmembers.com'],
      subject: `New Provider Application: ${providerData.businessName}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error sending provider notification email:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
