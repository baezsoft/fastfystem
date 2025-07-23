const express = require('express');
const router = express.Router();
const pool = require('../database');
const verifyToken = require('../auth/auth');

// Listar categorías
router.get('/',verifyToken, async (req, res) => {
  const [categorias] = await pool.query('SELECT * FROM categorias');
  res.render('categorias/index', { categorias });
});

// Formulario nuevo
router.post('/nuevo', verifyToken,async (req, res) => {
  const { nombre } = req.body;
  await pool.query('INSERT INTO categorias (nombre) VALUES (?)', [nombre]);
  res.redirect('/categorias');
});

// Formulario de edición
router.get('/editar/:id', verifyToken,async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query('SELECT * FROM categorias WHERE id_categoria = ?', [id]);
  if (rows.length === 0) return res.redirect('/categorias');
  res.render('categorias/editar', { categoria: rows[0] });
});

// Actualizar la edición
router.post('/editar/:id',verifyToken, async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;
  await pool.query('UPDATE categorias SET nombre = ? WHERE id_categoria = ?', [nombre, id]);
  res.redirect('/categorias');
});

// Eliminar
router.post('/eliminar/:id', verifyToken,async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM categorias WHERE id_categoria = ?', [id]);
  res.redirect('/categorias');
});

module.exports = router;
