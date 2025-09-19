import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'Dip Members',
  description: 'Membership for California drivers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-white font-sans antialiased">
        <div className="relative">
          <Navbar />
          
          {/* Dynamic Main Content */}
          <main className="relative">
            {children}
          </main>
          
          {/* Enhanced Footer */}
          <footer className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white py-16 mt-20">
            {/* Footer Background Effects */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900 via-slate-900 to-black"></div>
              <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%239C92AC" fill-opacity="0.03"%3E%3Ccircle cx="20" cy="20" r="1"/%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
              
              {/* Floating Orbs */}
              <div className="absolute top-10 left-20 w-32 h-32 bg-gradient-to-r from-cyan-400/10 to-blue-500/10 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute bottom-10 right-20 w-40 h-40 bg-gradient-to-r from-purple-400/10 to-pink-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>
            
            <div className="container-app relative z-10">
              <div className="grid lg:grid-cols-3 gap-12 mb-12">
                {/* Brand Section */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="relative group">
                    <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-all duration-500"></div>
                    <div className="relative flex items-center space-x-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src="/dip-logo.png" 
                        alt="DIP Logo" 
                        className="h-12 w-auto" 
                      />
                      <div>
                        <h3 className="text-2xl font-black bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent">
                          DIP
                        </h3>
                        <p className="text-gray-400 font-medium">Driver Impact Protection</p>
                      </div>
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 leading-relaxed">
                    Advanced vehicle protection membership providing comprehensive coverage and peace of mind for California drivers.
                  </p>
                  
                  <div className="flex space-x-4">
                    <div className="group relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
                      <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-400/30 rounded-lg p-3 transition-all duration-300 group-hover:scale-110">
                        <span className="text-xl">🔒</span>
                      </div>
                    </div>
                    <div className="group relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
                      <div className="relative bg-black/40 backdrop-blur-xl border border-emerald-400/30 rounded-lg p-3 transition-all duration-300 group-hover:scale-110">
                        <span className="text-xl">✓</span>
                      </div>
                    </div>
                    <div className="group relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
                      <div className="relative bg-black/40 backdrop-blur-xl border border-purple-400/30 rounded-lg p-3 transition-all duration-300 group-hover:scale-110">
                        <span className="text-xl">⭐</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Quick Links */}
                <div className="lg:col-span-1 space-y-6">
                  <h4 className="text-xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent tracking-wide">
                    QUICK ACCESS
                  </h4>
                  <div className="space-y-3">
                    <a href="/dashboard/vehicles" className="group flex items-center space-x-3 text-gray-300 hover:text-cyan-300 transition-colors duration-300">
                      <span className="text-lg">🚗</span>
                      <span className="font-medium">Manage Vehicles</span>
                      <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                    <a href="/dashboard/claims" className="group flex items-center space-x-3 text-gray-300 hover:text-emerald-300 transition-colors duration-300">
                      <span className="text-lg">📱</span>
                      <span className="font-medium">Request Assistance</span>
                      <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                    <a href="/dashboard/profile" className="group flex items-center space-x-3 text-gray-300 hover:text-purple-300 transition-colors duration-300">
                      <span className="text-lg">⚙️</span>
                      <span className="font-medium">Account Settings</span>
                      <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </div>
                
                {/* Contact Info */}
                <div className="lg:col-span-1 space-y-6">
                  <h4 className="text-xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent tracking-wide">
                    SUPPORT
                  </h4>
                  <div className="space-y-4">
                    <div className="group">
                      <div className="flex items-center space-x-3 text-gray-300">
                        <div className="relative">
                          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                            <span className="text-sm">🔥</span>
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-orange-300">24/7 Emergency</div>
                          <div className="text-sm text-gray-400">Instant roadside assistance</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="group">
                      <div className="flex items-center space-x-3 text-gray-300">
                        <div className="relative">
                          <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                            <span className="text-sm">💬</span>
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-cyan-300">Member Support</div>
                          <div className="text-sm text-gray-400">support@dipmembers.com</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bottom Bar */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur"></div>
                <div className="relative border-t border-white/10 pt-8">
                  <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
                    <div className="flex items-center space-x-6">
                      <p className="text-gray-400 font-medium">
                        DIP is a membership program, not an insurance company.
                      </p>
                    </div>
                    <div className="flex items-center space-x-6">
                      <p className="text-gray-500 text-sm">
                        © 2025 DIP. All rights reserved.
                      </p>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-emerald-300 font-bold">SYSTEM ACTIVE</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
