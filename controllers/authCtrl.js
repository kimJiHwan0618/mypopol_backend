const connection = require('../dbConfig');
const query = require('../query/auth');
const jwt = require('jsonwebtoken');

const dbCtrl = {
  signIn: async (req, res) => {
    const clientDomain = req.headers.origin;
    console.log('Client domain:', clientDomain);
    connection.query(query.getUser(req.body),
      (error, rows) => {
        if (error) throw error;
        if (rows.length === 1) {
          const user = {
            key: `${rows[0].userKey}`,
            userId: `${rows[0].userId}`,
            username: `${rows[0].userName}`,
            roleId: `${rows[0].roleId}`,
            role: `${rows[0].roleName}`,
          };
          const token = jwt.sign(user, 'my_secret_key', { expiresIn: '30m' });
          res.cookie('token', token, { httpOnly: true });
          res.send({
            code: 200,
            response: {
              ...{
                accessToken: token,
                tokenExpiresIn: new Date().getTime(),
              },
              ...user,
            },
          });
        } else {
          const code = 401;
          res.status(code).json({
            code: code,
            status: 'Unauthorized',
            message: '일치하는 유저 정보가 없습니다.',
            timestamp: new Date(),
          });
        }
      }
    );
  },
  // signIn
  accessToken: async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    try {
      const decodedToken = jwt.verify(token, 'my_secret_key');
      delete decodedToken.iat;
      delete decodedToken.exp;
      const refreshToken = jwt.sign(decodedToken, 'my_secret_key', { expiresIn: '30m' });
      res.cookie('token', refreshToken, { httpOnly: true });
      res.send({
        code: 200,
        response: {
          ...{
            accessToken: refreshToken,
            tokenExpiresIn: new Date().getTime(),
          },
          ...decodedToken,
        },
      });
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  },
  // accessToken
};

module.exports = dbCtrl;
