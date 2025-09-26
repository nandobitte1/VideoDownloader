console.log("Iniciando o arquivo server.js...");

const express = require('express');
console.log("Express importado com sucesso.");

const cors = require('cors');
console.log("CORS importado com sucesso.");

const ytdlp = require('yt-dlp-exec');
console.log("yt-dlp-exec importado com sucesso.");

const app = express();
console.log("App Express criada.");

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Para servir o front-end (se estiver na mesma pasta)
console.log("Middlewares configurados.");

// Rota de Teste
app.get('/', (req, res) => {
    console.log("Rota raiz ('/') foi acessada.");
    res.send('Servidor do Video Downloader está no ar!');
});

// Rota para buscar informações do vídeo
app.post('/api/video-info', async (req, res) => {
    console.log("Recebida requisição em /api/video-info");
    const { url } = req.body;

    if (!url) {
        console.log("Erro: Nenhuma URL fornecida.");
        return res.status(400).json({ error: 'URL é obrigatória.' });
    }

    try {
        console.log(`Buscando informações para a URL: ${url}`);
        const metadata = await ytdlp(url, {
            dumpSingleJson: true,
            noWarnings: true,
            noCheckCertificate: true,
            preferFreeFormats: true,
        });
        console.log("Metadados do vídeo obtidos com sucesso.");
        
        const videoInfo = {
            title: metadata.title,
            thumbnail: metadata.thumbnail,
            formats: metadata.formats,
            originalUrl: url
        };
        
        res.json(videoInfo);

    } catch (error) {
        console.error("Erro ao buscar informações do vídeo:", error.message);
        res.status(500).json({ error: 'Não foi possível obter as informações do vídeo. A URL pode ser inválida ou o site não é suportado.' });
    }
});

// Rota para iniciar o download do vídeo
app.get('/api/download', (req, res) => {
    console.log("Recebida requisição em /api/download");
    const { url, formatId } = req.query;

    if (!url || !formatId) {
        console.log("Erro: URL ou formatId ausentes.");
        return res.status(400).send('URL e ID do formato são obrigatórios.');
    }

    try {
        console.log(`Iniciando download para URL: ${url} com formato: ${formatId}`);
        const videoStream = ytdlp.exec(url, {
            format: formatId,
            output: '-', // Envia para a saída padrão (stdout)
        });

        res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');
        videoStream.stdout.pipe(res);

        videoStream.stdout.on('end', () => {
            console.log("Download finalizado e enviado com sucesso.");
        });

        videoStream.stderr.on('data', (data) => {
            console.error(`yt-dlp stderr: ${data}`);
        });

    } catch (error) {
        console.error("Erro durante o download:", error.message);
        res.status(500).send('Ocorreu um erro ao baixar o vídeo.');
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor iniciado com sucesso e ouvindo na porta ${PORT}.`);
});

