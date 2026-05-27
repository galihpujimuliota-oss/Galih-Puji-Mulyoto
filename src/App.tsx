import React, { useState, useRef } from 'react';
import { cn } from './lib/utils';
import { UploadCloud, FileAudio, Play, Loader2, Music, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DEFAULT_LYRICS = `PPG
di UIN MALANG
Kampus apa?
yang paling OK
U I N Malang
Tambah ganteng aja
My best campus
Bikin BAHAGIA

Datang pagi penuh semangat
Belajar bareng sahabat hebat
Dosen keren ilmunya mantap
BIKIN guru siap melesat

Tugas numpuk tetap santai
Microteaching jalan ramai
Walau revisi berkali-kali
Tetap happy setiap hari

PPG UIN Malang
Selalu di hati
Belajar mengabdi
Untuk negeri ini

PPG UIN Malang
Kompak sampai nanti
Jadi guru hebat
Penuh inspirasi`;

export default function App() {
  const [lyrics, setLyrics] = useState(DEFAULT_LYRICS);
  const [file, setFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setAudioUrl(null); // Reset prev audio
    }
  };

  const handleGenerate = async () => {
    if (!file) {
      setError('Silakan unggah file audio referensi terlebih dahulu.');
      return;
    }
    if (!lyrics.trim()) {
      setError('Lirik tidak boleh kosong.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);

    const formData = new FormData();
    formData.append('audio', file);
    formData.append('text', lyrics);

    try {
      const response = await fetch('/api/generate-voice', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Terjadi kesalahan pada server');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-200">
      {/* Navbar / Header */}
      <header className="bg-emerald-700 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <Music className="w-6 h-6 text-emerald-50" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">UIN Malang Voice Studio</h1>
              <p className="text-emerald-100 text-sm font-medium">AI Voice Cloning System</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Upload & Controls */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white shadow-sm rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold mb-1">1. Suara Referensi</h2>
              <p className="text-sm text-slate-500 mb-4">Unggah file suara untuk dikloning (contoh: MP3, WAV).</p>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ease-out group",
                  file 
                    ? "border-emerald-500 bg-emerald-50/50" 
                    : "border-slate-300 hover:border-emerald-400 hover:bg-slate-50"
                )}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="audio/*" 
                  onChange={handleFileChange}
                />
                
                {file ? (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
                    <div className="bg-emerald-100 text-emerald-600 p-3 rounded-full mb-3">
                      <FileAudio className="w-8 h-8" />
                    </div>
                    <p className="font-medium text-emerald-700 truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-emerald-600/70 mt-1">Ready to clone</p>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center opacity-70 group-hover:opacity-100 transition-opacity">
                    <div className="bg-slate-100 text-slate-500 p-3 rounded-full mb-3 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <p className="font-medium text-slate-700">Klik untuk mengunggah</p>
                    <p className="text-xs text-slate-500 mt-1">Audio yang jernih tanpa noise (Max 10MB)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-start gap-3 shadow-sm"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Right Column: Lyrics Editor & Generating */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-white shadow-sm rounded-2xl border border-slate-200 p-6 flex flex-col h-full">
              <h2 className="text-lg font-semibold mb-1">2. Lirik / Teks</h2>
              <p className="text-sm text-slate-500 mb-4">Edit teks ini, AI akan membacakannya dengan suara yang diunggah.</p>
              
              <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                className="w-full flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 font-medium leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all min-h-[300px]"
                placeholder="Masukkan lirik atau naskah Anda di sini..."
              />
              
              <div className="mt-6 pt-6 border-t border-slate-100">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-[15px] transition-all shadow-sm",
                    isGenerating 
                      ? "bg-emerald-100 text-emerald-500 cursor-not-allowed" 
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                  )}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Memproses Kloning Suara...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      Generate Suara
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Player Result Section */}
        <AnimatePresence>
          {audioUrl && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 bg-emerald-900 border-none rounded-2xl p-8 shadow-xl text-white relative overflow-hidden"
            >
              {/* decorative circle */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-4 shadow-sm rounded-full" />
                <h3 className="text-2xl font-bold mb-2">Audio Berhasil Dibuat!</h3>
                <p className="text-emerald-100/80 mb-8 max-w-lg">
                  Suara referensi Anda telah berhasil dikloning dan dibacakan sesuai lirik UIN Malang yang diberikan.
                </p>
                <div className="w-full max-w-2xl bg-black/20 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                  <audio controls src={audioUrl} className="w-full h-12 outline-none" autoPlay />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
