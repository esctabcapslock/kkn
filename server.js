const http = require('http')
const url = require('url')
const fs = require('fs');
const port = 80;
http.createServer((req,res)=>{
    const _url = req.url
    const pathname = url.parse('http://localhost'+_url).pathname
    
    console.log('[url]',pathname)
    try{
        const file = fs.readFileSync(pathname=='/'?'index.html':__dirname+pathname)
        res.statusCode = 200
        if(pathname.endsWith('.html')) res.setHeader("Content-Type", "text/html; charset=utf-8")
        else if(pathname.endsWith('.css')) res.setHeader("Content-Type", "text/css; charset=utf-8")
        else if(pathname.endsWith('.js')) res.setHeader("Content-Type", "text/javascript; charset=utf-8")
        res.end(file)
    }catch(e){
        res.writeHead(404)
        res.end(`${JSON.stringify(e)}`)
    }


}).listen(port,console.log(`server is running at ${port}`))