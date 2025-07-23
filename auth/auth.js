const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'increible123';

function verifyToken(req, res, next) {
  const excepciones = [
    { method: 'GET', path: '/' },
    { method: 'GET', path: '/empleados/login' },
    { method: 'POST', path: '/empleados/login' },
  ];

  const esExcepcion = excepciones.some(
    ex => req.method === ex.method && req.path === ex.path
  );

  if (esExcepcion) return next();

  const token = req.cookies.token;
  if (!token) {
    res.redirect('/empleados/login')
  }else{
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) res.redirect('/empleados/login');
      req.user = decoded;
      next();
    });
  }


}

module.exports = verifyToken;
