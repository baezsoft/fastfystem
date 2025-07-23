const express = require('express');
const router = express.Router();
const pool = require('../database');


router.post('/nuevo', async (req, res) => {
    try {
      const { id_cliente, id_empleado, items } = req.body;
      if (!items || items.length === 0) return res.status(400).send('Carrito vacío');
  
      // Calcular costo total
      const costo = items.reduce((acc, i) => acc + i.precio * (i.cantidad || 1), 0);
  
      // Insertar pedido
      const [pedidoResult] = await pool.query(
        'INSERT INTO pedido (costo, fecha, id_empleado, id_cliente, estado) VALUES (?, NOW(), ?, ?, ?)',
        [costo, id_empleado, id_cliente, 'pendiente']
      );
      const id_pedido = pedidoResult.insertId;
  
      // Insertar detalles y sus extras
      for (const item of items) {
        // Insertar detalle sin extras
        const [detalleResult] = await pool.query(
          'INSERT INTO detalle_pedidos (id_pedido, id_menu, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
          [id_pedido, item.id_menu, item.cantidad || 1, item.precio]
        );
        const id_detalle = detalleResult.insertId;
  
        // Insertar extras de ese detalle, si hay
        if (item.extras && item.extras.length > 0) {
          for (const extra of item.extras) {
            await pool.query(
              'INSERT INTO detalle_extras (id_detalle_pedido, id_extra) VALUES (?, ?)',
              [id_detalle, extra.id_extra]
            );
          }
        }
      }
  
      res.json({ message: 'Pedido creado', id_pedido });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error creando pedido');
    }
  });
  
router.get('/pendientes', async (req, res) => {
    try {
        const [pedidos] = await pool.query(
            `SELECT p.id_pedido, p.costo, p.fecha, p.estado, c.nombre AS cliente, e.nombre AS empleado
         FROM pedido p
         LEFT JOIN cliente c ON p.id_cliente = c.id_cliente
         LEFT JOIN empleados e ON p.id_empleado = e.id_empleado
         WHERE p.estado = 'pendiente'
         ORDER BY p.fecha DESC`
        ); 
        if(pedidos.length > 0){
            for (const pedido of pedidos) {
                const [detalles] = await pool.query(
                  `SELECT d.id_detalle, m.nombre AS menu, d.cantidad, d.precio_unitario
                   FROM detalle_pedidos d
                   JOIN menus m ON d.id_menu = m.id_menu
                   WHERE d.id_pedido = ?`,
                  [pedido.id_pedido]
                );
              
                for (const detalle of detalles) {
                  const [extras] = await pool.query(
                    `SELECT e.nombre, e.precio
                     FROM detalle_extras de
                     JOIN extra e ON de.id_extra = e.id_extra
                     WHERE de.id_detalle_pedido = ?`,
                    [detalle.id_detalle]
                  );
                  detalle.extras = extras;
                }
              
                pedido.detalles = detalles;
              }
        }

        res.render('pedidos/pendientes', { pedidos });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al cargar pedidos');
    }
});

router.post('/entregar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE pedido SET estado = ? WHERE id_pedido = ?', ['entregado', id]);
        res.redirect('/pedidos/pendientes');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al actualizar pedido');
    }
});
router.post('/entregado/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query('UPDATE pedido SET estado = ? WHERE id_pedido = ?', ['entregado', id]);
      res.redirect('/pedidos/pendientes'); // O donde quieras mostrar los pedidos
    } catch (error) {
      console.error(error);
      res.status(500).send('Error actualizando pedido');
    }
  });
  router.get('/entregados', async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin, id_empleado, orden = 'DESC' } = req.query;
  
      // Armamos condiciones dinámicas
      let condiciones = [`p.estado = 'entregado'`];
      let params = [];
  
      if (fecha_inicio && fecha_fin) {
        condiciones.push(`DATE(p.fecha) BETWEEN ? AND ?`);
        params.push(fecha_inicio, fecha_fin);
      }
  
      if (id_empleado) {
        condiciones.push(`p.id_empleado = ?`);
        params.push(id_empleado);
      }
  
      const whereClause = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  
      const [pedidos] = await pool.query(
        `SELECT p.id_pedido, p.costo, p.fecha, p.estado, c.nombre AS cliente, e.nombre AS empleado
         FROM pedido p
         LEFT JOIN cliente c ON p.id_cliente = c.id_cliente
         LEFT JOIN empleados e ON p.id_empleado = e.id_empleado
         ${whereClause}
         ORDER BY p.costo ${orden === 'ASC' ? 'ASC' : 'DESC'}`
      , params);
  
      // Cargar detalles y extras como en el original
      for (const pedido of pedidos) {
        const [detalles] = await pool.query(
          `SELECT d.id_detalle, m.nombre AS menu, d.cantidad, d.precio_unitario
           FROM detalle_pedidos d
           JOIN menus m ON d.id_menu = m.id_menu
           WHERE d.id_pedido = ?`,
          [pedido.id_pedido]
        );
  
        for (const detalle of detalles) {
          const [extras] = await pool.query(
            `SELECT e.nombre, e.precio
             FROM detalle_extras de
             JOIN extra e ON de.id_extra = e.id_extra
             WHERE de.id_detalle_pedido = ?`,
            [detalle.id_detalle]
          );
          detalle.extras = extras;
        }
  
        pedido.detalles = detalles;
      }
  
      // Lista de empleados para filtro (solo si no se manda como API)
      const [empleados] = await pool.query('SELECT id_empleado, nombre FROM empleados');
  
      res.render('pedidos/entregados', {
        pedidos,
        empleados,
        filtros: { fecha_inicio, fecha_fin, id_empleado, orden }
      });
  
    } catch (err) {
      console.error(err);
      res.status(500).send('Error al cargar pedidos entregados');
    }
  });
  

module.exports = router;
