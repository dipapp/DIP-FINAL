'use client';
import Link from 'next/link';

export default function ProviderTermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Header */}
          <div className="text-center mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/dip-logo.png" alt="DIP Logo" className="h-12 w-auto mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              DIP Service Provider Agreement
            </h1>
            <p className="text-gray-600">
              Terms, Conditions & Privacy Policy for Service Providers
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Last Updated: January 2026
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-gray max-w-none space-y-8">
            
            {/* Introduction */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2">1. INTRODUCTION AND ACCEPTANCE</h2>
              <p className="text-gray-700 mt-4">
                This Service Provider Agreement (&quot;Agreement&quot;) is a legally binding contract between you (&quot;Provider,&quot; &quot;you,&quot; or &quot;your&quot;) and Deductible Impact Protection LLC (&quot;DIP,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By submitting an application to become a DIP Service Provider or by accessing and using the DIP Provider Portal, you acknowledge that you have read, understood, and agree to be bound by this Agreement in its entirety.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>IF YOU DO NOT AGREE TO ALL TERMS AND CONDITIONS OF THIS AGREEMENT, DO NOT SUBMIT AN APPLICATION OR USE THE DIP PROVIDER PORTAL.</strong>
              </p>
            </section>

            {/* Independent Contractor Status */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2">2. INDEPENDENT CONTRACTOR STATUS</h2>
              <p className="text-gray-700 mt-4">
                <strong>2.1 Relationship:</strong> You are an independent contractor and not an employee, agent, joint venturer, or partner of DIP. Nothing in this Agreement shall be construed to create an employment relationship, partnership, joint venture, or agency relationship between you and DIP.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>2.2 No Authority to Bind:</strong> You have no authority to bind DIP or represent that you are an employee or agent of DIP. You shall not make any representations, warranties, guarantees, or commitments on behalf of DIP.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>2.3 Taxes and Benefits:</strong> You are solely responsible for all federal, state, and local taxes, including income taxes, self-employment taxes, and any other applicable taxes. You are not entitled to any employee benefits, including but not limited to health insurance, retirement benefits, paid time off, or workers&apos; compensation.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>2.4 Business Operations:</strong> You maintain complete control over your business operations, including your methods, means, and manner of performing services. You may provide services to other clients and customers.
              </p>
            </section>

            {/* Provider Obligations */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2">3. PROVIDER OBLIGATIONS AND REQUIREMENTS</h2>
              <p className="text-gray-700 mt-4">
                <strong>3.1 Licensing and Credentials:</strong> You represent and warrant that you hold all required licenses, permits, certifications, and credentials necessary to perform the services you offer. You agree to maintain all such licenses in good standing throughout your relationship with DIP.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>3.2 Insurance Requirements:</strong> You shall maintain, at your sole expense, comprehensive general liability insurance, professional liability insurance (if applicable), and any other insurance required by law or industry standards. Minimum coverage amounts shall be as specified during the application process or as subsequently required by DIP. You agree to provide proof of insurance upon request.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>3.3 Quality Standards:</strong> You agree to perform all services in a professional, workmanlike manner consistent with industry standards. All services must be performed by qualified personnel using appropriate equipment, materials, and methods.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>3.4 Compliance with Laws:</strong> You shall comply with all applicable federal, state, and local laws, regulations, ordinances, and industry standards in the performance of services.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>3.5 Background Checks:</strong> By submitting an application, you consent to background checks, including but not limited to criminal history, credit history, professional license verification, and reference checks. You agree that DIP may conduct such checks at any time during your relationship with DIP.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>3.6 Accurate Information:</strong> You represent and warrant that all information provided in your application and throughout your relationship with DIP is true, accurate, complete, and not misleading. You agree to promptly update any information that changes.
              </p>
            </section>

            {/* Service Delivery */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2">4. SERVICE DELIVERY AND MEMBER INTERACTIONS</h2>
              <p className="text-gray-700 mt-4">
                <strong>4.1 Direct Relationship:</strong> All service agreements are between you and the DIP member. DIP acts solely as a platform facilitating connections between members and service providers. DIP is not a party to any service agreement between you and a member.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>4.2 Pricing and Payment:</strong> You are responsible for establishing your own pricing, subject to any guidelines provided by DIP. Payment arrangements are between you and the member unless otherwise specified. DIP makes no guarantees regarding payment collection.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>4.3 Professionalism:</strong> You agree to treat all DIP members with respect and professionalism. You shall not engage in any discriminatory practices, harassment, or unprofessional conduct.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>4.4 Disputes with Members:</strong> You are solely responsible for resolving any disputes with members regarding services provided. DIP is not responsible for mediating, arbitrating, or resolving disputes between you and members.
              </p>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2">5. INDEMNIFICATION AND HOLD HARMLESS</h2>
              <p className="text-gray-700 mt-4">
                <strong>5.1 General Indemnification:</strong> You agree to indemnify, defend, and hold harmless DIP, its officers, directors, employees, agents, affiliates, successors, and assigns (collectively, &quot;DIP Parties&quot;) from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys&apos; fees and court costs) arising out of or related to:
              </p>
              <ul className="list-disc pl-6 mt-2 text-gray-700 space-y-2">
                <li>Your performance or non-performance of services;</li>
                <li>Any breach of this Agreement by you;</li>
                <li>Any violation of applicable laws or regulations by you;</li>
                <li>Any claims by third parties (including DIP members) related to your services;</li>
                <li>Any injury to persons or damage to property caused by you, your employees, or your agents;</li>
                <li>Any misrepresentation made by you;</li>
                <li>Any tax liabilities arising from your status as an independent contractor;</li>
                <li>Any claims related to your employees or subcontractors;</li>
                <li>Any intellectual property infringement by you;</li>
                <li>Any negligence, gross negligence, or willful misconduct by you.</li>
              </ul>
              <p className="text-gray-700 mt-3">
                <strong>5.2 Survival:</strong> This indemnification obligation shall survive the termination of this Agreement.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2">6. LIMITATION OF LIABILITY AND DISCLAIMERS</h2>
              <p className="text-gray-700 mt-4">
                <strong>6.1 No Warranties:</strong> THE DIP PLATFORM AND PROVIDER PORTAL ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT ANY WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, OR NON-INFRINGEMENT.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>6.2 No Guarantee of Business:</strong> DIP does not guarantee any minimum volume of referrals, work, or income. Participation in the DIP network does not guarantee any business.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>6.3 Limitation of Damages:</strong> TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL DIP OR ANY DIP PARTIES BE LIABLE TO YOU FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES, EVEN IF DIP HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>6.4 Maximum Liability:</strong> DIP&apos;S TOTAL CUMULATIVE LIABILITY TO YOU FOR ANY AND ALL CLAIMS ARISING OUT OF OR RELATED TO THIS AGREEMENT SHALL NOT EXCEED THE GREATER OF (A) ONE HUNDRED DOLLARS ($100) OR (B) THE TOTAL FEES PAID TO DIP BY YOU IN THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE CLAIM.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>6.5 No Liability for Members:</strong> DIP is not liable for any actions, omissions, or conduct of DIP members. You assume all risk associated with interactions with members.
              </p>
            </section>

            {/* Confidentiality */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2">7. CONFIDENTIALITY AND DATA PROTECTION</h2>
              <p className="text-gray-700 mt-4">
                <strong>7.1 Confidential Information:</strong> You agree to maintain the confidentiality of all DIP member information, DIP business information, and any other proprietary information disclosed to you. You shall not disclose, publish, or use such information for any purpose other than performing services for DIP members.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>7.2 Member Data:</strong> You shall handle all member personal information in compliance with applicable privacy laws. You shall implement appropriate security measures to protect member data from unauthorized access, disclosure, or use.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>7.3 Data Breach Notification:</strong> You shall immediately notify DIP of any actual or suspected data breach involving member information.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2">8. TERMINATION</h2>
              <p className="text-gray-700 mt-4">
                <strong>8.1 Termination by DIP:</strong> DIP may terminate this Agreement and your participation in the provider network at any time, for any reason or no reason, with or without notice. DIP&apos;s decision to terminate is final and not subject to appeal or review.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>8.2 Termination by Provider:</strong> You may terminate this Agreement at any time by providing written notice to DIP. Upon termination, you must complete any outstanding service obligations to members.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>8.3 Effect of Termination:</strong> Upon termination, you shall immediately cease representing yourself as a DIP provider, return any DIP materials, and cease using any DIP intellectual property.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>8.4 Surviving Provisions:</strong> The following sections shall survive termination: Indemnification, Limitation of Liability, Confidentiality, Dispute Resolution, and any other provisions that by their nature should survive.
              </p>
            </section>

            {/* Dispute Resolution */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2">9. DISPUTE RESOLUTION AND ARBITRATION</h2>
              <p className="text-gray-700 mt-4">
                <strong>9.1 Binding Arbitration:</strong> Any dispute, controversy, or claim arising out of or relating to this Agreement, or the breach, termination, or validity thereof, shall be resolved exclusively by binding arbitration administered by the American Arbitration Association (&quot;AAA&quot;) in accordance with its Commercial Arbitration Rules.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>9.2 Location:</strong> The arbitration shall take place in Los Angeles County, California, unless otherwise agreed by the parties.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>9.3 Waiver of Jury Trial:</strong> BY AGREEING TO THIS AGREEMENT, YOU WAIVE YOUR RIGHT TO A JURY TRIAL AND YOUR RIGHT TO PARTICIPATE IN A CLASS ACTION.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>9.4 Class Action Waiver:</strong> You agree that any arbitration shall be conducted in your individual capacity only and not as a class action or other representative action. You expressly waive your right to file a class action or participate in a class action.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>9.5 Governing Law:</strong> This Agreement shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of laws principles.
              </p>
            </section>

            {/* Privacy Policy */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2">10. PROVIDER PRIVACY POLICY</h2>
              <p className="text-gray-700 mt-4">
                <strong>10.1 Information We Collect:</strong> We collect information you provide during the application process, including but not limited to: business name, legal entity name, EIN, business license numbers, contact information, address, phone numbers, email addresses, insurance information, and W-9 documentation.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>10.2 How We Use Your Information:</strong> We use your information to:
              </p>
              <ul className="list-disc pl-6 mt-2 text-gray-700 space-y-1">
                <li>Process and evaluate your provider application;</li>
                <li>Conduct background checks and verification;</li>
                <li>Facilitate connections between you and DIP members;</li>
                <li>Communicate with you regarding the provider program;</li>
                <li>Comply with legal and regulatory requirements;</li>
                <li>Improve our services and platform;</li>
                <li>Protect against fraud and abuse.</li>
              </ul>
              <p className="text-gray-700 mt-3">
                <strong>10.3 Information Sharing:</strong> We may share your information with:
              </p>
              <ul className="list-disc pl-6 mt-2 text-gray-700 space-y-1">
                <li>DIP members who request your services;</li>
                <li>Third-party verification and background check services;</li>
                <li>Service providers who assist with our operations;</li>
                <li>Legal authorities as required by law;</li>
                <li>Professional advisors such as lawyers and accountants.</li>
              </ul>
              <p className="text-gray-700 mt-3">
                <strong>10.4 Data Retention:</strong> We retain your information for as long as you are an active provider and for a period thereafter as required by law or for legitimate business purposes.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>10.5 Security:</strong> We implement reasonable security measures to protect your information. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.
              </p>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2">11. INTELLECTUAL PROPERTY</h2>
              <p className="text-gray-700 mt-4">
                <strong>11.1 DIP Intellectual Property:</strong> All DIP trademarks, logos, service marks, trade names, and other intellectual property remain the exclusive property of DIP. You are granted a limited, non-exclusive, non-transferable license to use DIP marks solely for the purpose of identifying yourself as an approved DIP provider.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>11.2 Restrictions:</strong> You shall not modify, alter, or create derivative works of any DIP intellectual property. You shall not use DIP marks in any way that suggests endorsement, affiliation, or sponsorship beyond your status as an approved provider.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>11.3 Termination of License:</strong> Upon termination of this Agreement, all licenses granted hereunder immediately terminate, and you must cease all use of DIP intellectual property.
              </p>
            </section>

            {/* General Provisions */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2">12. GENERAL PROVISIONS</h2>
              <p className="text-gray-700 mt-4">
                <strong>12.1 Entire Agreement:</strong> This Agreement constitutes the entire agreement between you and DIP regarding your participation as a provider and supersedes all prior agreements and understandings.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>12.2 Amendments:</strong> DIP may amend this Agreement at any time by posting the amended terms on the DIP platform. Continued use of the platform after such posting constitutes acceptance of the amended terms.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>12.3 Waiver:</strong> No waiver of any provision of this Agreement shall be deemed a further or continuing waiver of such provision or any other provision.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>12.4 Severability:</strong> If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>12.5 Assignment:</strong> You may not assign this Agreement without DIP&apos;s prior written consent. DIP may assign this Agreement without your consent.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>12.6 Notices:</strong> All notices shall be in writing and sent to the addresses provided during registration or as subsequently updated.
              </p>
              <p className="text-gray-700 mt-3">
                <strong>12.7 Force Majeure:</strong> Neither party shall be liable for any failure or delay in performance due to circumstances beyond its reasonable control.
              </p>
            </section>

            {/* Acknowledgment */}
            <section className="bg-gray-100 p-6 rounded-lg mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">ACKNOWLEDGMENT</h2>
              <p className="text-gray-700">
                BY CHECKING THE AGREEMENT BOXES IN THE PROVIDER APPLICATION AND SUBMITTING YOUR APPLICATION, YOU ACKNOWLEDGE THAT:
              </p>
              <ul className="list-disc pl-6 mt-3 text-gray-700 space-y-2">
                <li>You have read this Agreement in its entirety;</li>
                <li>You understand all terms and conditions;</li>
                <li>You voluntarily agree to be bound by this Agreement;</li>
                <li>You have the authority to enter into this Agreement on behalf of your business;</li>
                <li>You understand that this Agreement contains limitations of liability, indemnification obligations, and a binding arbitration provision with class action waiver;</li>
                <li>You have had the opportunity to consult with legal counsel before agreeing.</li>
              </ul>
            </section>

            {/* Contact */}
            <section className="mt-8">
              <h2 className="text-xl font-bold text-gray-900 border-b pb-2">CONTACT INFORMATION</h2>
              <p className="text-gray-700 mt-4">
                For questions about this Agreement or the provider program, please contact:
              </p>
              <p className="text-gray-700 mt-2">
                <strong>Email:</strong> support@dipmembers.com<br />
                <strong>Website:</strong> www.dipmembers.com
              </p>
            </section>

          </div>

          {/* Back Button */}
          <div className="mt-8 pt-6 border-t text-center">
            <Link 
              href="/provider/signup" 
              className="inline-block bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Application
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
