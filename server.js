const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de conexión a PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'DOO',
  password: '14592407',
  port: 5432
});

// LOGIN
app.post('/api/login', async (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({ success: false, message: 'Faltan datos' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM empleados WHERE usuario = $1 AND password = $2',
      [usuario, password]
    );

    if (result.rows.length > 0) {
      const empleado = result.rows[0];
      res.json({
        success: true,
        message: 'Inicio de sesión exitoso',
        empleado: {
          id: empleado.id,
          nombre: empleado.nombre,
          usuario: empleado.usuario
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
    }
  } catch (err) {
    console.error('Error en /api/login:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// PRODUCTOS
app.get('/api/productos', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre, precio, stock FROM productos');
    res.json(result.rows);
  } catch (err) {
    console.error('Error en /api/productos:', err);
    res.status(500).json({ error: 'Error consultando productos', detalle: err.message });
  }
});

// REGISTRAR VENTA y ACTUALIZAR STOCK
app.post('/api/venta', async (req, res) => {
  const { cliente, empleado, productos } = req.body;

  if (!cliente || !empleado || !productos || productos.length === 0) {
    return res.status(400).json({ success: false, message: 'Datos incompletos.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Actualizar el stock por cada producto vendido
    for (const item of productos) {
      const { nombre, cantidad } = item;
      const result = await client.query(
        'UPDATE productos SET stock = stock - $1 WHERE nombre = $2 AND stock >= $1 RETURNING *',
        [cantidad, nombre]
      );

      if (result.rowCount === 0) {
        throw new Error(`Stock insuficiente para ${nombre}`);
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Venta registrada y stock actualizado correctamente.'
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al registrar venta:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// SERVIDOR
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});
