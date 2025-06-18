const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const cors = require('cors');
const todoRoutes = require('./routes/todos');
const Todo = require('./models/Todo');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    },
});

// Middleware
app.use(cors());
app.use(express.json());

// Set io so routes can access it
app.set('io', io);

// API routes
app.use('/api/todos', todoRoutes);

// Root route
app.get('/', (req, res) => {
    res.send('Welcome to the Todo API 🚀');
});

// Socket.IO connection
io.on('connection', (socket) => {
    // console.log('A Client Connected', socket.id);

    socket.on('disconnect', () => {
        // console.log('A Client Disconnected', socket.id);
    });
});

// MongoDB connection and change stream listener
mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('MongoDb Connected 🚀');
    const changeStream = Todo.watch();
    changeStream.on('change', async (change) => {
        if (change.operationType === 'insert') {
            const newTodo = change.fullDocument;
            io.emit('todoAdd', newTodo);
        } else if (change.operationType === 'update') {
            const updatedTodo = await Todo.findById(change.documentKey._id);
            io.emit('todoUpdate', updatedTodo);
        } else if (change.operationType === 'delete') {
            io.emit('todoDelete', change.documentKey._id);
        }
    });
}).catch((err) => {
    console.log('❌ MongoDB Connection Error:', err);
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));
