const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');

console.log("Iniciando o ficheiro server.js (Versão Final e Verificada)...");

const app = express();
const PORT = process.env.PORT || 4000;

// Ativa o CORS para todas as origens.
app.use(cors());
console.log("Middleware de CORS ativado.");

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
            const videoInfo = JSON.parse(stdout);
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
    ytdlp.exec(url, {
        format: formatId,
        output: '-',
    }).stdout.pipe(res);
});

app.listen(PORT, '0.0.0.0', () => {
    // ESTA É A NOSSA PROVA FINAL
    console.log(`Servidor iniciado com SUCESSO e com a correção de CORS V2! Porta: ${PORT}`);
});

