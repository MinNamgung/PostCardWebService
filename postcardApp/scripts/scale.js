let elements = $(".postcardContainer");

function doResize($el) {
  
  var scale, origin;
    
  scale = Math.min(
    ui.size.width / elWidth,    
    ui.size.height / elHeight
  );
  
  $el.css({
    transform: "translate(-50%, -50%) " + "scale(" + scale + ")"
  });
  
}

elements.each($el =>{
    doResize(null, starterData, $el)
})