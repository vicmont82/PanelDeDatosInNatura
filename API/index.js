const express = require('express');
const http = require('http');
const romaneosRoutes = require('./routes/romaneosRoutes');
const cors = require('cors');
const { Server } = require('socket.io');
const corsOption = require('./config');
 
const app = express();
const server = http.createServer(app);
const port = 4010;

const corsOptions = {
    origin: corsOption, 
    optionsSuccessStatus: 200
};

const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

app.use(cors(corsOptions));

app.use('/', romaneosRoutes);

app.listen(port, () => {
    console.log(`API escuchando en puerto: ${port} cors corriendo en ${corsOption}`);
});


