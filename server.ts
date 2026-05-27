import express from 'express';
import path from 'path';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for JSON
  app.use(express.json());

  // Setup Multer for memory storage since we process files in-memory
  const upload = multer({ storage: multer.memoryStorage() });

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/generate-voice', upload.single('audio'), async (req, res) => {
    try {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ 
          error: 'ELEVENLABS_API_KEY tidak dikonfigurasi. Harap tambahkan API Key ElevenLabs di menu Settings/Secrets untuk menggunakan fitur kloning suara.' 
        });
      }

      const file = req.file;
      const { text } = req.body;

      if (!file || !text) {
        return res.status(400).json({ error: 'File audio referensi dan lirik wajib diisi.' });
      }

      console.log('Cloning voice...');
      
      // 1. Clone Voice
      const formData = new FormData();
      formData.append('name', `Clone_${Date.now()}`);
      formData.append('files', file.buffer, { 
        filename: file.originalname, 
        contentType: file.mimetype 
      });

      const addVoiceRes = await axios.post('https://api.elevenlabs.io/v1/voices/add', formData, {
        headers: {
          'xi-api-key': apiKey,
          ...formData.getHeaders()
        }
      });

      const voiceId = addVoiceRes.data.voice_id;
      console.log(`Voice cloned successfully. ID: ${voiceId}`);

      // 2. Synthesize Speech
      console.log('Generating speech...');
      const ttsRes = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text: text,
          model_id: 'eleven_multilingual_v2', // Multilingual model for Indonesian support
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        },
        {
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );

      // 3. Cleanup: Delete the cloned voice to save quota/space
      console.log('Cleaning up voice...');
      await axios.delete(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
        headers: { 'xi-api-key': apiKey }
      }).catch(e => console.error('Failed to cleanup cloned voice', e.message));

      console.log('Done!');
      // 4. Return audio to client
      res.set('Content-Type', 'audio/mpeg');
      res.send(Buffer.from(ttsRes.data));

    } catch (error: any) {
      console.error('Error generating voice:', error.response?.data || error.message);
      const msg = error.response?.data?.detail?.message || 'Gagal menghasilkan audio. Pastikan file valid atau cek sisa kuota ElevenLabs Anda.';
      res.status(500).json({ error: msg });
    }
  });

  // Vite Integration for Development & Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
