console.log("Iniciando o arquivo de teste mínimo...");

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

// Rota de Teste
app.get('/', (req, res) => {
    console.log("Servidor de teste foi acedido.");
    res.send('Servidor de teste está no ar!');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor de teste iniciado com sucesso na porta ${PORT}.`);
});

