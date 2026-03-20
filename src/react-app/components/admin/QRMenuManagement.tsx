import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Download, ExternalLink, QrCode, ArrowLeft } from 'lucide-react';
import { useToast } from '../Toast';

export default function QRMenuManagement() {
  const toast = useToast();
  // Get the base URL from the current window location
  const [baseUrl, setBaseUrl] = useState(() => {
    try {
      return window.location.origin;
    } catch (e) {
      return '';
    }
  });
  const menuUrl = baseUrl ? `${baseUrl}/qr/menu` : 'Link will appear when base URL is detected';

  useEffect(() => {
    const origin = window.location.origin;
    if (origin) {
      setBaseUrl(origin);
    }
  }, []);

  const copyToClipboard = () => {
    try {
      navigator.clipboard.writeText(menuUrl);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy link. Please copy it manually.');
    }
  };

  const downloadQRCode = () => {
    try {
      const svg = document.getElementById('qr-code-svg');
      if (!svg) {
        toast.error('QR code not found');
        return;
      }

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = 'pos-menu-qr.png';
        downloadLink.href = pngFile;
        downloadLink.click();
        toast.success('QR Code downloaded successfully!');
      };
      
      img.onerror = () => {
        toast.error('Failed to generate image from QR code');
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download QR code');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header with Back button for better navigation context */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Online QR Menu</h2>
            <p className="text-sm text-gray-500">Manage digital menu access for your customers</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Info & Actions */}
          <div className="p-8 border-b md:border-b-0 md:border-r border-gray-100">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Direct Menu Link
                </label>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-sm font-medium text-gray-900 break-all mb-4">
                    {menuUrl}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 hover:border-yellow-500 hover:text-yellow-600 px-4 py-2.5 rounded-lg text-sm font-bold transition-all"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </button>
                    <a
                      href={menuUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-yellow-100 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Menu
                    </a>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-1 h-4 bg-yellow-500 rounded-full"></div>
                  How it works
                </h3>
                <ul className="space-y-3">
                  {[
                    'Print this QR code on table cards or posters',
                    'Customers scan it to see your live menu',
                    'Updates automatically when you change prices',
                    'Bar items show stock status in real-time'
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                      <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-yellow-700">{i + 1}</span>
                      </div>
                      {text}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={downloadQRCode}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white font-bold py-4 px-6 rounded-xl transition-all active:scale-[0.98]"
              >
                <Download className="w-5 h-5" />
                Download Print-Ready QR
              </button>
            </div>
          </div>

          {/* Right Column: QR Code Preview */}
          <div className="p-8 bg-gray-50 flex flex-col items-center justify-center">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 mb-6">
              <QRCodeSVG
                id="qr-code-svg"
                value={menuUrl}
                size={220}
                level="H"
                includeMargin={true}
              />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900 mb-1">Live Preview</p>
              <p className="text-xs text-gray-500">Scan this code with a mobile camera</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6">
        <h4 className="text-sm font-bold text-blue-900 mb-2">💡 Scalability Tip</h4>
        <p className="text-xs text-blue-700 leading-relaxed">
          You can create different QR codes for different areas (e.g. Bar vs. Restaurant) by adding parameters to the URL like <code>{menuUrl}?area=bar</code>. The system is designed to automatically filter the menu based on these hints.
        </p>
      </div>
    </div>
  );
}
