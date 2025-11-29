/**
 * Call Center Representative UI Simulator
 * Realistic call center interface showing customer info, call controls, and workflow
 * Coaching chatbot overlays on top of this interface
 */

import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, UserPlus, ArrowRightLeft, Clock, User, AlertCircle, CheckCircle } from 'lucide-react';

interface CallState {
  active: boolean;
  onHold: boolean;
  muted: boolean;
  duration: number;
  callerPhone: string;
}

interface Customer {
  name: string;
  id: string;
  status: string;
  phone: string;
  email: string;
  openCases: number;
  lastContact: string;
}

interface Props {
  onCallStateChange?: (state: CallState) => void;
  autoStartCall?: boolean;
  topOffset?: number;
}

export default function CallCenterRepUI({ onCallStateChange, autoStartCall = false, topOffset = 0 }: Props) {
  const [callState, setCallState] = useState<CallState>({
    active: false,
    onHold: false,
    muted: false,
    duration: 0,
    callerPhone: '+1 (555) 123-4567'
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [notes, setNotes] = useState('');
  const [verified, setVerified] = useState({
    lastName: false,
    dob: false,
    zip: false
  });

  const customer: Customer = {
    name: 'Sarah Johnson',
    id: 'CUST-789012',
    status: 'Gold Member',
    phone: '+1 (555) 123-4567',
    email: 'sarah.j@email.com',
    openCases: 2,
    lastContact: '3 days ago'
  };

  // Auto-start call
  useEffect(() => {
    if (autoStartCall && !callState.active) {
      setTimeout(() => handleAnswerCall(), 1000);
    }
  }, [autoStartCall]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState.active && !callState.onHold) {
      interval = setInterval(() => {
        setCallState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState.active, callState.onHold]);

  // Notify parent
  useEffect(() => {
    onCallStateChange?.(callState);
  }, [callState, onCallStateChange]);

  const handleAnswerCall = () => {
    setCallState(prev => ({ ...prev, active: true, duration: 0 }));
  };

  const handleEndCall = () => {
    setCallState(prev => ({ ...prev, active: false, duration: 0, onHold: false, muted: false }));
  };

  const toggleHold = () => {
    setCallState(prev => ({ ...prev, onHold: !prev.onHold }));
  };

  const toggleMute = () => {
    setCallState(prev => ({ ...prev, muted: !prev.muted }));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col w-full h-full bg-gray-100 text-sm">
      {/* Top Bar */}
      <div className="sticky top-0 left-0 right-0 h-14 bg-blue-600 text-white flex items-center px-4 z-10 shadow-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <Phone className="w-5 h-5" />
          <span className="font-bold text-lg">Contact Center</span>
        </div>
        <div className="ml-8 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span className="font-medium">{callState.active ? 'In Call' : 'Available'}</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <input 
            type="text" 
            placeholder="Search customer..." 
            className="px-3 py-1.5 rounded bg-blue-700 text-white placeholder-blue-300 border-none focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <span>Rep: Demo User</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-60 bg-gray-800 text-gray-200 p-4 flex-shrink-0 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Queues</h3>
            <div className="space-y-1">
              <div className="px-3 py-2 bg-blue-600 rounded cursor-pointer">Support <span className="float-right">(5)</span></div>
              <div className="px-3 py-2 hover:bg-gray-700 rounded cursor-pointer">Billing <span className="float-right">(2)</span></div>
              <div className="px-3 py-2 hover:bg-gray-700 rounded cursor-pointer">Sales <span className="float-right">(0)</span></div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Views</h3>
            <div className="space-y-1">
              <div className="px-3 py-2 hover:bg-gray-700 rounded cursor-pointer">My Tickets</div>
              <div className="px-3 py-2 hover:bg-gray-700 rounded cursor-pointer">All Open</div>
              <div className="px-3 py-2 hover:bg-gray-700 rounded cursor-pointer">Callbacks</div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Shortcuts</h3>
            <div className="space-y-1">
              <div className="px-3 py-2 hover:bg-gray-700 rounded cursor-pointer">Knowledge Base</div>
              <div className="px-3 py-2 hover:bg-gray-700 rounded cursor-pointer">Team Chat</div>
            </div>
          </div>
        </div>

        {/* Center Work Area */}
        <div className="flex-1 flex flex-col bg-white min-h-0 overflow-hidden">
          {/* Customer Header */}
          {callState.active && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {customer.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">{customer.status}</span>
                      <span className="text-gray-600">{customer.phone}</span>
                      <span className="text-gray-600">{customer.email}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">ID: {customer.id}</div>
                  <div className="text-sm mt-1">Open Cases: <span className="font-semibold">{customer.openCases}</span></div>
                  <div className="text-sm">Last Contact: <span className="font-semibold">{customer.lastContact}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          {callState.active && (
            <div className="border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex gap-1 px-4">
                {['overview', 'history', 'account', 'billing'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2.5 font-medium text-sm capitalize ${
                      activeTab === tab
                        ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab Content */}
          <div className="flex-1 overflow-auto p-6 min-h-0">
            {!callState.active ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Phone className="w-16 h-16 mb-4" />
                <p className="text-lg">No active call</p>
                <p className="text-sm">Waiting for next customer...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {/* Left: Script */}
                <div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-bold text-gray-900 mb-3">Call Script</h3>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Call Reason</label>
                      <select className="w-full border border-gray-300 rounded px-3 py-2">
                        <option>Hotel Reservation Issue</option>
                        <option>Billing Question</option>
                        <option>Technical Support</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-3">
                        <div className="font-semibold text-blue-900 mb-1">Step 1: Greeting</div>
                        <p className="text-sm text-blue-800">"Thank you for calling. My name is [NAME]. How may I assist you today?"</p>
                      </div>

                      <div className="bg-gray-50 border-l-4 border-gray-300 p-3">
                        <div className="font-semibold text-gray-900 mb-2">Step 2: Verify Identity</div>
                        <div className="space-y-2 text-sm">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={verified.lastName}
                              onChange={(e) => setVerified(prev => ({ ...prev, lastName: e.target.checked }))}
                              className="w-4 h-4"
                            />
                            <span>Last name confirmed</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={verified.dob}
                              onChange={(e) => setVerified(prev => ({ ...prev, dob: e.target.checked }))}
                              className="w-4 h-4"
                            />
                            <span>Date of birth verified</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={verified.zip}
                              onChange={(e) => setVerified(prev => ({ ...prev, zip: e.target.checked }))}
                              className="w-4 h-4"
                            />
                            <span>ZIP code confirmed</span>
                          </label>
                        </div>
                      </div>

                      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3">
                        <div className="font-semibold text-yellow-900 mb-1">Step 3: Address Issue</div>
                        <p className="text-sm text-yellow-800">Listen actively and document the customer's concern.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Key Info */}
                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-bold text-gray-900 mb-3">Recent Activity</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3 pb-3 border-b">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium">Reservation #RES-45678</div>
                          <div className="text-gray-500">Confirmed - Nov 20-23, 2025</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 pb-3 border-b">
                        <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium">Payment Pending</div>
                          <div className="text-gray-500">Balance due: $156.00</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <User className="w-4 h-4 text-blue-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium">Last Call: 3 days ago</div>
                          <div className="text-gray-500">Issue: Room upgrade request</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Alerts
                    </h3>
                    <ul className="text-sm text-red-800 space-y-1">
                      <li>• VIP customer - escalate if needed</li>
                      <li>• Previous complaint logged</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes & Disposition */}
          {callState.active && (
            <div className="border-t border-gray-200 bg-gray-50 p-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Call Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 h-24 resize-none"
                    placeholder="Enter call notes..."
                  />
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Issue Type</label>
                    <select className="w-full border border-gray-300 rounded px-3 py-2">
                      <option>Select...</option>
                      <option>Reservation Issue</option>
                      <option>Billing</option>
                      <option>Complaint</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Resolution</label>
                    <select className="w-full border border-gray-300 rounded px-3 py-2">
                      <option>Select...</option>
                      <option>Resolved</option>
                      <option>Escalated</option>
                      <option>Callback</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Call Controls */}
        <div className="w-80 bg-gray-50 border-l border-gray-200 p-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="text-center mb-4">
              <div className="text-sm text-gray-500 mb-1">
                {callState.active ? 'Active Call' : 'Incoming Call'}
              </div>
              <div className="text-xl font-bold text-gray-900">{callState.callerPhone}</div>
              {callState.active && (
                <div className="flex items-center justify-center gap-2 mt-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-2xl font-mono">{formatDuration(callState.duration)}</span>
                </div>
              )}
              {callState.onHold && (
                <div className="mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded">
                  ON HOLD
                </div>
              )}
            </div>

            <div className="space-y-2">
              {!callState.active ? (
                <button
                  onClick={handleAnswerCall}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  Answer Call
                </button>
              ) : (
                <>
                  <button
                    onClick={handleEndCall}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                  >
                    <PhoneOff className="w-5 h-5" />
                    End Call
                  </button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={toggleHold}
                      className={`py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 ${
                        callState.onHold
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                    >
                      <Phone className="w-4 h-4" />
                      {callState.onHold ? 'Resume' : 'Hold'}
                    </button>
                    
                    <button
                      onClick={toggleMute}
                      className={`py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 ${
                        callState.muted
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                    >
                      {callState.muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      {callState.muted ? 'Unmute' : 'Mute'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button className="py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold flex items-center justify-center gap-2">
                      <ArrowRightLeft className="w-4 h-4" />
                      Transfer
                    </button>
                    <button className="py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold flex items-center justify-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Conference
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {callState.active && (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">Verification Checklist</h3>
                <div className="space-y-2 text-sm">
                  <div className={`flex items-center gap-2 ${verified.lastName ? 'text-green-600' : 'text-gray-500'}`}>
                    {verified.lastName ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>}
                    Last name
                  </div>
                  <div className={`flex items-center gap-2 ${verified.dob ? 'text-green-600' : 'text-gray-500'}`}>
                    {verified.dob ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>}
                    Date of birth
                  </div>
                  <div className={`flex items-center gap-2 ${verified.zip ? 'text-green-600' : 'text-gray-500'}`}>
                    {verified.zip ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>}
                    ZIP code
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                <h3 className="font-bold text-blue-900 mb-2 text-sm">Suggested Articles</h3>
                <div className="space-y-2 text-sm">
                  <a href="#" className="block text-blue-600 hover:underline">How to handle reservation changes</a>
                  <a href="#" className="block text-blue-600 hover:underline">Overbooking policy and procedures</a>
                  <a href="#" className="block text-blue-600 hover:underline">Customer compensation guidelines</a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
