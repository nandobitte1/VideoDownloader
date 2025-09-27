// server.js Corrigido

const express = require('express');
const cors = require('cors');
// Importa a biblioteca yt-dlp-exec em vez de 'child_process'
const ytdlp = require('yt-dlp-exec');

const app = express();
// O Render define a porta automaticamente, por isso é importante usar process.env.PORT
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Rota principal para verificar se o servidor está online
app.get('/', (req, res) => {
    res.send('Servidor do Video Downloader está no ar!');
});

// Rota para obter as informações do vídeo
app.post('/api/video-info', async (req, res) => {
    const { url } = req.body;
    console.log(`Recebido pedido para obter informações do vídeo: ${url}`);

    if (!url) {
        return res.status(400).json({ error: 'URL do vídeo é obrigatória.' });
    }

    try {
        // Usa a biblioteca para obter os metadados do vídeo em formato JSON
        const metadata = await ytdlp(url, {
            dumpSingleJson: true,
            noWarnings: true,
            skipDownload: true,
            preferFreeFormats: true,
        });

        // Filtra e formata os dados para enviar ao frontend
        const formats = metadata.formats.map(f => ({
            format_id: f.format_id,
            ext: f.ext,
            resolution: f.resolution || 'audio',
            filesize: f.filesize,
            acodec: f.acodec,
            vcodec: f.vcodec
        })).filter(f => (f.vcodec !== 'none' || f.acodec !== 'none')); // Garante que tem vídeo ou áudio

        const videoInfo = {
            title: metadata.title,
            thumbnail: metadata.thumbnail,
            duration: metadata.duration_string,
            formats: formats,
            // Envia a URL original de volta para ser usada nos links de download
            originalUrl: url 
        };

        res.json(videoInfo);
        console.log("Informações do vídeo enviadas com sucesso.");

    } catch (error) {
        console.error("Erro ao obter informações do vídeo:", error.message);
        res.status(500).json({ error: 'Falha ao buscar informações do vídeo. Verifique se o link está correto.' });
    }
});

// Rota para iniciar o download do vídeo (ESTA ROTA ESTAVA EM FALTA)
app.get('/api/download', (req, res) => {
    const { url, formatId } = req.query;

    if (!url || !formatId) {
        return res.status(400).send('URL e ID do formato são obrigatórios.');
    }

    console.log(`Iniciando download para URL: ${url} com formato: ${formatId}`);

    try {
        // Configura os cabeçalhos para forçar o download no navegador
        res.header('Content-Disposition', 'attachment; filename="video.mp4"');

        // Executa o yt-dlp e transmite a saída (o vídeo) diretamente para a resposta
        // Isso evita ter que salvar o vídeo no servidor primeiro, economizando espaço e tempo
        ytdlp.exec(url, {
            format: formatId,
            output: '-', // '-' significa para enviar para a saída padrão (stdout)
        }).stdout.pipe(res);

    } catch (error) {
        console.error("Erro durante o download:", error);
        res.status(500).send('Ocorreu um erro ao tentar baixar o vídeo.');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor iniciado com sucesso na porta ${PORT}.`);
});