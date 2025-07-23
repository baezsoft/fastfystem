const express = require('express');
const router = express.Router();
const pool = require('../database');

router.get('/', async (req, res) => {
  const [extras] = await pool.query('SELECT * FROM extra');
  res.render('extras/index', { extras });
});

router.post('/nuevo', async (req, res) => {
  const { nombre, precio } = req.body;
  await pool.query('INSERT INTO extra (nombre, precio) VALUES (?, ?)', [nombre, precio]);
  res.redirect('/extras');
});
router.post('/eliminar/:id', async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM extra WHERE id_extra = ?', [id]);
    res.redirect('/extras');
  });
  
module.exports = router;
