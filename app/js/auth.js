function register(form){
    let err = ""
    let valid = [];

    if (form.fname.value.trim() === ""){
        err += "You must provide a first name<br/>";
        valid.push(false);
    }else{
        valid.push(true)
    }

    if (form.lname.value.trim() === ""){
        err += "You must provide a last name<br/>";
        valid.push(false);
    }else{
        valid.push(true)
    }

    if (form.email.value === ""){
        err += "You must provide an email address<br/>";					
        valid.push(false);
    }else{
        valid.push(true)
    }

    if (form.uname.value === ""){
        err += "You must provide a username<br/>";					
        valid.push(false);
    }else{
        valid.push(true)
    }

    if (form.pword.value === ""){
        err += "You must provide a password<br/>";					
        valid.push(false);
    }else{
        valid.push(true)
    }

    if (form.pword.value !== form.cword.value){
        err += "Paswords must match<br/>";
        valid.push(false);
    }else{
        valid.push(true)
    }

    if(valid.indexOf(false) === -1){
        let data = {
            firstname: form.fname.value.trim(),
            lastname: form.lname.value.trim(),
            email: form.email.value.trim(),
            username: form.uname.value.trim(),
            password: form.pword.value
        }

        console.log(data);

        $.post("/register",data,(dt,st)=>{
            console.log(dt,st)
        })
    }

    $("#reg-error").html(err);

    //console.log(data)
}

function auth(form){
    let err = ""
    let valid = [];

    if (form.uname.value === ""){
        err += "You must provide a username<br/>";					
        valid.push(false);
    }else{
        valid.push(true)
    }

    if (form.pword.value === ""){
        err += "You must provide a password<br/>";					
        valid.push(false);
    }else{
        valid.push(true)
    }

    if(valid.indexOf(false) === -1){
        let data = {
            username: form.uname.value,
            password: form.pword.value
        }

        console.log(data);

        $.post("/login",data,(dt,st)=>{
            console.log(dt,st)
        })
    }

    $("#login-error").html(err);

    //console.log(data)
}