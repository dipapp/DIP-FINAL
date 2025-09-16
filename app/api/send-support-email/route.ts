import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketId, userEmail, subject, category, priority, description, userId } = body;

    if (!ticketId || !userEmail || !subject || !description) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, skipping email notification');
      return NextResponse.json({ message: 'Email notification skipped (not configured)' });
    }

    try {
      const emailContent = `
New Support Ticket Submitted

Ticket ID: ${ticketId}
User Email: ${userEmail}
User ID: ${userId}
Category: ${category}
Priority: ${priority}

Subject: ${subject}

Description:
${description}

---
This ticket was submitted through the DIP Member Portal.
Please respond to the customer at: ${userEmail}
      `.trim();

      const { data, error } = await resend.emails.send({
        from: 'DIP Support <noreply@dipmembers.com>',
        to: ['support@dipmembers.com'],
        subject: `New Support Ticket: ${subject}`,
        text: emailContent,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">New Support Ticket Submitted</h2>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Ticket ID:</strong> ${ticketId}</p>
              <p><strong>User Email:</strong> ${userEmail}</p>
              <p><strong>User ID:</strong> ${userId}</p>
              <p><strong>Category:</strong> ${category}</p>
              <p><strong>Priority:</strong> <span style="color: ${priority === 'urgent' ? '#dc2626' : priority === 'high' ? '#ea580c' : '#1e40af'};">${priority.toUpperCase()}</span></p>
            </div>
            
            <div style="margin: 20px 0;">
              <h3 style="color: #374151;">Subject:</h3>
              <p style="font-size: 16px; font-weight: 600;">${subject}</p>
            </div>
            
            <div style="margin: 20px 0;">
              <h3 style="color: #374151;">Description:</h3>
              <div style="background: white; padding: 15px; border-left: 4px solid #1e40af; white-space: pre-wrap;">${description}</div>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              This ticket was submitted through the DIP Member Portal.<br>
              Please respond to the customer at: <a href="mailto:${userEmail}">${userEmail}</a>
            </p>
          </div>
        `,
      });

      if (error) {
        throw new Error(`Resend error: ${error.message}`);
      }

      console.log('Support email sent successfully:', data);
      return NextResponse.json({ message: 'Email sent successfully', emailId: data?.id });
    } catch (error) {
      console.error('Error sending support email:', error);
      return NextResponse.json({ message: 'Failed to send email notification' }, { status: 500 });
    }
  } catch (error) {
    console.error('[send-support-email] Request parsing error:', error);
    return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
  }
}