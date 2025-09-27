console.log("Iniciando o arquivo server.js...");

const express = require('express');
const cors = require('cors');
const ytdlp = require('yt-dlp-exec');

console.log("Bibliotecas importadas com sucesso.");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

console.log("Express e CORS configurados.");

// Endpoint para verificar se o servidor está no ar
app.get('/', (req, res) => {
    console.log("Rota raiz ('/') acedida.");
    res.send('Servidor do Video Downloader está no ar!');
});

// Endpoint para obter informações do vídeo
app.post('/api/video-info', async (req, res) => {
    const { url } = req.body;
    console.log(`Recebido pedido para obter informações do vídeo: ${url}`);

    if (!url) {
        console.error("Erro: URL não fornecida no pedido.");
        return res.status(400).json({ success: false, error: 'URL do vídeo é obrigatória.' });
    }

    try {
        console.log("A executar o yt-dlp para obter metadados...");
        const metadata = await ytdlp(url, {
            dumpSingleJson: true,
            noWarnings: true,
            skipDownload: true,
            preferFreeFormats: true,
        });
        console.log("Metadados obtidos com sucesso.");

        const formats = metadata.formats.map(f => ({
            format_id: f.format_id,
            ext: f.ext,
            resolution: f.resolution || 'audio',
            fps: f.fps,
            filesize: f.filesize,
            tbr: f.tbr,
            url: f.url,
            acodec: f.acodec,
            vcodec: f.vcodec
        })).filter(f => f.url && (f.vcodec !== 'none' || f.acodec !== 'none'));

        const videoInfo = {
            title: metadata.title,
            thumbnail: metadata.thumbnail,
            duration: metadata.duration_string,
            formats: formats
        };

        res.json({ success: true, videoInfo });
    } catch (error) {
        console.error("Erro ao executar o yt-dlp:", error);
        res.status(500).json({ success: false, error: `Falha ao obter informações do vídeo. Verifique se a URL é válida. Detalhes: ${error.message}` });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor iniciado com sucesso e a ouvir na porta ${PORT}.`);
});

