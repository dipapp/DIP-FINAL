export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">DIP Members Support</h1>
          
          <p className="text-gray-700 text-lg mb-6">
            Need help with the DIP Members app?
          </p>
          
          <p className="text-gray-600 mb-8">
            DIP Members is a digital car wallet and vehicle marketplace that allows users to store vehicle information for free and access optional membership benefits.
          </p>
          
          <div className="mb-8">
            <p className="text-gray-700 font-medium mb-4">If you need assistance with:</p>
            <ul className="text-gray-600 space-y-2 ml-2">
              <li>• Account access</li>
              <li>• Vehicle information</li>
              <li>• Marketplace listings</li>
              <li>• Membership questions</li>
              <li>• General app support</li>
            </ul>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <p className="text-gray-700 font-medium mb-4">Please contact us:</p>
            <p className="text-gray-600 mb-2">
              Email:{' '}
              <a 
                href="mailto:support@dipmembers.com" 
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                support@dipmembers.com
              </a>
            </p>
          </div>
          
          <p className="text-gray-500 text-sm mt-8">
            We aim to respond within 24–48 business hours.
          </p>
        </div>
      </div>
    </div>
  );
}
