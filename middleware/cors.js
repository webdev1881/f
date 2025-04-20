// Дополнительный middleware для расширенной обработки CORS
const corsMiddleware = (req, res, next) => {
    // Установка заголовков CORS
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, my-custom-header');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Предварительные запросы OPTIONS
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  };
  
  module.exports = corsMiddleware;