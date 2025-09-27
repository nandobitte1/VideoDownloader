const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');

// Log inicial para confirmar a execução
console.log("Iniciando o ficheiro server.js...");

const app = express();
const PORT = process.env.PORT || 4000;

// --- CORREÇÃO DE CORS ---
// Ativa o CORS para todas as origens. Isto deve ser uma das primeiras coisas.
app.use(cors());
console.log("CORS ativado para todas as origens.");

// Outros middlewares
app.use(express.json());
console.log("Middleware express.json configurado.");

// Rota de teste
app.get('/', (req, res) => {
    console.log("Recebida requisição na rota raiz '/'.");
    res.send('Servidor do Video Downloader está no ar e com CORS ativado!');
});

app.post('/api/video-info', (req, res) => {
    const videoUrl = req.body.url;
    console.log(`[${new Date().toISOString()}] Recebida requisição para a URL: ${videoUrl}`);

    if (!videoUrl) {
        console.error("Erro: Nenhuma URL foi fornecida.");
        return res.status(400).json({ error: 'URL do vídeo é obrigatória.' });
    }

    const command = `yt-dlp --dump-json "${videoUrl}"`;
    console.log(`Executando comando: ${command}`);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Erro ao executar yt-dlp: ${error.message}`);
            console.error(`Stderr: ${stderr}`);
            return res.status(500).json({ error: 'Falha ao buscar informações do vídeo.', details: stderr || error.message });
        }

        try {
            const lines = stdout.trim().split('\n');
            const lastLine = lines[lines.length - 1];
            const videoInfo = JSON.parse(lastLine);
            
            console.log(`Informações obtidas para: ${videoInfo.title}`);

            const formats = videoInfo.formats
                .filter(f => f.vcodec !== 'none' && f.acodec !== 'none' && f.ext === 'mp4')
                .map(f => ({
                    quality: f.format_note || `${f.height}p`,
                    url: f.url,
                    ext: f.ext,
                }))
                .reverse(); 

            const uniqueFormats = Array.from(new Map(formats.map(item => [item['quality'], item])).values());

            res.json({
                title: videoInfo.title,
                thumbnail: videoInfo.thumbnail,
                formats: uniqueFormats,
            });
        } catch (parseError) {
            console.error(`Erro ao processar JSON: ${parseError.message}`);
            console.error(`Saída recebida (stdout): ${stdout}`);
            res.status(500).json({ error: 'Falha ao processar as informações do vídeo.', details: stdout });
        }
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor iniciado com sucesso na porta ${PORT}.`);
});
```

**Passo 2: Envie para o GitHub (da forma mais fácil)**

Abra o seu terminal na pasta do projeto e execute estes três comandos, um de cada vez. O segundo comando evita o editor de texto.

```bash
git add .
git commit -m "Implementando a correção final do CORS"
git push origin master

