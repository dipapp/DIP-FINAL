'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase/client';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function SupportBubble() {
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showTicketDetail, setShowTicketDetail] = useState(false);
  
  
  // New ticket form
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('normal');
  const [description, setDescription] = useState('');

  const SUPPORT_EMAIL = 'support@dipmembers.com';

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) return;

      // Load user's tickets
      try {
        const q = query(
          collection(db, 'support'),
          where('userId', '==', currentUser.uid)
        );

        const unsubTickets = onSnapshot(q, 
          (snapshot) => {
            const ticketData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            ticketData.sort((a, b) => {
              const aTime = (a as any).createdAt?.toDate?.() || new Date(0);
              const bTime = (b as any).createdAt?.toDate?.() || new Date(0);
              return bTime.getTime() - aTime.getTime();
            });
            setTickets(ticketData);
          },
          (error) => {
            console.warn('Error loading support tickets:', error);
            setTickets([]);
          }
        );

        return () => unsubTickets();
      } catch (error) {
        console.warn('Error setting up support tickets query:', error);
        setTickets([]);
      }
    });

    return () => unsubAuth();
  }, []);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subject.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'support'), {
        userId: user.uid,
        userEmail: user.email,
        subject: subject.trim(),
        category,
        priority,
        description: description.trim(),
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Send email notification to support team
      try {
        await fetch('/api/send-support-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ticketId: docRef.id,
            userEmail: user.email,
            subject: subject.trim(),
            category,
            priority,
            description: description.trim(),
            userId: user.uid
          }),
        });
      } catch (emailError) {
        console.warn('Failed to send email notification:', emailError);
        // Don't fail the whole operation if email fails
      }

      // Reset form
      setSubject('');
      setDescription('');
      setCategory('general');
      setPriority('normal');
      setShowTicketForm(false);
      
      alert('Support ticket submitted successfully!');
    } catch (error) {
      console.error('Error submitting ticket:', error);
      alert('Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this support ticket?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'support', ticketId));
      setShowTicketDetail(false);
      setSelectedTicket(null);
      alert('Support ticket deleted successfully!');
    } catch (error) {
      console.error('Error deleting ticket:', error);
      alert('Failed to delete ticket. Please try again.');
    }
  };

  

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { color: 'bg-blue-100 text-blue-800', text: 'Open' },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', text: 'In Progress' },
      resolved: { color: 'bg-green-100 text-green-800', text: 'Resolved' },
      closed: { color: 'bg-gray-100 text-gray-800', text: 'Closed' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (!user) return null;

  return (
    <>
      {/* Support Bubble */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          {/* Notification dot for open tickets */}
          {tickets.some(t => t.status === 'open' || t.status === 'in_progress') && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white"></div>
          )}
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="group relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center space-x-3 px-5 py-4">
              <div className="relative">
                <span className="text-xl">💬</span>
                <div className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="hidden sm:inline font-medium text-sm">Help</span>
            </div>
          </button>
        </div>
      </div>

      {/* Support Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-[500px] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-sm">🎧</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Support Center</h3>
                    <p className="text-blue-100 text-xs">We're here to help</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <span className="text-lg">×</span>
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
              {/* Quick Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowTicketForm(true)}
                  className="w-full bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-800 p-4 rounded-xl text-left transition-all duration-200 transform hover:scale-[1.02] border border-blue-200/50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                      <span className="text-lg">📝</span>
                    </div>
                    <div>
                      <div className="font-semibold">Create Support Ticket</div>
                      <div className="text-sm text-blue-600">Get help with your account</div>
                    </div>
                  </div>
                </button>

                {/* Removed Emergency Towing and Live Chat options as requested */}
              </div>

              {/* Recent Tickets */}
              {tickets.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="mr-2">🎫</span>
                    Recent Tickets
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {tickets.slice(0, 3).map((ticket) => (
                      <div 
                        key={ticket.id} 
                        className="bg-gray-50 hover:bg-gray-100 p-3 rounded-lg transition-colors border border-gray-200/50 cursor-pointer"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowTicketDetail(true);
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm truncate text-gray-800">{ticket.subject}</span>
                          {getStatusBadge(ticket.status)}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <span className="mr-2">📅</span>
                          {ticket.createdAt?.toDate?.()?.toLocaleDateString?.() || 'Recently'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-gray-100 pt-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Need immediate help? Call us at{' '}
                    <span className="font-mono text-blue-600">1-800-DIP-HELP</span>
                  </p>
                </div>
              </div>
            </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {showTicketForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-lg">📝</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Create Support Ticket</h2>
                    <p className="text-blue-100 text-sm">We'll get back to you soon</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTicketForm(false)}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <span className="text-lg">×</span>
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              <form onSubmit={handleSubmitTicket} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Category
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="general">General</option>
                      <option value="account">Account</option>
                      <option value="vehicle">Vehicle</option>
                      <option value="request">Request</option>
                      <option value="billing">Billing</option>
                      <option value="technical">Technical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Priority
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Description *
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Please describe your issue in detail..."
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowTicketForm(false)}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !subject.trim() || !description.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
                  >
                    {submitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      'Submit Ticket'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {showTicketDetail && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-lg">🎫</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Support Ticket</h2>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTicketDetail(false);
                    setSelectedTicket(null);
                  }}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <span className="text-lg">×</span>
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              {/* Ticket Info */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(selectedTicket.status)}
                    <span className="text-sm text-gray-500">
                      {selectedTicket.category} • {selectedTicket.priority} priority
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {selectedTicket.createdAt?.toDate?.()?.toLocaleDateString?.() || 'Recently'}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedTicket.subject}</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500">
                    Last updated: {selectedTicket.updatedAt?.toDate?.()?.toLocaleDateString?.() || 'Recently'}
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowTicketDetail(false);
                        setSelectedTicket(null);
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                    >
                      Close
                    </button>
                    {(selectedTicket.status === 'open' || selectedTicket.status === 'in_progress') && (
                      <button
                        onClick={() => handleDeleteTicket(selectedTicket.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Delete Ticket
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Removed Emergency Towing and Live Chat modals */}
    </>
  );
}
