import React from 'react';
import { X, Download, School, Calendar, MapPin } from 'lucide-react';
import { SosialisasiReport } from '../types';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: SosialisasiReport | null;
  activeImageIndex?: number;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  report,
  activeImageIndex = 0,
}) => {
  const [currentIdx, setCurrentIdx] = React.useState(activeImageIndex);

  React.useEffect(() => {
    setCurrentIdx(activeImageIndex);
  }, [activeImageIndex, isOpen]);

  if (!isOpen || !report) return null;

  const images = (report.dokumentasiList && report.dokumentasiList.length > 0)
    ? report.dokumentasiList
    : report.dokumentasiUrl
    ? [report.dokumentasiUrl]
    : [];

  if (images.length === 0) return null;

  const currentImage = images[currentIdx] || images[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 flex items-start sm:items-center justify-center animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between border-b border-slate-700">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {report.wilayah}
              </span>
              <span className="text-xs text-slate-400">• {report.kabupatenKota}</span>
            </div>
            <h3 className="font-extrabold text-base sm:text-lg text-white mt-0.5 flex items-center space-x-2">
              <School className="w-4 h-4 text-emerald-400" />
              <span>{report.sekolah}</span>
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={currentImage}
              download={`dokumentasi-${report.sekolah.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              title="Unduh foto dokumentasi"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Unduh Foto</span>
            </a>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Display Area */}
        <div className="p-4 flex-1 flex items-center justify-center bg-black/60 overflow-hidden">
          <img
            src={currentImage}
            alt={`Dokumentasi ${report.sekolah}`}
            className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
          />
        </div>

        {/* Footer info & thumbnail selector if multiple photos */}
        <div className="px-6 py-3 bg-slate-800/90 border-t border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Kunjungan: {report.tanggalKunjungan}</span>
            </span>
            <span>PIC: {report.pic}</span>
          </div>

          {images.length > 1 && (
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-slate-400">Pilih Foto:</span>
              <div className="flex space-x-1.5">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-8 h-8 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === currentIdx
                        ? 'border-emerald-400 scale-105'
                        : 'border-slate-600 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
