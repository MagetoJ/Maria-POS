import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  X, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Lock,
  Loader2
} from 'lucide-react';
import { API_URL } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../Toast';

interface AccessRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestType: string;
  onApproved: () => void;
}

export default function AccessRequestModal({ 
  isOpen, 
  onClose, 
  requestType,
  onApproved 
}: AccessRequestModalProps) {
  const [status, setStatus] = useState<'none' | 'pending' | 'approved' | 'denied'>('none');
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState<number | null>(null);
  const { token } = useAuth();
  const toast = useToast();

  const checkStatus = async () => {
    if (!requestId) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/access-requests/status?type=${requestType}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'approved') {
          setStatus('approved');
          toast.success('Access granted! You can now proceed.');
          setTimeout(() => {
            onApproved();
            onClose();
          }, 1500);
        } else if (data.status === 'denied') {
          setStatus('denied');
          toast.error('Access request was denied by Admin.');
        }
      }
    } catch (error) {
      console.error('Check status error:', error);
    }
  };

  useEffect(() => {
    let interval: any;
    if (status === 'pending') {
      interval = setInterval(checkStatus, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, requestId]);

  const handleSubmitRequest = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/access-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ request_type: requestType })
      });

      const data = await response.json();
      
      if (response.ok) {
        setRequestId(data.id);
        setStatus('pending');
        toast.info('Access request sent to Admin. Please wait for approval.');
      } else {
        if (data.status === 'pending') {
          setRequestId(data.id);
          setStatus('pending');
          toast.info('You already have a pending request.');
        } else if (data.status === 'approved') {
          onApproved();
          onClose();
        } else {
          throw new Error(data.message || 'Failed to send request');
        }
      }
    } catch (error: any) {
      console.error('Submit request error:', error);
      toast.error(error.message || 'Failed to send access request');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-yellow-600" />
            <h3 className="font-bold text-gray-800">Access Restricted</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-8 text-center">
          {status === 'none' && (
            <>
              <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-yellow-100">
                <Lock className="w-10 h-10 text-yellow-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Permission Required</h4>
              <p className="text-gray-600 mb-8">
                You need Admin approval to process <strong>{requestType.replace(/_/g, ' ')}</strong>. 
                Would you like to send a request now?
              </p>
              <button
                onClick={handleSubmitRequest}
                disabled={loading}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Access Request'}
              </button>
            </>
          )}

          {status === 'pending' && (
            <>
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-blue-100">
                <Clock className="w-10 h-10 text-blue-600 animate-pulse" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Request Pending</h4>
              <p className="text-gray-600 mb-8">
                Your request has been sent to the Admin. Please stay on this screen while we wait for approval.
              </p>
              <div className="flex items-center justify-center gap-3 text-blue-600 bg-blue-50 py-3 px-4 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Waiting for Admin response...</span>
              </div>
            </>
          )}

          {status === 'approved' && (
            <>
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-100">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Access Granted!</h4>
              <p className="text-gray-600">
                The Admin has approved your request. Redirecting you now...
              </p>
            </>
          )}

          {status === 'denied' && (
            <>
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-red-100">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h4>
              <p className="text-gray-600 mb-8">
                Your request for access was declined by the Admin.
              </p>
              <button
                onClick={onClose}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-xl transition-all"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
