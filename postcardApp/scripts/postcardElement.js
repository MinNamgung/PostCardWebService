
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
}

function imageDragStarted(ev) {
    ev.dataTransfer.setData("text/plain", "chosenFile");
}

//Get the box of the selectedElement
function getBox(e){
    let box = e.target;
    if (box.className != "postcard-box"){
        box = $(e.target).parents(".postcard-box")[0];
    }
    return box;
}

/*
Methods for showing the "move" cursor only when hovering over the containing div, not the 
actual element (otherwise it is confused with entering text, etc.)
*/
function dragHover(e){
    let box = getBox(e);
    if (e.target.className == "postcard-textbox"){
        box.style.cursor = "move";
    }
}

//Event for onmouseout for inner element
function enableDragHover(e){
    let box = getBox(e);
    box.addEventListener("mouseover", dragHover(event));
}

//Event for onmouseover for inner element
function disableDragHover(e){
    let box = getBox(e);
    box.removeEventListener("mouseover", dragHover(event));
    box.style.cursor = "default";
}

function textHover(e){
    let box = getBox(e);
    let textArea = $(box).find(".postcard-textarea")[0];
    textArea.style.cursor = "text";
}

//Sets cursor for each corner resize
function resizeHover(e){
    let box = getBox(e);
    let resizeClass = box.classList[1];
    if (resizeClass.includes("ne")){
        box.style.cursor = "ne-resize";
    }
    else if (resizeClass.includes("nw")){
        box.style.cursor = "nw-resize";
    }
    else if (resizeClass.includes("sw")){
        box.style.cursor = "sw-resize";
    }
    else if (resizeClass.includes("se")){
        e.target.style.cursor = "se-resize";
    }
}

function selectTextBox(e){
    e.stopPropagation();
    let box = getBox(e);
    setSelected(box.firstChild);
}

//Lightly outlines unselected elements when moused over
function setHoverStyling(e) {
    e.stopPropagation();
    let box = getBox(e);
    // Avoid highlighting textareas
    if (box.firstChild != selectedElement){
        box.firstChild.style.outlineColor = "grey";
    }
}

//Remove outline on mouse out
function exitHoverStyling(e){
    e.stopPropagation();
    let box = getBox(e);
    // Avoid highlighting textareas
    if (box.firstChild != selectedElement){
        box.firstChild.style.outlineColor = "transparent";
    }
}