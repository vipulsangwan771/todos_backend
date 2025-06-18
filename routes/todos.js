const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');

// Get a single todo by ID
router.get('/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) {
      return res.status(404).json({ Message: 'Todo not found' });
    }
    res.json(todo);
  } catch (err) {
    res.status(500).json({ Message: err.message });
  }
});

// Get all todos
router.get('/', async (req, res) => {
  try {
    const todos = await Todo.find();
    res.json(todos);
  } catch (err) {
    res.status(500).json({ Message: err.message });
  }
});

// Create a todo
router.post('/', async (req, res) => {
  const todo = new Todo({
    title: req.body.title,
    description: req.body.description,
    completed: req.body.completed,
  });

  try {
    const newTodo = await todo.save();
    const io = req.app.get('io');
    io.emit('todoAdd', newTodo);
    res.status(200).json(newTodo);
  } catch (err) {
    res.status(400).json({ Message: err.message });
  }
});

// Toggle todo completion status
router.patch('/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) {
      return res.status(404).json({ Message: 'Todo Not Found' });
    }
    todo.completed = !todo.completed;
    const updatedTodo = await todo.save();
    const io = req.app.get('io');
    io.emit('todoUpdate', updatedTodo);
    res.json(updatedTodo);
  } catch (err) {
    res.status(400).json({ Message: err.message });
  }
});

// Update a todo
router.put('/:id', async (req, res) => {
  try {
    const updatedTodo = await Todo.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        description: req.body.description,
        completed: req.body.completed,
      },
      { new: true }
    );
    if (!updatedTodo) {
      return res.status(404).json({ Message: 'Todo not found' });
    }
    const io = req.app.get('io');
    io.emit('todoUpdate', updatedTodo);
    res.json(updatedTodo);
  } catch (err) {
    res.status(400).json({ Message: err.message });
  }
});

// Delete a todo
router.delete('/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) {
      return res.status(404).json({ Message: 'Todo Not Found' });
    }
    await todo.deleteOne();
    const io = req.app.get('io');
    io.emit('todoDelete', todo._id); // Emit the ID as a string
    res.json({ message: 'Todo Deleted' });
  } catch (err) {
    res.status(400).json({ Message: err.message });
  }
});

module.exports = router;