const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const verifyToken = require('./auth/auth');
require('dotenv').config();


const app = express();

// Config
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.use(verifyToken)
app.use('/uploads', express.static('public/uploads'));

// Rutas
app.get('/',(req,res)=>{
    res.redirect('/menus')
})
app.use('/menus', require('./routes/menus'));
app.use('/categorias', require('./routes/categorias'));
app.use('/extras', require('./routes/extras'));
app.use('/clientes', require('./routes/clientes'));
app.use('/empleados', require('./routes/empleados'));
app.use('/pedidos', require('./routes/pedidos'));

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
