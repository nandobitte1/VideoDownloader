const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');

console.log("Iniciando o ficheiro server.js (Versão Definitiva)...");

const app = express();
const PORT = process.env.PORT || 4000;

// --- CONFIGURAÇÃO DE CORS ROBUSTA E EXPLÍCITA ---
const corsOptions = {
  origin: '*', // Permite qualquer origem (como o seu site no Netlify)
  methods: 'GET,POST', // Permite os métodos que usamos
  optionsSuccessStatus: 200 // Responde com sucesso às "perguntas de segurança" (preflight)
};

// Ativa o CORS com as opções robustas
app.use(cors(corsOptions));
console.log("Middleware de CORS robusto ativado.");

app.use(express.json());
console.log("Middleware express.json configurado.");

app.get('/', (req, res) => {
    res.send('Servidor do Video Downloader está no ar e pronto!');
});

app.post('/api/video-info', (req, res) => {
    const videoUrl = req.body.url;
    console.log(`[${new Date().toISOString()}] Recebida requisição para a URL: ${videoUrl}`);

    if (!videoUrl) {
        return res.status(400).json({ error: 'URL do vídeo é obrigatória.' });
    }

    const command = `yt-dlp --dump-json "${videoUrl}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Erro ao executar yt-dlp: ${error.message}`);
            return res.status(500).json({ error: 'Falha ao buscar informações do vídeo.', details: stderr || error.message });
        }

        try {
            // A saída do yt-dlp pode ter várias linhas, o JSON é geralmente a última
            const lines = stdout.trim().split('\n');
            const jsonLine = lines[lines.length - 1];
            const videoInfo = JSON.parse(jsonLine);
            
            console.log(`Informações obtidas para: ${videoInfo.title}`);
            res.json({
                title: videoInfo.title,
                thumbnail: videoInfo.thumbnail,
                formats: videoInfo.formats,
                originalUrl: videoUrl
            });
        } catch (parseError) {
            console.error(`Erro ao processar JSON: ${parseError.message}`);
            res.status(500).json({ error: 'Falha ao processar a resposta do vídeo.', details: stdout });
        }
    });
});

app.get('/api/download', (req, res) => {
    const { url, formatId } = req.query;
    if (!url || !formatId) {
        return res.status(400).send('URL e ID do formato são obrigatórios.');
    }
    const filename = `video_${Date.now()}.mp4`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Usando exec para a rota de download também para consistência
    const command = `yt-dlp -f "${formatId}" -o - "${url}"`;
    const child = exec(command);

    child.stdout.pipe(res);

    child.stderr.on('data', (data) => {
        console.error(`yt-dlp (download) stderr: ${data}`);
    });

    res.on('close', () => {
        child.kill();
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor iniciado com SUCESSO na porta ${PORT} com a configuração de CORS final.`);
});

