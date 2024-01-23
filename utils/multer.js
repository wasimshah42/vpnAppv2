const path = require("path");
const multer = require("multer");
const mime = require("mime-types");
//--//
const uploader = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, __dirname + "/../uploads/");
    },
    filename: function (req, file, cb) {
      cb(
        null,
        Date.now() +
        "_" +
        Math.random().toString(36).substring(2) +
        "." +
        mime.extension(file.mimetype)
      );
    },
  }),
  fileFilter: function (req, files, callback) {
    let ext = path.extname(files.originalname);
    ext = String(ext).trim().toLowerCase();
    let allowed = [
      ".jpg",
      ".jpeg",
      ".png",
      ".json",
      // ".docx",
      // ".xls",
      // ".xlsx",
      // ".ppt",
      // ".pptx",
      // ".pdf",
    ];
    if (!allowed || !allowed.length) {
      return callback(null, true);
    } else if (allowed.toString().indexOf(ext) > -1) {
      return callback(null, true);
    } else {
      callback({ error: 'File type not supported' })
      // return callback(new Error('file is not allowed'))
      // return callback(null, false);
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});
//--//
module.exports = { uploader: uploader };
