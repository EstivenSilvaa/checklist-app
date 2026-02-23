const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde el directorio actual
app.use(express.static(path.join(__dirname)));

// Ruta para servir el HTML principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'checklist_app.html'));
});

// Configuración de la conexión a la base de datos en la nube
const db = mysql.createConnection({
    host: process.env.MYSQLHOST || 'crossover.proxy.rlwy.net',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || 'oubJHjRNTwVtyCYdNBzyobuVvIVAzbNi',
    database: process.env.MYSQLDATABASE || 'railway',
    port: process.env.MYSQLPORT || 47650,
    multipleStatements: true
});

db.connect((err) => {
    if (err) {
        console.error('Error conectando a MySQL:', err);
        return;
    }
    console.log('Conectado a la base de datos MySQL');

    // Crear tablas si no existen
    const schema = `
        CREATE TABLE IF NOT EXISTS sections (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            completed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS groups (
            id INT AUTO_INCREMENT PRIMARY KEY,
            section_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            completed BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            group_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            completed BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
        );
    `;
    db.query(schema, (err) => {
        if (err) {
            console.error('Error creando tablas:', err);
        } else {
            console.log('Tablas verificadas/creadas');
        }
    });
});

// --- ENDPOINTS ---

// Obtener toda la estructura (Sincronización total)
app.get('/api/checklist', (req, res) => {
    const query = `
        SELECT 
            s.id AS sId, s.title AS sTitle, s.completed AS sCompleted,
            g.id AS gId, g.title AS gTitle, g.completed AS gCompleted,
            i.id AS iId, i.name AS iName, i.completed AS iCompleted
        FROM sections s
        LEFT JOIN groups g ON s.id = g.section_id
        LEFT JOIN items i ON g.id = i.group_id
        ORDER BY s.id, g.id, i.id;
    `;

    db.query(query, (err, results) => {
        if (err) return res.status(500).send(err);

        // Transformar resultados planos en jerarquía JSON
        const sectionsMap = {};
        results.forEach(row => {
            if (!sectionsMap[row.sId]) {
                sectionsMap[row.sId] = { id: row.sId, title: row.sTitle, completed: !!row.sCompleted, groups: [] };
            }
            if (row.gId) {
                let group = sectionsMap[row.sId].groups.find(g => g.id === row.gId);
                if (!group) {
                    group = { id: row.gId, title: row.gTitle, completed: !!row.gCompleted, items: [] };
                    sectionsMap[row.sId].groups.push(group);
                }
                if (row.iId) {
                    group.items.push({ id: row.iId, name: row.iName, completed: !!row.iCompleted });
                }
            }
        });

        res.json(Object.values(sectionsMap));
    });
});

// Crear Sección y Grupo (Nivel 1 y 2)
app.post('/api/structure', (req, res) => {
    const { mainTitle, groupTitle } = req.body;

    db.beginTransaction(err => {
        if (err) return res.status(500).send(err);

        // Verificar si la sección existe o crearla
        db.query('SELECT id FROM sections WHERE title = ?', [mainTitle], (err, results) => {
            let sectionId;
            if (results.length > 0) {
                sectionId = results[0].id;
                insertGroup(sectionId);
            } else {
                db.query('INSERT INTO sections (title) VALUES (?)', [mainTitle], (err, result) => {
                    sectionId = result.insertId;
                    insertGroup(sectionId);
                });
            }
        });

        function insertGroup(sId) {
            db.query('INSERT INTO groups (section_id, title) VALUES (?, ?)', [sId, groupTitle], (err) => {
                if (err) return db.rollback(() => res.status(500).send(err));
                db.commit(() => res.json({ success: true }));
            });
        }
    });
});

// Añadir Item (Nivel 3)
app.post('/api/items', (req, res) => {
    const { groupId, name } = req.body;
    db.query('INSERT INTO items (group_id, name) VALUES (?, ?)', [groupId, name], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ id: result.insertId });
    });
});

// Alternar estado de Item
app.put('/api/items/:id/toggle', (req, res) => {
    const { completed } = req.body;
    db.query('UPDATE items SET completed = ? WHERE id = ?', [completed, req.params.id], (err) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

// Borrar todo
app.delete('/api/checklist', (req, res) => {
    db.query('DELETE FROM sections', (err) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));