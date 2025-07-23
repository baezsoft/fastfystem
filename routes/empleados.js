const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../database');
const router = express.Router();

// Configuración – pon en .env: JWT_SECRET y opcionalmente JWT_EXPIRES
const JWT_SECRET = process.env.JWT_SECRET || 'increible123';
const JWT_EXPIRES = '8h'; // duración

// Listar empleados (seguro con JWT)
router.get('/', async (req, res) => {
  const [empleados] = await pool.query('SELECT id_empleado, nombre, rol FROM empleados');
  res.render('empleados/index', { empleados });
});

// Crear nuevo empleado (registro)
router.post('/nuevo', async (req, res) => {
  const { nombre, password, rol } = req.body;
  const hashed = await bcrypt.hash(password, 10); // bcrypt con 10 salt rounds :contentReference[oaicite:4]{index=4}
  await pool.query(
    'INSERT INTO empleados (nombre, password, rol) VALUES (?, ?, ?)',
    [nombre, hashed, rol]
  );
  res.redirect('/empleados');
});
// Mostrar formulario login
router.get('/login', (req, res) => {
    res.render('empleados/login');
  });
  
// Eliminar empleado
router.post('/eliminar/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM empleados WHERE id_empleado = ?', [id]);
  res.redirect('/empleados');
});

router.post('/login', async (req, res) => {
    const { nombre, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM empleados WHERE nombre = ?', [nombre]);
    if (rows.length === 0) return res.render('empleados/login', { error: 'Usuario o contraseña incorrecta' });
  
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render('empleados/login', { error: 'Usuario o contraseña incorrecta' });
  
    const token = jwt.sign(
      { id_empleado: user.id_empleado, nombre: user.nombre, rol: user.rol },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );
  
    // Guardar token en cookie segura httpOnly
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // solo en producción HTTPS
      maxAge: 8 * 60 * 60 * 1000 // 8 horas en ms, igual que JWT_EXPIRES
    });
  
    // Redirigir a la página protegida (lista de empleados)
    res.redirect('/empleados');
  });
  router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/empleados/login');
  });
    

// 🛡️ Middleware para verificar token JWT
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader) return res.status(401).send('Falta token de autorización');

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).send('Formato de token inválido');

  const token = parts[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).send('Token inválido');
    req.user = decoded;
    next();
  });
}

module.exports = router;
