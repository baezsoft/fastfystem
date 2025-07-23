const express = require('express');
const router = express.Router();
const pool = require('../database');

router.get('/', async (req, res) => {
  const [clientes] = await pool.query('SELECT * FROM cliente');
  res.render('clientes/index', { clientes });
});

router.post('/nuevo', async (req, res) => {
  const { nombre } = req.body;
  await pool.query('INSERT INTO cliente (nombre) VALUES (?)', [nombre]);
  res.redirect('/clientes');
});
router.post('/eliminar/:id', async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM cliente WHERE id_cliente = ?', [id]);
    res.redirect('/clientes');
  });
  
module.exports = router;
