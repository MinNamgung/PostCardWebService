function validate(form){
    let err = ""
    let valid = [];

    if (typeof(form.fname) !== 'undefined' && form.fname.value.trim() === ""){
        err += "You must provide a first name<br/>";
        valid.push(false);
    }else{
        valid.push(true)
    }

    if (typeof(form.lname) !== 'undefined' && form.lname.value.trim() === ""){
        err += "You must provide a last name<br/>";
        valid.push(false);
    }else{
        valid.push(true)
    }

    if (typeof(form.email) !== 'undefined' && form.email.value === ""){
        err += "You must provide an email address<br/>";					
        valid.push(false);
    }else{
        valid.push(true)
    }

    if (typeof(form.uname) !== 'undefined' && form.uname.value === ""){
        err += "You must provide a username<br/>";					
        valid.push(false);
    }else{
        valid.push(true)
    }

    if (typeof(form.pword) !== 'undefined' && form.pword.value === ""){
        err += "You must provide a password<br/>";					
        valid.push(false);
    }else{
        valid.push(true)
    }

    if (typeof(form.cword) !== 'undefined' && typeof(form.pword) !== 'undefined' && form.pword.value !== form.cword.value){
        err += "Paswords must match<br/>";
        valid.push(false);
    }else{
        valid.push(true)
    }

    return {
        success: valid.indexOf(false) === -1,
        message: err
    }
}

function register(form){
    let valid = validate(form)
    if(valid.success){
        let data = {
            firstname: form.fname.value.trim(),
            lastname: form.lname.value.trim(),
            email: form.email.value.trim(),
            username: form.uname.value.trim(),
            password: form.pword.value.trim()
        }

        $.post("/register",data).done(res => {
            $("#reg-error").html(res.message);
        })
    }

    $("#reg-error").html(valid.message);
}

function auth(form){
    let valid = validate(form)
    if(valid.success){
        let data = {
            username: form.uname.value,
            password: form.pword.value
        }

        $.post("/login",data).done(data => {  
            if(data.success){
                console.log($(location).attr('href'))
                if($(location).attr('pathname') !== "/design"){
                    $(location).attr('href',"/")
                }
            }else{
                $("#login-error").html(data.message);  
            }                 
        })
    }   

    $("#login-error").html(valid.message);
}