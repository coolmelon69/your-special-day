import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, Check, Copy, Sparkles } from "lucide-react";
import { useState } from "react";
import QRCode from "react-qr-code";
import type { Coupon } from "./GiftCouponsSection";

interface VoucherModalProps {
  coupon: Coupon | null;
  isOpen: boolean;
  onClose: () => void;
  onRedeem: (couponId: number) => void;
  isRedeemed: boolean;
}

const VoucherModal = ({
  coupon,
  isOpen,
  onClose,
  onRedeem,
  isRedeemed,
}: VoucherModalProps) => {
  const [copied, setCopied] = useState(false);

  if (!coupon) return null;

  // Generate unique voucher code
  const voucherCode = `VOUCHER-${coupon.id.toString().padStart(4, "0")}-${Date.now().toString(36).toUpperCase()}`;
  const qrCodeValue = JSON.stringify({
    code: voucherCode,
    couponId: coupon.id,
    title: coupon.title,
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText(voucherCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRedeem = () => {
    onRedeem(coupon.id);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl"
              initial={{ scale: 0.8, rotateY: -20, opacity: 0 }}
              animate={{ scale: 1, rotateY: 0, opacity: 1 }}
              exit={{ scale: 0.8, rotateY: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors z-10"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>

              {/* Content */}
              <div className="p-8 md:p-12">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="text-8xl mb-4">{coupon.emoji}</div>
                  <h2 className="font-serif text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                    {coupon.title}
                  </h2>
                  <p className="text-lg text-gray-600">{coupon.description}</p>
                </div>

                {/* Voucher Details Card */}
                <div className={`bg-gradient-to-br ${coupon.color} rounded-2xl p-8 mb-6 text-white relative overflow-hidden`}>
                  {/* Decorative elements */}
                  <div className="absolute top-4 right-4">
                    <Sparkles className="text-white/30" size={32} />
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <Sparkles className="text-white/20" size={24} />
                  </div>

                  <div className="relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      {/* QR Code */}
                      <div className="bg-white p-4 rounded-xl shadow-lg">
                        <QRCode
                          value={qrCodeValue}
                          size={160}
                          level="H"
                          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        />
                      </div>

                      {/* Voucher Code */}
                      <div className="flex-1 text-center md:text-left">
                        <p className="text-white/80 text-sm mb-2 font-medium">Voucher Code</p>
                        <div className="flex items-center gap-3 justify-center md:justify-start">
                          <code className="text-2xl font-mono font-bold bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                            {voucherCode}
                          </code>
                          <button
                            onClick={handleCopyCode}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                            title="Copy code"
                          >
                            {copied ? (
                              <Check className="w-5 h-5" />
                            ) : (
                              <Copy className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h3 className="font-serif text-xl font-bold mb-4 text-gray-800">
                    Terms & Conditions
                  </h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-1">•</span>
                      <span>This voucher has no expiration date and can be used anytime.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-1">•</span>
                      <span>Present the QR code or voucher code at the time of redemption.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-1">•</span>
                      <span>This voucher is non-transferable and can only be used once.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-1">•</span>
                      <span>Subject to availability and terms of the participating venue.</span>
                    </li>
                  </ul>
                </div>

                {/* Expiration Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <p className="text-blue-800 text-center font-medium">
                    <span className="font-bold">No Expiration Date</span> - This voucher is valid forever! 💕
                  </p>
                </div>

                {/* Action Buttons */}
                {!isRedeemed ? (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <motion.button
                      onClick={handleRedeem}
                      className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r ${coupon.color} text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Gift className="w-5 h-5" />
                      Redeem Voucher
                    </motion.button>
                    <motion.button
                      onClick={onClose}
                      className="px-8 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Close
                    </motion.button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3 px-8 py-4 bg-green-100 text-green-800 font-semibold rounded-xl">
                    <Check className="w-5 h-5" />
                    This voucher has been redeemed!
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VoucherModal;


