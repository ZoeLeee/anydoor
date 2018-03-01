const fs=require("fs");
const promisify=require("util").promisify;
const stat=promisify(fs.stat);
const readdir=promisify(fs.readdir);
const path=require("path")
const config=require("../config/defaultConfig")
const HandleBars=require("handlebars");
const mime=require('./mime')

const source=fs.readFileSync(path.join(__dirname,'../template/dir.tpl'));
const template=HandleBars.compile(source.toString())

module.exports=async function (req,res,filePath) {
  try{
    const stats=await stat(filePath);
    if(stats.isFile()){
      const contentType=mime(filePath)
      res.statusCode=200;
      res.setHeader('Content-Type',contentType);
      fs.createReadStream(filePath).pipe(res)
    }else if(stats.isDirectory){
      const files=await readdir(filePath);
      const dir=path.relative(config.root,filePath);
      res.statusCode=200;
      res.setHeader('Content-Type',"text/html");
      const data={
        title:path.basename(filePath),
        files,
        dir:dir?`/${dir}`:''
      };
      res.end(template(data));
    }
  }catch(ex){
    res.statusCode=404;
    res.setHeader('Content-Type',"text/plain");
    res.end(`${filePath} is not a directory or no exist/n ${ex}`);
  }
}
