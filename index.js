// index.js
const express = require('express');
const app = express();
const PORT = 3000;

// Configuración para parsear JSON en el cuerpo de las peticiones
app.use(express.json()); //

// Arreglo en memoria simulando nuestra base de datos (Catálogo de Libros)[cite: 1]
let libros = [
    { id: 1, nombre: "Crimen y castigo", autor: "Fiódor Dostoyevsky" },
    { id: 2, nombre: "Ensayo sobre la ceguera", autor: "José Saramago" }
];

// Ruta base para confirmar que el servidor está en línea[cite: 1]
app.get('/', (req, res) => {
    res.send('El servidor está en línea y funcionando correctamente.');
});

// ==========================================
// ENDPOINTS DE LA API REST
// ==========================================

// 1. GET /api/libros: Devuelve el arreglo completo[cite: 1]
app.get('/api/libros', (req, res) => {
    res.json(libros);
});

// 2. GET /api/libros/:id: Busca un libro por ID[cite: 1]
app.get('/api/libros/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const libro = libros.find(l => l.id === id);

    if (libro) {
        res.json(libro);
    } else {
        // Retorna 404 si no existe[cite: 1]
        res.status(404).json({ error: "Libro no encontrado" });
    }
});

// 3. POST /api/libros: Agrega un nuevo libro[cite: 1]
app.post('/api/libros', (req, res) => {
    const nuevoLibro = req.body;
    
    // Asignación de un nuevo ID dinámico[cite: 1]
    const nuevoId = libros.length > 0 ? Math.max(...libros.map(l => l.id)) + 1 : 1;
    nuevoLibro.id = nuevoId;
    
    libros.push(nuevoLibro);
    
    // Devuelve el objeto creado con código 201[cite: 1]
    res.status(201).json(nuevoLibro);
});

// 4. PUT /api/libros/:id: Actualiza un libro existente[cite: 1]
app.put('/api/libros/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = libros.findIndex(l => l.id === id);

    if (index !== -1) {
        // Actualiza manteniendo el mismo ID[cite: 1]
        libros[index] = { ...libros[index], ...req.body, id: id };
        res.json(libros[index]);
    } else {
        res.status(404).json({ error: "Libro no encontrado para actualizar" });
    }
});

// 5. DELETE /api/libros/:id: Elimina un libro por ID
app.delete('/api/libros/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = libros.findIndex(l => l.id === id);

    if (index !== -1) {
        libros.splice(index, 1);
        res.json({ mensaje: `Libro con ID ${id} eliminado correctamente.` }); //
    } else {
        res.status(404).json({ error: "Libro no encontrado para eliminar" });
    }
});

// Levantar el servidor[cite: 1]
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});