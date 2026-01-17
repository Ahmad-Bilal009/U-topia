import { QRCodeSVG } from 'qrcode.react';

function QRCodeCard({ referralLink }) {
  const fullUrl = referralLink.startsWith('http') 
    ? referralLink 
    : `${window.location.origin}${referralLink}`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-500 mb-1">QR Code</h3>
        <p className="text-xs text-gray-400">Scan to share referral link</p>
      </div>
      
      <div className="flex justify-center items-center bg-gray-50 rounded-lg p-4 sm:p-6">
        <div className="w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
          <QRCodeSVG
            value={fullUrl}
            size={200}
            level="H"
            includeMargin={true}
            className="rounded-lg w-full h-full max-w-full max-h-full"
          />
        </div>
      </div>
      
      <p className="text-xs text-gray-500 text-center mt-4">
        Share this QR code for easy access
      </p>
    </div>
  );
}

export default QRCodeCard;

