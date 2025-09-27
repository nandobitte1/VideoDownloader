console.log("Iniciando o arquivo server.js...");

const express = require('express');
const cors = require('cors');
// Importa a função 'exec' para executar comandos de terminal
const { exec } = require('child_process');

console.log("Bibliotecas importadas com sucesso.");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

console.log("Express e CORS configurados.");

app.get('/', (req, res) => {
    console.log("Rota raiz ('/') acedida.");
    res.send('Servidor do Video Downloader está no ar!');
});

app.post('/api/video-info', (req, res) => {
    const { url } = req.body;
    console.log(`Recebido pedido para obter informações do vídeo: ${url}`);

    if (!url) {
        console.error("Erro: URL não fornecida no pedido.");
        return res.status(400).json({ success: false, error: 'URL do vídeo é obrigatória.' });
    }

    // Comando de terminal para executar o yt-dlp
    // As flags são as mesmas, mas agora passadas como uma string de comando
    const command = `yt-dlp "${url}" --dump-single-json --no-warnings --skip-download --prefer-free-formats`;

    console.log(`A executar comando: ${command}`);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Erro ao executar o comando exec: ${error.message}`);
            console.error(`stderr: ${stderr}`);
            return res.status(500).json({ success: false, error: `Falha ao executar o yt-dlp. Detalhes: ${stderr || error.message}` });
        }

        try {
            console.log("Comando executado com sucesso. A processar a saída...");
            const metadata = JSON.parse(stdout);

            const formats = metadata.formats.map(f => ({
                format_id: f.format_id,
                ext: f.ext,
                resolution: f.resolution || 'audio',
                filesize: f.filesize,
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
            console.log("Informações do vídeo enviadas com sucesso.");
        } catch (parseError) {
            console.error("Erro ao processar a saída JSON do yt-dlp:", parseError);
            res.status(500).json({ success: false, error: 'Falha ao processar a resposta do serviço de vídeo.' });
        }
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor iniciado com sucesso e a ouvir na porta ${PORT}.`);
});

