const mysql = require('mysql2');

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
    console.log('Conectado a la base de datos MySQL en la nube');
});

// Ejecutar el esquema paso a paso
db.query('CREATE DATABASE IF NOT EXISTS railway;', (err) => {
    if (err) {
        console.error('Error creando la base de datos:', err);
        return;
    }
    console.log('Base de datos creada');

    db.query('USE railway;', (err) => {
        if (err) {
            console.error('Error cambiando a la base de datos:', err);
            return;
        }
        console.log('Cambiado a la base de datos ferrocarril');

        const tables = `
-- Tabla para el Nivel 1 (Secciones principales)
CREATE TABLE IF NOT EXISTS sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para el Nivel 2 (Grupos dentro de secciones)
CREATE TABLE IF NOT EXISTS groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    section_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
);

-- Tabla para el Nivel 3 (Items individuales)
CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);
        `;

        db.query(tables, (err) => {
            if (err) {
                console.error('Error creando las tablas:', err);
                return;
            }
            console.log('Tablas creadas exitosamente');
            db.end();
        });
    });
});