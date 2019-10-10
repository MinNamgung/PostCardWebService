
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
    console.log("drag");
}