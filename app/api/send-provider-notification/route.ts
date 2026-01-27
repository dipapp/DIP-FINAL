import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const providerData = await request.json();

    // Extract document URLs
    const documents = providerData.documents || {};

    // Format the email content with all provider information
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">New Provider Application</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Provider ID: ${providerData.providerId || 'N/A'}</p>
        </div>
        
        <div style="padding: 20px; background-color: #f9fafb;">
          <p style="color: #374151; font-size: 16px;">A new service provider application has been submitted and requires your review.</p>
          
          <!-- Business Information -->
          <div style="background-color: white; border-radius: 8px; padding: 20px; margin-top: 20px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #1e40af; padding-bottom: 10px;">📋 Business Information</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #6b7280; width: 40%; border-bottom: 1px solid #f3f4f6;">Business Name:</td>
                <td style="padding: 10px 0; color: #1f2937; font-weight: 600; border-bottom: 1px solid #f3f4f6;">${providerData.businessName || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Legal Entity Name:</td>
                <td style="padding: 10px 0; color: #1f2937; font-weight: 600; border-bottom: 1px solid #f3f4f6;">${providerData.legalEntityName || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Years in Business:</td>
                <td style="padding: 10px 0; color: #1f2937; font-weight: 600; border-bottom: 1px solid #f3f4f6;">${providerData.yearsInBusiness || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280;">Website:</td>
                <td style="padding: 10px 0; color: #1f2937; font-weight: 600;">
                  ${providerData.website ? `<a href="${providerData.website}" style="color: #1e40af;">${providerData.website}</a>` : 'N/A'}
                </td>
              </tr>
            </table>
          </div>

          <!-- Contact Information -->
          <div style="background-color: white; border-radius: 8px; padding: 20px; margin-top: 20px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #1e40af; padding-bottom: 10px;">👤 Contact Information</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #6b7280; width: 40%; border-bottom: 1px solid #f3f4f6;">Contact Person:</td>
                <td style="padding: 10px 0; color: #1f2937; font-weight: 600; border-bottom: 1px solid #f3f4f6;">${providerData.contactPerson || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Email:</td>
                <td style="padding: 10px 0; color: #1f2937; font-weight: 600; border-bottom: 1px solid #f3f4f6;">
                  <a href="mailto:${providerData.email}" style="color: #1e40af;">${providerData.email || 'N/A'}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Primary Phone:</td>
                <td style="padding: 10px 0; color: #1f2937; font-weight: 600; border-bottom: 1px solid #f3f4f6;">
                  <a href="tel:${providerData.phone}" style="color: #1e40af;">${providerData.phone || 'N/A'}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280;">Alternate Phone:</td>
                <td style="padding: 10px 0; color: #1f2937; font-weight: 600;">${providerData.alternatePhone || 'N/A'}</td>
              </tr>
            </table>
          </div>

          <!-- Business Address -->
          <div style="background-color: white; border-radius: 8px; padding: 20px; margin-top: 20px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #1e40af; padding-bottom: 10px;">📍 Business Address</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #6b7280; width: 40%; border-bottom: 1px solid #f3f4f6;">Street Address:</td>
                <td style="padding: 10px 0; color: #1f2937; font-weight: 600; border-bottom: 1px solid #f3f4f6;">${providerData.address || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">City:</td>
                <td style="padding: 10px 0; color: #1f2937; font-weight: 600; border-bottom: 1px solid #f3f4f6;">${providerData.city || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">State:</td>
                <td style="padding: 10px 0; color: #1f2937; font-weight: 600; border-bottom: 1px solid #f3f4f6;">${providerData.state || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280;">ZIP Code:</td>
                <td style="padding: 10px 0; color: #1f2937; font-weight: 600;">${providerData.zipCode || 'N/A'}</td>
              </tr>
            </table>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
              <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${providerData.address || ''}, ${providerData.city || ''}, ${providerData.state || ''} ${providerData.zipCode || ''}`)}" 
                 style="color: #1e40af; font-size: 14px;">
                📍 View on Google Maps
              </a>
            </div>
          </div>

          <!-- Uploaded Documents -->
          <div style="background-color: white; border-radius: 8px; padding: 20px; margin-top: 20px; border: 2px solid #1e40af;">
            <h2 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #1e40af; padding-bottom: 10px;">📎 Uploaded Documents</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; color: #6b7280; width: 40%; border-bottom: 1px solid #f3f4f6;">
                  <strong>Certificate of Insurance (COI):</strong>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                  ${documents.certificateOfInsurance 
                    ? `<a href="${documents.certificateOfInsurance}" style="display: inline-block; background-color: #1e40af; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 14px;">📄 View COI</a>` 
                    : '<span style="color: #ef4444;">Not uploaded</span>'}
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">
                  <strong>W-9 Form:</strong>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                  ${documents.w9Form 
                    ? `<a href="${documents.w9Form}" style="display: inline-block; background-color: #1e40af; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 14px;">📄 View W-9</a>` 
                    : '<span style="color: #ef4444;">Not uploaded</span>'}
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">
                  <strong>City Business License:</strong>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                  ${documents.businessLicense 
                    ? `<a href="${documents.businessLicense}" style="display: inline-block; background-color: #1e40af; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 14px;">📄 View License</a>` 
                    : '<span style="color: #ef4444;">Not uploaded</span>'}
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #6b7280;">
                  <strong>Bar License:</strong>
                </td>
                <td style="padding: 12px 0;">
                  ${documents.barLicense 
                    ? `<a href="${documents.barLicense}" style="display: inline-block; background-color: #1e40af; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 14px;">📄 View Bar License</a>` 
                    : '<span style="color: #9ca3af; font-style: italic;">Not provided (optional)</span>'}
                </td>
              </tr>
            </table>
          </div>

          <!-- Agreements Accepted -->
          <div style="background-color: white; border-radius: 8px; padding: 20px; margin-top: 20px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #1e40af; padding-bottom: 10px;">✅ Agreements Accepted</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 70%; border-bottom: 1px solid #f3f4f6;">Terms of Service & Privacy Policy:</td>
                <td style="padding: 8px 0; color: ${providerData.agreedToTerms ? '#16a34a' : '#ef4444'}; font-weight: 600; border-bottom: 1px solid #f3f4f6;">${providerData.agreedToTerms ? '✓ Accepted' : '✗ Not Accepted'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Independent Contractor Status:</td>
                <td style="padding: 8px 0; color: ${providerData.agreedToIndependentContractor ? '#16a34a' : '#ef4444'}; font-weight: 600; border-bottom: 1px solid #f3f4f6;">${providerData.agreedToIndependentContractor ? '✓ Accepted' : '✗ Not Accepted'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Background Check Consent:</td>
                <td style="padding: 8px 0; color: ${providerData.agreedToBackgroundCheck ? '#16a34a' : '#ef4444'}; font-weight: 600; border-bottom: 1px solid #f3f4f6;">${providerData.agreedToBackgroundCheck ? '✓ Accepted' : '✗ Not Accepted'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Indemnification & Hold Harmless:</td>
                <td style="padding: 8px 0; color: ${providerData.agreedToIndemnification ? '#16a34a' : '#ef4444'}; font-weight: 600; border-bottom: 1px solid #f3f4f6;">${providerData.agreedToIndemnification ? '✓ Accepted' : '✗ Not Accepted'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Binding Arbitration & Class Action Waiver:</td>
                <td style="padding: 8px 0; color: ${providerData.agreedToArbitration ? '#16a34a' : '#ef4444'}; font-weight: 600; border-bottom: 1px solid #f3f4f6;">${providerData.agreedToArbitration ? '✓ Accepted' : '✗ Not Accepted'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Data Use & Sharing Consent:</td>
                <td style="padding: 8px 0; color: ${providerData.agreedToDataUse ? '#16a34a' : '#ef4444'}; font-weight: 600; border-bottom: 1px solid #f3f4f6;">${providerData.agreedToDataUse ? '✓ Accepted' : '✗ Not Accepted'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Provider Standards & Compliance:</td>
                <td style="padding: 8px 0; color: ${providerData.agreedToCompliance ? '#16a34a' : '#ef4444'}; font-weight: 600; border-bottom: 1px solid #f3f4f6;">${providerData.agreedToCompliance ? '✓ Accepted' : '✗ Not Accepted'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">No Guarantee of Business Acknowledged:</td>
                <td style="padding: 8px 0; color: ${providerData.acknowledgedNoGuarantees ? '#16a34a' : '#ef4444'}; font-weight: 600;">${providerData.acknowledgedNoGuarantees ? '✓ Accepted' : '✗ Not Accepted'}</td>
              </tr>
            </table>
          </div>

          <!-- Action Button -->
          <div style="margin-top: 30px; text-align: center;">
            <a href="https://dipmembers.com/admin/providers" 
               style="display: inline-block; background-color: #1e40af; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Review Application in Admin Portal
            </a>
          </div>

          <!-- Application Summary Box -->
          <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin-top: 30px; border: 1px solid #bfdbfe;">
            <h3 style="color: #1e40af; margin: 0 0 10px 0;">📋 Application Summary</h3>
            <p style="color: #1e3a8a; margin: 0; font-size: 14px;">
              <strong>Provider ID:</strong> ${providerData.providerId}<br>
              <strong>Business:</strong> ${providerData.businessName}<br>
              <strong>Contact:</strong> ${providerData.contactPerson} (${providerData.email})<br>
              <strong>Location:</strong> ${providerData.city}, ${providerData.state}<br>
              <strong>Status:</strong> Pending Review
            </p>
          </div>

          <p style="color: #6b7280; font-size: 12px; margin-top: 30px; text-align: center;">
            This is an automated notification from DIP Digital Car Wallet.<br>
            Application submitted on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    `;

    // Use onboarding@resend.dev until dipmembers.com domain is verified in Resend
    // After domain verification, change to: 'DIP Notifications <notifications@dipmembers.com>'
    const { data, error } = await resend.emails.send({
      from: 'DIP Notifications <onboarding@resend.dev>',
      to: ['admin@dipmembers.com'],
      subject: `🆕 New Provider Application: ${providerData.businessName} (ID: ${providerData.providerId})`,
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
