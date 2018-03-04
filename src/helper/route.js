const fs=require("fs");
const promisify=require("util").promisify;
const stat=promisify(fs.stat);
const readdir=promisify(fs.readdir);
const path=require("path")
const config=require("../config/defaultConfig")
const HandleBars=require("handlebars");
const mime=require('./mime')
const compress=require('./compress')

const source=fs.readFileSync(path.join(__dirname,'../template/dir.tpl'));
const template=HandleBars.compile(source.toString())
const range=require('./range')

const isFresh=require('./cache');

module.exports=async function (req,res,filePath) {
  try{
    const stats=await stat(filePath);
    if(stats.isFile()){
      const contentType=mime(filePath)
      res.setHeader('Content-Type',contentType);

      if(isFresh(stats,req,res)){
        res.statusCode=304;
        res.end();
        return;
      }

      let rs;
      const {code,start,end}=range(stats.size,req,res);
      res.statusCode=code;
      if(code===200){
        rs=fs.createReadStream(filePath)
      }else{
        rs=fs.createReadStream(filePath,{start,end})
      }
      if(filePath.match(config.compress)){
        rs=compress(rs,req,res);
      }
      rs.pipe(res);
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
