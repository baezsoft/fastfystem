const express = require('express');
const router = express.Router();
const pool = require('../database');

router.get('/', async (req, res) => {
  const [detalles] = await pool.query(`
    SELECT dp.*, m.nombre AS menu, e.nombre AS extra
    FROM detalle_pedidos dp
    LEFT JOIN menus m ON dp.id_menu = m.id_menu
    LEFT JOIN extra e ON dp.id_extra = e.id_extra
  `);
  res.render('detallePedidos/index', { detalles });
});

router.post('/nuevo', async (req, res) => {
  const { id_pedido, id_menu, id_extra } = req.body;
  await pool.query(
    'INSERT INTO detalle_pedidos (id_pedido, id_menu, id_extra) VALUES (?, ?, ?)',
    [id_pedido, id_menu || null, id_extra || null]
  );
  res.redirect('/detallePedidos');
});
router.post('/eliminar/:id', async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM detalle_pedidos WHERE id_detalle = ?', [id]);
    res.redirect('/detallePedidos');
  });
  
module.exports = router;
