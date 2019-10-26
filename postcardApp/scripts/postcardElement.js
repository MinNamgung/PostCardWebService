
/*
This function sets the data of the drag event when the drag is
started by the user. This implementation sets the data["text/plain"]
to the type entry in the dataset of the dragged element.
The type will be used by the drop event to determine what type of element
to create and add onto the dropped element.
*/
function dragStarted(ev) {
    let elementType = ev.target.dataset.type;
    ev.dataTransfer.setData("text/plain", elementType);
    let dragImage = null;
    if (elementType === "input") {
        dragImage = document.getElementById("dragTextImage");
    }
    else if (elementType === "image") {
        dragImage = document.getElementById("dragImage");
        dragImage.innerHTML = "New Image";
        dragImage.style.width = 60;
        dragImage.style.height = 30;
        dragImage.style.border = "solid 1px black";
    }
    else {
        dragImage.innerHTML = "New Component";
    }
    
    //Drag is centered on the mouse
    ev.dataTransfer.setDragImage(dragImage, dragImage.clientWidth / 2, dragImage.clientHeight / 2);
    console.log("dragStarted");
}

function imageDragStarted(ev) {
    console.log(ev.dataTransfer);
    ev.dataTransfer.setData("text/plain", "chosenFile");
}

/*
Methods for showing the "move" cursor only when hovering over the containing div, not the 
actual element (otherwise it is confused with entering text, etc.)
*/
function dragHover(e){
    e.target.style.cursor = "move";
}

//Event for onmouseout for inner element
function enableDragHover(e){
    e.target.parentElement.addEventListener("mouseover", dragHover);
}

//Event for onmouseover for inner element
function disableDragHover(e){
    e.target.parentElement.removeEventListener("mouseover", dragHover);
    e.target.style.cursor = "default";
}

function textHover(e){
    e.target.style.cursor = "text";
}

//Sets cursor for each corner resize
function resizeHover(e){
    let resizeClass = e.target.classList[1];
    if (resizeClass.includes("ne") || resizeClass.includes("sw")){
        e.target.style.cursor = "ne-resize";
    }
    else{
        e.target.style.cursor = "se-resize";
    }
    
}

function selectParent(e){
    e.stopPropagation();
    setSelected(e.target.parentElement);
}

//Lightly outlines unselected elements when moused over
function setHoverStyling(event) {
    event.stopPropagation();
    if (event.target != selectedElement){
        event.target.style.outlineColor = "grey";
    }
}

//Remove outline on mouse out
function exitHoverStyling(event){
    event.stopPropagation();
    if (event.target != selectedElement){
        event.target.style.outlineColor = "transparent";
    }
}

function setParentHoverStyling(event){
    if (event.target.parentElement != selectedElement){
        event.target.parentElement.style.outlineColor = "grey";
    }
}

function exitParentHoverStyling(event){
    if (event.target.parentElement != selectedElement){
        event.target.parentElement.style.outlineColor = "transparent";
    }
}