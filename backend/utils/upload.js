const multer = require('multer');
const path = require('path');
const fs = require('fs');

const getMulterUpload = (folderName) => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      let dir = `upload/${folderName}`;
      if (folderName === 'users' && file.fieldname === 'company_video') {
        dir = `upload/${folderName}/video`;
      }
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  });

  return multer({ storage });
};

module.exports = getMulterUpload;