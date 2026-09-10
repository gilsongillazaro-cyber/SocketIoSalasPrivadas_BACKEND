# 🔌 Socket.IO Private Chat — Backend

Backend de uma aplicação de **chat privado em tempo real**, desenvolvido com Node.js, Express e Socket.IO.

O servidor é responsável por gerenciar as conexões dos usuários, comunicação em tempo real, mensagens privadas, presença online/offline, status das mensagens e indicador de digitação.

---

## 🌐 Projeto

> 🚀 **Frontend:** COLOQUE_AQUI_O_LINK_DO_FRONTEND
>
> 🌍 **Backend/API:** COLOQUE_AQUI_O_LINK_DO_BACKEND

---

# 🚀 Sobre o projeto

Este backend foi desenvolvido para fornecer a infraestrutura de comunicação em tempo real para uma aplicação de chat privado.

A comunicação entre os clientes acontece através do **Socket.IO**, permitindo que mensagens e eventos sejam enviados e recebidos instantaneamente.

O servidor também controla informações importantes da comunicação, como:

- ID da conexão
- Nome do usuário
- Usuários conectados
- Mensagens privadas
- Entrega de mensagens
- Leitura de mensagens
- Usuários online/offline
- Indicador de digitação
- Tratamento de conexão e desconexão

---

# 🛠️ Tecnologias utilizadas

- 🟢 Node.js
- 🚂 Express
- 🔌 Socket.IO
- 🌐 HTTP Server
- 📦 npm
- 🛡️ CORS
- 🟨 JavaScript

---

# 🧠 Arquitetura

O backend utiliza o servidor HTTP do Node.js juntamente com o Socket.IO.

```text
                  ┌──────────────────┐
                  │     Frontend     │
                  │      React       │
                  └────────┬─────────┘
                           │
                      Socket.IO
                           │
                           ▼
                  ┌──────────────────┐
                  │     Backend      │
                  │   Node.js        │
                  │   Express        │
                  │   Socket.IO      │
                  └────────┬─────────┘
                           │
                      Socket.IO
                           │
                           ▼
                  ┌──────────────────┐
                  │     Frontend     │
                  │      React       │
                  └──────────────────┘
```

---

# 📁 Estrutura do projeto

Estrutura principal do backend:

```text
backend/
│
├── index.js
├── package.json
├── package-lock.json
└── node_modules/
```

O arquivo principal do servidor é:

```text
index.js
```

---

# ⚙️ Inicialização do servidor

O servidor HTTP é criado utilizando Node.js:

```javascript
import http from "http";
import express from "express";
import { Server } from "socket.io";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});
```

O servidor fica disponível na porta:

```text
3000
```

---

# 🔌 Conexão Socket.IO

Quando um usuário entra na aplicação, o servidor recebe uma nova conexão:

```javascript
io.on("connection", (socket) => {
  console.log("Usuário conectado:", socket.id);
});
```

Cada conexão recebe um `socket.id` único.

Exemplo:

```text
jcS4mYD19a9FTq4RAAA3
```

Esse ID identifica a conexão atual do usuário.

> ⚠️ O `socket.id` não é uma identidade permanente. Ele pode mudar quando o usuário desconecta e conecta novamente.

---

# 👤 Identificação do usuário

O frontend envia o nome do usuário para o servidor:

```javascript
socket.emit("nome-conectado", nome);
```

O backend associa o nome ao socket:

```javascript
socket.on("nome-conectado", (nome) => {
  socket.nome = nome;
});
```

Dessa forma, o servidor consegue identificar:

```text
socket.id
socket.nome
```

---

# 👥 Usuários conectados

O servidor utiliza os sockets conectados para obter informações dos usuários.

Exemplo:

```javascript
const sockets = await io.fetchSockets();

const usuarios = sockets.map((socket) => ({
  id: socket.id,
  nome: socket.nome,
}));
```

Esses dados podem ser enviados ao frontend para construir a lista de usuários.

---

# 🟢 Sistema Online / Offline

O backend informa quando um usuário entra:

```text
online
```

E quando desconecta:

```text
offline
```

Quando um socket é encerrado:

```javascript
socket.on("disconnect", () => {
  console.log("Usuário desconectado:", socket.id);
});
```

Isso permite que o frontend atualize o indicador:

```text
🟢 online
🔴 offline
```

---

# 💬 Mensagens privadas

As mensagens privadas são enviadas utilizando o ID do socket destinatário.

O frontend envia:

```javascript
socket.emit("mensagem-enviada", mensagem);
```

O backend cria os dados confiáveis da mensagem:

```javascript
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
```

O remetente é identificado pelo próprio servidor:

```javascript
remetenteId: socket.id;
remetenteNome: socket.nome;
```

Isso evita depender desses dados enviados pelo frontend.

---

# 📩 Entrega da mensagem

Depois de criar a mensagem, o servidor envia somente para o destinatário:

```javascript
io.to(mensagem.destinatarioId).emit("mensagem-recebida", mensagemAtualizada);
```

Diferente de:

```javascript
io.emit(...)
```

que enviaria para todos os usuários conectados.

---

# ✅ Status das mensagens

O backend trabalha com diferentes estados:

```text
🕐 enviando
      ↓
✓ enviada
      ↓
✓✓ entregue
      ↓
✓✓ lida
```

O remetente recebe a atualização através de:

```text
mensagem-status-atualizada
```

---

# 📬 Mensagem entregue

Quando o destinatário recebe a mensagem, o frontend informa o servidor:

```javascript
socket.emit("mensagem-entregue", {
  remetenteId: mensagem.remetenteId,
  mensagemId: mensagem.id,
});
```

O backend atualiza o status:

```javascript
socket.on("mensagem-entregue", (dados) => {
  io.to(dados.remetenteId).emit("mensagem-status-atualizada", {
    id: dados.mensagemId,
    status: "entregue",
  });
});
```

---

# 👁️ Mensagem lida

Quando o destinatário abre a conversa, o frontend informa:

```javascript
socket.emit("mensagem-lida", {
  remetenteId: mensagem.remetenteId,
  mensagemId: mensagem.id,
});
```

O servidor envia ao remetente:

```javascript
socket.on("mensagem-lida", (dados) => {
  io.to(dados.remetenteId).emit("mensagem-status-atualizada", {
    id: dados.mensagemId,
    status: "lida",
  });
});
```

---

# ✍️ Usuário digitando

O backend também possui suporte para detectar quando um usuário está digitando.

O frontend envia:

```text
digitando
```

O servidor recebe:

```javascript
socket.on("digitando", (destinatarioId) => {
  io.to(destinatarioId).emit("usuario-digitando", {
    remetenteId: socket.id,
    remetenteNome: socket.nome,
  });
});
```

O destinatário recebe:

```text
usuario-digitando
```

e pode mostrar:

```text
✍️ Gilson está digitando...
```

---

# ⏹️ Parou de digitar

Quando o usuário deixa de escrever:

```text
parou-digitando
```

O servidor encaminha:

```javascript
socket.on("parou-digitando", (destinatarioId) => {
  io.to(destinatarioId).emit("usuario-parou-digitando", {
    remetenteId: socket.id,
  });
});
```

O frontend remove o indicador de digitação.

---

# 🔄 Principais eventos

## Conexão

```text
connection
disconnect
```

## Usuários

```text
nome-conectado
usuarios-online
online
offline
```

## Mensagens

```text
mensagem-enviada
mensagem-recebida
```

## Status

```text
mensagem-entregue
mensagem-lida
mensagem-status-atualizada
```

## Digitação

```text
digitando
parou-digitando
usuario-digitando
usuario-parou-digitando
```

---

# 📦 Instalação

Clone o repositório:

```bash
git clone https://github.com/gilsongillazaro-cyber/SocketIoSalasPrivadas_BACKEND.git
```

Entre na pasta:

```bash
cd backend
```

Instale as dependências:

```bash
npm install
```

Execute o servidor:

```bash
npm run dev
```

---

# 🔐 CORS

Durante o desenvolvimento, o backend permite conexões do frontend:

```javascript
cors: {
  origin: "http://localhost:5173";
}
```

Em produção, o endereço deve ser alterado para o domínio real do frontend.

---

# 🔮 Próximos passos

O backend pode evoluir futuramente para incluir:

- 💾 Persistência das mensagens
- 👤 Usuários permanentes
- 🔐 Autenticação
- 🗄️ MongoDB
- 📷 Upload de imagens
- 📎 Upload de arquivos
- 🎙️ Mensagens de áudio
- 👥 Conversas em grupo
- 🗑️ Exclusão de mensagens
- ✏️ Edição de mensagens
- 🔔 Notificações
- 📞 Chamadas de áudio
- 📹 WebRTC para chamadas de vídeo
- 🚀 Deploy em produção

---

# 🎯 Objetivo do projeto

Este backend foi desenvolvido para aprofundar conhecimentos em:

- Node.js
- Express
- Socket.IO
- WebSockets
- Eventos em tempo real
- Comunicação cliente-servidor
- Comunicação privada
- Gerenciamento de conexões
- Presença online/offline
- Estados de mensagens
- Sistemas de chat em tempo real

---

# 👨‍💻 Desenvolvedor

**Gilson Gil**

Desenvolvedor Full Stack focado no ecossistema JavaScript e no desenvolvimento de aplicações web modernas e em tempo real.

### 🔗 Links

- 💻 GitHub: https://github.com/gilsongillazaro-cyber
- 💼 LinkedIn: https://www.linkedin.com/in/gilson-gil-077b7841b/

---

## ⭐ Contribuição

Se este projeto foi útil ou interessante para você, considere deixar uma ⭐ no repositório.

---

## 📄 Licença

Este projeto está disponível para fins de estudo, aprendizado e desenvolvimento.
