const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config(); // Carregar variáveis de ambiente, como a chave da API

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware para CORS, JSON e autenticação com chave API
app.use(cors());
app.use(express.json());

// Conectar ao MongoDB (substitua pela URL do seu MongoDB Atlas ou local)
mongoose.connect('mongodb+srv://larasagaiif:iiw2022@projeto.9fh2p.mongodb.net/?retryWrites=true&w=majority&appName=projeto', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Conectado ao MongoDB');
}).catch(err => {
  console.error('Erro ao conectar ao MongoDB:', err);
});

// Esquema de conversa
const conversationSchema = new mongoose.Schema({
  userId: String,
  message: String,
  role: { type: String, enum: ['user', 'bot'], required: true }, // Definindo o papel (user ou bot)
  timestamp: { type: Date, default: Date.now }
});

const Conversation = mongoose.model('Conversation', conversationSchema);

// Middleware para autenticação com chave API
function verificarChaveAPI(req, res, next) {
  const apiKey = req.headers['authorization'];
  if (apiKey && apiKey === `Bearer ${process.env.API_KEY}`) {
    next();
  } else {
    res.status(403).send({ message: 'Chave API inválida ou ausente.' });
  }
}

// Endpoint para salvar a conversa
app.post('/api/conversations', verificarChaveAPI, async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    // Salva a mensagem do usuário no banco de dados
    const conversation = new Conversation({ userId, message, role: 'user' });
    await conversation.save();

    // Resposta do bot (resposta com tema Pokémon)
    const botResponse = `Pikachu! Pika Pika! Eu sou o Pikachu, seu parceiro Pokémon, você disse: "${message}"`;

    // Salva a resposta do bot no banco de dados
    await new Conversation({ userId, message: botResponse, role: 'bot' }).save();

    res.status(201).send({ message: botResponse }); // Retorna a resposta do bot para o frontend
  } catch (error) {
    res.status(400).send({ message: "Erro ao salvar a mensagem.", error });
  }
});

// Endpoint para recuperar o histórico de conversas
app.get('/api/conversations', verificarChaveAPI, async (req, res) => {
  try {
    const { userId } = req.query;  // Recebe o userId como query string
    const conversations = await Conversation.find({ userId }).sort({ timestamp: 1 }); // Ordena as conversas por data
    res.status(200).send(conversations);
  } catch (error) {
    res.status(500).send({ message: "Erro ao obter o histórico.", error });
  }
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
