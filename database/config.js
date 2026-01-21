// const mysql = require('mysql2/promise');
// const path = require('path');
// const fs = require('fs');

// class Database {
//     constructor() {
//         this.pool = null;
//         this.initialized = false;
//     }

//     async init() {
//         if (this.initialized) return;

//         try {
//             // 1️⃣ Create DB if not exists
//             const tempConnection = await mysql.createConnection({
//                 host: 'localhost',
//                 user: 'root',
//                 password: 'sivaji', // 🔴 MUST MATCH DBeaver
//                 port: 3306
//             });

//             await tempConnection.query(
//                 'CREATE DATABASE IF NOT EXISTS distributor_db'
//             );
//             await tempConnection.end();

//             // 2️⃣ Create pool
//             this.pool = mysql.createPool({
//                 host: 'localhost',
//                 user: 'root',
//                 password: 'sivaji', // 🔴 SAME PASSWORD
//                 database: 'distributor_db',
//                 port: 3306,
//                 waitForConnections: true,
//                 connectionLimit: 10
//             });

//             // 3️⃣ Test connection
//             await this.pool.query('SELECT 1');

//             // 4️⃣ Init schema
//             await this.initializeSchema();

//             this.initialized = true;
//             console.log('✅ Database connected & ready');

//         } catch (error) {
//             console.error('❌ Database init failed:', error);
//             throw error;
//         }
//     }

//     async initializeSchema() {
//         const schemaPath = path.join(__dirname, 'init.sql');
//         if (!fs.existsSync(schemaPath)) return;

//         const sql = fs.readFileSync(schemaPath, 'utf8');
//         const statements = sql.split(';').filter(s => s.trim());

//         for (const stmt of statements) {
//             try {
//                 await this.pool.query(stmt);
//             } catch (err) {
//                 console.warn('Schema warning:', err.message);
//             }
//         }
//     }

//     async execute(query, params = []) {
//         if (!this.initialized) await this.init();
//         const [result] = await this.pool.execute(query, params);
//         return result;
//     }

//     async query(query, params = []) {
//         if (!this.initialized) await this.init();
//         const [rows] = await this.pool.query(query, params);
//         return rows;
//     }

//     async backup() {
//         if (!this.initialized) await this.init();

//         const backupDir = path.join(__dirname, 'backups');
//         if (!fs.existsSync(backupDir)) {
//             fs.mkdirSync(backupDir, { recursive: true });
//         }

//         const backupFile = path.join(
//             backupDir,
//             `backup_${Date.now()}.sql`
//         );

//         const tables = await this.query('SHOW TABLES');
//         let sql = '';

//         for (const table of tables) {
//             const tableName = Object.values(table)[0];
//             const [create] = await this.query(`SHOW CREATE TABLE ${tableName}`);
//             sql += `${create['Create Table']};\n\n`;

//             const rows = await this.query(`SELECT * FROM ${tableName}`);
//             if (!rows.length) continue;

//             const cols = Object.keys(rows[0]);
//             const values = rows.map(r =>
//                 `(${cols.map(c =>
//                     r[c] === null ? 'NULL' : `'${r[c].toString().replace(/'/g, "''")}'`
//                 ).join(', ')})`
//             );

//             sql += `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES\n`;
//             sql += values.join(',\n') + ';\n\n';
//         }

//         fs.writeFileSync(backupFile, sql);
//         return backupFile;
//     }
// }

// module.exports = new Database();


const mysql = require("mysql2/promise");

module.exports = {
  init: async () => {
    try {
      const connection = await mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "sivaji",   // put your MySQL password if any
        database: "zipbill",
        port: 3306
      });

      console.log("✅ Database connected & ready");
      return connection;
    } catch (err) {
      console.error("❌ Database connection failed:", err.message);
      return null;
    }
  }
};

