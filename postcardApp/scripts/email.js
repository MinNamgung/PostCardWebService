function on() {
    document.getElementById("overlay").style.display = "block";
  }
  
  function off() {
    document.getElementById("overlay").style.display = "none";
  }

  
  function success() {
    if(document.getElementById("name").value==="" && document.getElementById("email").value==="") { 
             document.getElementById('btnContactUs').disabled = true; 
         } else { 
             document.getElementById('btnContactUs').disabled = false;
         }
     }

  function onSendAlert(){
      alert('Success!');
      off();
  }