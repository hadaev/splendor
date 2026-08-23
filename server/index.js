require('dotenv').config();
const express = require('express');
const sequelize = require('./db/db');
const cors = require('cors');
const cookieParser = require('cookie-parser');
// const fileUpload = require('express-fileupload');
const router = require('./routes/index');
// const errorMiddleware = require('./middleware/error-middleware');
// const ApiError = require('./error/api-error');
const migrator = require('./db/migrator');
const seeder = require('./db/seeder');

const PORT = process.env.PORT || 5000;
const app = express();

// allow requests from the client app and Brightcove player
const corsWhitelist = [process.env.CLIENT_URL];
const corsOptions = {
  credentials: true,
  origin: function (origin, callback) {
    // TODO figure out how to allow direct cURL requests w/o `!origin` check
    if (!origin || corsWhitelist.indexOf(origin) !== -1 || corsWhitelist.indexOf('*') !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// app.use(fileUpload({}));

app.use('/api', router);
// app.get('/', function (req, res) {
//   res.send('==errrr');
// });
// app.use(errorMiddleware);

(async () => {
  try {
    await sequelize.authenticate();

    // run db migrations from `/migrations` directory
    await migrator(sequelize);

    // run db seeds from `/seeders` directory
    await seeder(sequelize);

    app.listen(PORT, () => console.info(`Server started on port ${PORT}`));
  } catch (e) {
    console.error(e);
  }
})();
