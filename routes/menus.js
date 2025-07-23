const express = require('express');
const router = express.Router();
const pool = require('../database');
const { upload, processImage } = require('../auth/upload');
// Paso 1: Mostrar categorías
router.get('/', async (req, res) => {
  const [categorias] = await pool.query('SELECT * FROM categorias');
  res.render('menus/categorias', { categorias });
});

// Paso 2: Mostrar menús según la categoría seleccionada
router.get('/categoria/:id_categoria', async (req, res) => {
  const { id_categoria } = req.params;
  const [menus] = await pool.query('SELECT * FROM menus WHERE id_categoria = ? AND existe = 1', [id_categoria]);
  const [[categoria]] = await pool.query('SELECT * FROM categorias WHERE id_categoria = ?', [id_categoria]);
  const [extras] = await pool.query('SELECT * FROM extra'); // AGREGADO

  res.render('menus/index', { menus, categoria, user : req.user, extras});
});

// Nuevo menú
router.get('/nuevo', async (req, res) => {
  const [categorias] = await pool.query('SELECT * FROM categorias');
  res.render('menus/nuevo', { categorias });
});

// Crear nuevo menú con imagen
router.post('/nuevo', upload.single('imagen'), processImage, async (req, res) => {
    const { nombre, precio, ingredientes, id_categoria } = req.body;
    const imagen = req.imagePath || null;
  
    await pool.query(
      'INSERT INTO menus (nombre, precio, ingredientes, id_categoria, imagen) VALUES (?, ?, ?, ?, ?)',
      [nombre, precio, ingredientes, id_categoria, imagen]
    );
  
    res.redirect('/menus');
  });
  

// Eliminar menú
router.post('/eliminar/:id', async (req, res) => {
    const { id } = req.params;
    await pool.query('UPDATE menus SET existe = 0 WHERE id_menu = ?', [id]);
    res.redirect('/menus');
  });
  
// Formulario editar
router.get('/editar/:id', async (req, res) => {
    const { id } = req.params;
    const [[menu]] = await pool.query('SELECT * FROM menus WHERE id_menu = ?', [id]);
    const [categorias] = await pool.query('SELECT * FROM categorias');
    res.render('menus/editar', { menu, categorias });
  });
  
  // Guardar edición
// Editar menú con nueva imagen opcional
router.post('/editar/:id', upload.single('imagen'), processImage, async (req, res) => {
    const { id } = req.params;
    const { nombre, precio, ingredientes, id_categoria } = req.body;
  
    let query = 'UPDATE menus SET nombre = ?, precio = ?, ingredientes = ?, id_categoria = ?';
    const params = [nombre, precio, ingredientes, id_categoria];
  
    if (req.imagePath) {
      query += ', imagen = ?';
      params.push(req.imagePath);
    }
  
    query += ' WHERE id_menu = ?';
    params.push(id);
  
    await pool.query(query, params);
    res.redirect(`/menus/categoria/${id_categoria}`);
  });
  
module.exports = router;
