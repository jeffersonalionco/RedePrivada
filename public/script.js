const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Armazena o último tempo de envio de cada usuário (pelo socket ID)
const userLastMessageTime = new Map();

// Tempo de espera em milissegundos (10 segundos)
const MESSAGE_COOLDOWN = 10000;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
  console.log('Usuário conectado:', socket.id);

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
      io.emit('chat message', msg);
    }
  });

  socket.on('disconnect', () => {
    console.log('Usuário desconectado:', socket.id);
    // Remove o registro do tempo de mensagem do usuário ao desconectar
    userLastMessageTime.delete(socket.id);
  });
});

server.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
