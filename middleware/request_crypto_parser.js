const server_config = require("./../config/server");
const dataReviver = require("./../utils/data_reviver");
//--//
let setRequestFiles = function(req){
    if(req.file){
        if(req.file.fieldname && req.file.filename){
            req.body[req.file.fieldname] = req.file.filename;
        }
    }
    if(req.files){
        for(let field in req.files){
            if(req.files[field].length>1){
                let files = req.files[field];
                req.body[field] = [];
                for(let index in files){
                    let file = files[index];
                    req.body[field].push(file);
                }
            }
            else{
                let file = req.files[field][0];
                req.body[file.fieldname] = file.filename;
            }
        }
    }
    // if(req.files){
    //     for(let field in req.files){
    //         let file = req.files[field][0];
    //         req.body[file.fieldname] = file.filename;
    //     }
    // }
};
//--//
module.exports = async function(req, res, next){
    //--//
    setRequestFiles(req);
    //--//
    return next();
};
