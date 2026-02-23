const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'checklist_app.html'));
});

// Pool de conexiones para mejor manejo
let pool;

async function initDB() {
    try {
        pool = mysql.createPool({
            host: process.env.MYSQLHOST || 'localhost',
            user: process.env.MYSQLUSER || 'root',
            password: process.env.MYSQLPASSWORD || '',
            database: process.env.MYSQLDATABASE || 'railway',
            port: process.env.MYSQLPORT || 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        
        const connection = await pool.getConnection();
        console.log('✓ Conectado a la base de datos');
        
        // Crear tablas
        await connection.query('CREATE TABLE IF NOT EXISTS sections (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, completed BOOLEAN DEFAULT FALSE)');
        await connection.query('CREATE TABLE IF NOT EXISTS groups (id INT AUTO_INCREMENT PRIMARY KEY, section_id INT NOT NULL, title VARCHAR(255) NOT NULL, completed BOOLEAN DEFAULT FALSE, FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE)');
        await connection.query('CREATE TABLE IF NOT EXISTS items (id INT AUTO_INCREMENT PRIMARY KEY, group_id INT NOT NULL, name VARCHAR(255) NOT NULL, completed BOOLEAN DEFAULT FALSE, FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE)');
        
        console.log('✓ Tablas creadas');
        connection.release();
    } catch (err) {
        console.error('✗ Error en BD:', err.message);
    }
}

initDB();

// API: Obtener todo
app.get('/api/checklist', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [sections] = await connection.query('SELECT * FROM sections');
        const [groups] = await connection.query('SELECT * FROM groups');
        const [items] = await connection.query('SELECT * FROM items');
        connection.release();
        
        res.json({ sections, groups, items });
    } catch (err) {
        console.error('Error GET:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// API: Crear sección
app.post('/api/sections', async (req, res) => {
    try {
        const { title } = req.body;
        const connection = await pool.getConnection();
        const [result] = await connection.query('INSERT INTO sections (title) VALUES (?)', [title]);
        connection.release();
        res.json({ id: result.insertId });
    } catch (err) {
        console.error('Error POST section:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// API: Crear grupo
app.post('/api/groups', async (req, res) => {
    try {
        const { section_id, title } = req.body;
        const connection = await pool.getConnection();
        const [result] = await connection.query('INSERT INTO groups (section_id, title) VALUES (?, ?)', [section_id, title]);
        connection.release();
        res.json({ id: result.insertId });
    } catch (err) {
        console.error('Error POST group:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// API: Crear item
app.post('/api/items', async (req, res) => {
    try {
        const { group_id, name } = req.body;
        const connection = await pool.getConnection();
        const [result] = await connection.query('INSERT INTO items (group_id, name) VALUES (?, ?)', [group_id, name]);
        connection.release();
        res.json({ id: result.insertId });
    } catch (err) {
        console.error('Error POST item:', err.message);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));