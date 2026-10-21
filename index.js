// index.js


require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db'); //

const fs = require('fs'); // Módulo nativo File System
const multer = require('multer'); // Para subida de archivos multipart/form-data
const csv = require('csv-parser'); // Para leer CSV
const { Parser } = require('json2csv'); // Para exportar CSV

// Configuración del middleware Multer indicando la carpeta destino
const upload = multer({ dest: 'uploads/' });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('El servidor está en línea y conectado a PostgreSQL.');
});


// POST: Importación de datos[cite: 15]
app.post('/api/libros/importar', upload.single('archivo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No se subió ningún archivo" });

        const rutaArchivo = req.file.path;
        const nombreOriginal = req.file.originalname.toLowerCase();
        let registrosInsertados = 0;

        // Lógica para archivos JSON[cite: 15]
        if (nombreOriginal.endsWith('.json')) {
            const data = fs.readFileSync(rutaArchivo, 'utf-8');
            const libros = JSON.parse(data);

            for (let libro of libros) {
                await db.query('INSERT INTO libros (nombre, autor) VALUES ($1, $2)', [libro.nombre, libro.autor]);
                registrosInsertados++;
            }
        } 
        // Lógica para archivos CSV[cite: 15]
        else if (nombreOriginal.endsWith('.csv')) {
            const resultados = [];
            
            // Promesa para manejar el stream asíncrono de csv-parser[cite: 15]
            await new Promise((resolve, reject) => {
                fs.createReadStream(rutaArchivo)
                    .pipe(csv())
                    .on('data', (data) => resultados.push(data))
                    .on('end', async () => {
                        for (let libro of resultados) {
                            await db.query('INSERT INTO libros (nombre, autor) VALUES ($1, $2)', [libro.nombre, libro.autor]);
                            registrosInsertados++;
                        }
                        resolve();
                    })
                    .on('error', reject);
            });
        } else {
            fs.unlinkSync(rutaArchivo); // Borrar si no es válido
            return res.status(400).json({ error: "Formato no soportado. Usa .json o .csv" });
        }

        // Eliminar el archivo temporal de la carpeta uploads
        fs.unlinkSync(rutaArchivo); 
        
        // Devolver código 200 OK con el total de registros
        res.status(200).json({ mensaje: `Importación exitosa. ${registrosInsertados} registros insertados.` });

    } catch (error) {
        console.error("Error en importación:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



// GET: Exportación de datos dinámicamente
app.get('/api/libros/exportar/:formato', async (req, res) => {
    try {
        const formato = req.params.formato.toLowerCase();
        const { rows } = await db.query('SELECT * FROM libros'); // Obtener todos los registros

        if (rows.length === 0) return res.status(404).json({ error: "No hay datos para exportar" });

        // Lógica condicional para exportar JSON
        if (formato === 'json') {
            res.setHeader('Content-Disposition', 'attachment; filename=datos_exportados.json');
            res.json(rows);
        } 
        // Lógica condicional para exportar CSV
        else if (formato === 'csv') {
            const json2csvParser = new Parser();
            const csvData = json2csvParser.parse(rows);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=datos_exportados.csv');
            res.send(csvData);
        } else {
            res.status(400).json({ error: "Formato inválido. Usa /json o /csv" });
        }
    } catch (error) {
        console.error("Error en exportación:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
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
