const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');

// Log para confirmar que o ficheiro está a ser executado
console.log("Iniciando o ficheiro server.js...");

const app = express();
// Lê a porta da variável de ambiente do Railway, ou usa 4000 como padrão
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

console.log("Middleware (cors, express.json) configurado.");

// Rota de teste para verificar se o servidor está no ar
app.get('/', (req, res) => {
    console.log("Recebida requisição na rota raiz '/'.");
    res.send('Servidor do Video Downloader está no ar!');
});

app.post('/api/video-info', (req, res) => {
    const videoUrl = req.body.url;
    console.log(`[${new Date().toISOString()}] Recebida requisição para a URL: ${videoUrl}`);

    if (!videoUrl) {
        console.error("Erro: Nenhuma URL foi fornecida na requisição.");
        return res.status(400).json({ error: 'URL do vídeo é obrigatória.' });
    }

    // Comando para obter os metadados do vídeo como JSON
    const command = `yt-dlp --dump-json "${videoUrl}"`;
    console.log(`Executando comando: ${command}`);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Erro ao executar o comando yt-dlp: ${error.message}`);
            console.error(`Stderr: ${stderr}`);
            // Envia uma resposta de erro mais detalhada para depuração
            return res.status(500).json({ error: 'Falha ao buscar informações do vídeo.', details: stderr || error.message });
        }

        try {
            // A saída pode conter múltiplas linhas de JSON, pegamos a última
            const lines = stdout.trim().split('\n');
            const lastLine = lines[lines.length - 1];
            const videoInfo = JSON.parse(lastLine);
            
            console.log(`Informações do vídeo obtidas com sucesso para: ${videoInfo.title}`);

            const formats = videoInfo.formats
                .filter(f => f.vcodec !== 'none' && f.acodec !== 'none' && f.ext === 'mp4')
                .map(f => ({
                    quality: f.format_note || `${f.height}p`,
                    url: f.url,
                    ext: f.ext,
                }))
                .reverse(); 

            // Remove duplicados de qualidade, mantendo o melhor
            const uniqueFormats = Array.from(new Map(formats.map(item => [item['quality'], item])).values());

            res.json({
                title: videoInfo.title,
                thumbnail: videoInfo.thumbnail,
                formats: uniqueFormats,
            });
        } catch (parseError) {
            console.error(`Erro ao fazer o parse da saída do yt-dlp: ${parseError.message}`);
            console.error(`Saída recebida (stdout): ${stdout}`);
            res.status(500).json({ error: 'Falha ao processar as informações do vídeo.', details: stdout });
        }
    });
});

// O servidor deve ouvir em '0.0.0.0' para ser acessível em ambientes de container
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor iniciado com sucesso e ouvindo na porta ${PORT}.`);
});

