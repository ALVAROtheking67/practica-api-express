// index.js
require('dotenv').config();
const express = require('express');
const db = require('./config/db'); //[cite: 8]

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('El servidor está en línea y conectado a PostgreSQL.');
});

// 1. GET: SELECT FROM...
app.get('/api/libros', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM libros');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" }); //[cite: 9]
    }
});

// 2. GET por ID
app.get('/api/libros/:id', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM libros WHERE id = $1', [req.params.id]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ error: "Libro no encontrado" });
        }
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" }); //[cite: 9]
    }
});

// 3. POST: INSERT INTO...[cite: 9]
app.post('/api/libros', async (req, res) => {
    try {
        const { nombre, autor } = req.body;
        const query = 'INSERT INTO libros (nombre, autor) VALUES ($1, $2) RETURNING *';
        const { rows } = await db.query(query, [nombre, autor]);
        
        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" }); //[cite: 9]
    }
});

// 4. PUT: UPDATE...[cite: 9]
app.put('/api/libros/:id', async (req, res) => {
    try {
        const { nombre, autor } = req.body;
        const query = 'UPDATE libros SET nombre = $1, autor = $2 WHERE id = $3 RETURNING *';
        const { rows } = await db.query(query, [nombre, autor, req.params.id]);
        
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ error: "Libro no encontrado para actualizar" });
        }
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" }); //[cite: 9]
    }
});

// 5. DELETE: DELETE FROM...[cite: 9]
app.delete('/api/libros/:id', async (req, res) => {
    try {
        const { rowCount } = await db.query('DELETE FROM libros WHERE id = $1', [req.params.id]);
        
        if (rowCount > 0) {
            res.json({ mensaje: `Libro con ID ${req.params.id} eliminado correctamente.` });
        } else {
            res.status(404).json({ error: "Libro no encontrado para eliminar" });
        }
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" }); //[cite: 9]
    }
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
