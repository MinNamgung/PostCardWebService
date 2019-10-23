
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
Handles the ondrag event of a postcard element by repositioning the element.
*/
function onDrag(ev) {
    console.log(ev.target.offsetParent);
    let element = ev.target;
}