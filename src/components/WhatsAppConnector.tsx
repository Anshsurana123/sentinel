"use client";

import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { getWhatsAppState } from "@/app/actions";

/**
 * WhatsApp Connector — Brutalist QR Bridge Component
 * Polls the database for QR codes written by the WhatsApp daemon.
 */
export default function WhatsAppConnector() {
  const [qr, setQr] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [polling, setPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startPolling = () => {
    setPolling(true);

    // Immediately fetch once
    fetchState();

    // Then poll every 3 seconds
    intervalRef.current = setInterval(fetchState, 3000);
  };

  const stopPolling = () => {
    setPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const fetchState = async () => {
    try {
      const state = await getWhatsAppState();
      setQr(state.qr);
      setConnected(state.connected);

      // Stop polling once connected
      if (state.connected) {
        stopPolling();
      }
    } catch (err) {
      console.error("[WA Connector] Poll failed:", err);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Already connected state
  if (connected) {
    return (
      <div className="border-2 border-green-500 p-4 text-center">
        <span className="text-green-500 text-[10px] font-bold uppercase tracking-[0.3em]">
          [ WHATSAPP LINKED ] 🟢
        </span>
      </div>
    );
  }

  return (
    <div className="border-2 border-white p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold uppercase tracking-widest">WhatsApp Link</h3>
        {!polling ? (
          <button
            onClick={startPolling}
            className="px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] border-2 border-white hover:bg-white hover:text-black transition-all"
          >
            Connect WhatsApp
          </button>
        ) : (
          <span className="text-[9px] text-gray-500 uppercase tracking-widest animate-pulse">
            Waiting for QR...
          </span>
        )}
      </div>

      {qr && (
        <div className="flex justify-center p-4 bg-white">
          <QRCodeSVG
            value={qr}
            size={200}
            bgColor="#ffffff"
            fgColor="#000000"
            level="M"
          />
        </div>
      )}

      {polling && !qr && (
        <p className="text-[9px] text-gray-600 uppercase tracking-widest text-center">
          Start the WhatsApp daemon to generate a QR code.
        </p>
      )}
    </div>
  );
}
