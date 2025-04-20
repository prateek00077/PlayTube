import multer from 'multer';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public"); // folder where files will be saved
    },
    filename: function (req, file, cb) {
      cb(null,file.originalname); // filename
    }
  });

export  const upload = multer({ storage,});