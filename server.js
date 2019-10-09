const http = require('http')
const port = 8080
const parse = require('querystring')
const fs = require('fs')
const url = require('url')

http.createServer((req,res) => {

    let q = url.parse(req.url, true)
    console.log(q)
    if(q.pathname === '/register'){
        let data = ''
        let formData = ""
        req.on('data', chunk => {
            data += chunk.toString() // convert Buffer to string
            console.log(data)
        });
        req.on('end', () => {
            formData = parse.parse(data)
            console.log(formData);
            res.end('ok')
        });
    }else if(q.pathname === '/login'){
        let data = ''
        let formData = ""
        req.on('data', chunk => {
            data += chunk.toString() // convert Buffer to string
        });
        req.on('end', () => {
            formData = parse.parse(data)
            console.log(formData);
            res.end('ok')
        });
    }else if(q.pathname == "/"){
        var html = fs.readFileSync('./index.html', 'utf8')
        res.writeHeader(200,{html: 'html'});  
        res.write(html);  
        res.end(); 
    }else{
        try{
            var text = fs.readFileSync(__dirname + q.pathname)
            res.writeHeader(200);  
            res.write(text);  
            res.end()
        }catch(err){
            console.log(err)
        }
    }
}).listen(port)

console.log("Server is running on port " + port)