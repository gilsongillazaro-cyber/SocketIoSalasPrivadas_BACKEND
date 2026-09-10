import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

const app = express();
const porta = 3000;
app.use(express.json());
app.use(
  cors({
    origin: "https://socketiosalasprivadas-frontend.vercel.app",
  }),
);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://socketiosalasprivadas-frontend.vercel.app/",
  },
});

io.on("connection", (socket) => {
  console.log(`Nova conexao estabelecida: ${socket.id}`);

  socket.on("nome-conectado", async (nome) => {
    socket.nome = nome;
    const Conexoes = await io.fetchSockets();
    const users = Conexoes.map((conexao) => ({
      id: conexao.id,
      nome: conexao.nome,
    }));
    console.log("todos usuarios ", users);
    io.emit("usuarios-conectados", users);

    // avisa os outros que este usuário entrou
    socket.broadcast.emit("online", {
      online: true,
      id: socket.id,
    });

    // pega todos que já estavam conectados
    const conexoes = await io.fetchSockets();

    const usuariosOnline = conexoes
      .filter((conexao) => conexao.id !== socket.id)
      .map((conexao) => ({
        id: conexao.id,
        online: true,
      }));

    // manda para o usuário que acabou de entrar
    socket.emit("usuarios-online", usuariosOnline);
  });

  socket.on("mensagem-enviada", (mensagem, callback) => {
    const mensagemAtualizada = {
      id: mensagem.id,
      texto: mensagem.texto,
      destinatarioId: mensagem.destinatarioId,
      destinatarioNome: mensagem.destinatarioNome,
      remetenteId: socket.id,
      remetenteNome: socket.nome,
      temporaria: false,
      data: new Date(),
      status: "enviada",
    };
    io.to(mensagem.destinatarioId).emit(
      "mensagem-recebida",
      mensagemAtualizada,
    );
    callback({ enviada: true, mensagem: mensagemAtualizada });
  });

  socket.on("mensagem-entregue", (dados) => {
    console.log(`mensagem entregue para o destinatario: ${dados.remetenteId}`);
    io.to(dados.remetenteId).emit("mensagem-status-atualizada", {
      id: dados.mensagemId,
      status: "entregue",
    });
  });

  socket.on("mensagem-lida", (dados) => {
    console.log(`mensagem lida pelo destinatario: ${dados.remetenteId}`);
    io.to(dados.remetenteId).emit("mensagem-status-atualizada", {
      id: dados.mensagemId,
      status: "lida",
    });
  });

  socket.on("digitando", (destinatarioId) => {
    console.log(
      `O usuario ${socket.id} denominado ${socket.nome} esta digitando para o usuario ${destinatarioId}`,
    );
    io.to(destinatarioId).emit("usuario-digitando", {
      remetenteId: socket.id,
      remetenteNome: socket.nome,
    });
  });

  socket.on("parou-digitando", (destinatarioId) => {
    console.log(
      `O usuario ${socket.id} denominado ${socket.nome} parou de digitar paro o usuario ${destinatarioId}`,
    );
    io.to(destinatarioId).emit("usuario-parou-digitando", {
      remetenteId: socket.id,
    });
  });

  socket.on("disconnect", (reason) => {
    console.log(`Conexao encerrada do: ${socket.id} - Motivo: ${reason}`);
    io.emit("offline", {
      online: false,
      id: socket.id,
    });
  });
});

server.listen(porta, () => {
  console.log(`servidor rodando com sucesso na porta ${porta} `);
});
