/*
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Conexão com o MongoDB Atlas
mongoose.connect('mongodb+srv://larasagaiif:iiw2022@projeto.9fh2p.mongodb.net/?retryWrites=true&w=majority&appName=projeto', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Conectado ao MongoDB'))
.catch(err => console.error('Erro de conexão:', err));

// Definição de Schemas e Modelos
const conversationSchema = new mongoose.Schema({
    userId: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
});

const loginSchema = new mongoose.Schema({
    userId: String,
    ipAddress: String, // Campo adicionado para armazenar o IP
    loginTime: { type: Date, default: Date.now }
});

const Conversation = mongoose.model('Conversation', conversationSchema);
const Login = mongoose.model('Login', loginSchema);

// Endpoints
app.post('/api/conversations', async (req, res) => {
    try {
        const conversation = new Conversation(req.body);
        await conversation.save();
        res.status(201).send(conversation);
    } catch (error) {
        res.status(400).send(error);
    }
});

app.post('/api/logins', async (req, res) => {
    try {
        const login = new Login({
            userId: req.body.userId,
            ipAddress: req.ip // Captura o IP do usuário
        });
        await login.save();
        res.status(201).send(login);
    } catch (error) {
        res.status(400).send(error);
    }
});

app.get('/api/conversations', async (req, res) => {
    try {
        const conversations = await Conversation.find();
        res.send(conversations);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.get('/api/logins', async (req, res) => {
    try {
        const logins = await Login.find();
        res.send(logins);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
*/
// Importa as dependências necessárias
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Para hash de senha
const jwt = require('jsonwebtoken'); // Para geração de token
const cors = require('cors'); // Importa o middleware CORS
const app = express();

// Middleware para lidar com dados JSON
app.use(express.json());

// Habilita o CORS para domínios específicos (melhoria de segurança)
app.use(cors({
  origin: ['https://meudominio.com', 'https://outrodominio.com'], // Defina os domínios permitidos
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization'
}));

// Define a porta do servidor
const PORT = 5000;

const mongoose = require('mongoose');

const mongoURI = 'mongodb+srv://larasagaiif:iiw2022@projeto.9fh2p.mongodb.net/projeto?retryWrites=true&w=majority';

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true // Se você estiver criando índices
})

.then(() => console.log('Conectado ao MongoDB Atlas'))
.catch(err => console.error('Erro ao conectar ao MongoDB Atlas:', err));


// Criação do modelo de usuário
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// Middleware para verificar se os dados necessários estão presentes
function validateUserData(req, res, next) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username e senha são obrigatórios!" });
  }
  next();
}

// Chave secreta para JWT (agora vem de uma variável de ambiente)
const jwtSecret = process.env.JWT_SECRET || 'chave-secreta-super-segura';

// Rota para registrar novo usuário
app.post('/register', validateUserData, async (req, res) => {
  const { username, password } = req.body;

  // Verifica se o usuário já existe
  const userExists = await User.findOne({ username });
  if (userExists) {
    return res.status(400).send({ message: 'Usuário já existe!' });
  }

  // Criptografa a senha
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Cria o novo usuário
  const newUser = new User({
    username,
    password: hashedPassword
  });

  try {
    await newUser.save();
    res.status(201).send({ message: 'Usuário registrado com sucesso!' });
  } catch (err) {
    console.error('Erro ao registrar usuário:', err);
    res.status(500).send({ message: 'Erro interno ao registrar usuário.' });
  }
});

// Rota de login
app.post('/login', validateUserData, async (req, res) => {
  const { username, password } = req.body;

  console.log("Dados recebidos: ", req.body); // Verifique se os dados estão sendo recebidos

  try {
    // Verifica se o usuário existe
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ success: false, message: "Usuário não encontrado!" });
    }

    // Verifica se a senha está correta
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Senha incorreta!" });
    }

    // Gera um token JWT (opcional, mas útil para autenticação futura)
    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '1h' });

    res.status(200).json({
      success: true,
      message: "Login bem-sucedido!",
      token
    });

  } catch (err) {
    console.error("Erro ao processar o login:", err);
    res.status(500).json({ success: false, message: "Erro ao processar o login.", error: err });
  }
});

// Rota de exemplo protegida
app.get('/dashboard', (req, res) => {
  const token = req.header('Authorization');

  if (!token || !token.startsWith('Bearer ')) {
    return res.status(401).send({ message: 'Acesso negado. Token inválido ou não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token.split(' ')[1], jwtSecret);
    req.user = decoded;
    res.status(200).send({ message: 'Bem-vindo ao dashboard!' });
  } catch (err) {
    res.status(400).send({ message: 'Token inválido!' });
  }
});

// Inicia o servidor na porta 5000
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
