import express from 'express'
import http from 'http'
import { Server } from 'socket.io'

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Armazena o último tempo de envio de cada usuário (pelo socket ID)
const userLastMessageTime = new Map();

// Armazena a cor atribuída a cada usuário
const userColors = new Map();

// Tempo de espera em milissegundos (10 segundos)
const MESSAGE_COOLDOWN = 10000;

// Função para gerar uma cor hexadecimal aleatória
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
  console.log('Usuário conectado:', socket.id);

  // Atribui uma cor aleatória ao usuário quando ele se conecta
  const userColor = getRandomColor();
  userColors.set(socket.id, userColor);

  // Ao receber uma mensagem de chat do cliente
  socket.on('chat message', (msg) => {
    const now = Date.now();
    const lastMessageTime = userLastMessageTime.get(socket.id);

    if (lastMessageTime && (now - lastMessageTime < MESSAGE_COOLDOWN)) {
      // Tempo de espera não foi atingido, envie uma mensagem de aviso
      socket.emit('chat error', 'Aguarde 10 segundos antes de enviar outra mensagem.');
    } else {
      // Atualize o tempo de envio da última mensagem e emita a mensagem para todos os clientes
      userLastMessageTime.set(socket.id, now);
      io.emit('chat message', {
        id: socket.id,
        msg: msg,
        color: userColors.get(socket.id)
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Usuário desconectado:', socket.id);
    // Remove o registro do tempo de mensagem e a cor do usuário ao desconectar
    userLastMessageTime.delete(socket.id);
    userColors.delete(socket.id);
  });
});

server.listen(3002, () => {
  console.log('Servidor rodando em http://localhost:3002');
});
