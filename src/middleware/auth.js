const supabaseClient = require('../supabase.js');

const authMiddleware = async (req, res, next) => {
  console.log('Auth middleware');

  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(400).json({
      error: 'Access token required',
    });
  }

  const token = auth.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Access token required',
    });
  }

  const { data, error } = await supabaseClient.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({
      error: 'Invalid or expired token',
    });
  }

  req.user = data.user;

  next();
};

module.exports = authMiddleware;
