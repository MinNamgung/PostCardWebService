function deletePostcard(event){
    let postcardData = event.target.id.split("_");
    postcardData[0] = postcardData[0] === "private" ? postcardData[0] = true : postcardData[0] = false;
    let data = {
        isPrivate: postcardData[0],
        index: postcardData[1]
    }
    $.ajax({
        url: '/postcard/delete',
        type: 'DELETE',
        data: data,
        success: (data) => {
            //Refactor toast code in Postcard.js to be global?
            // displayToast("Postcard Deleted", data.message);
            //Remove the stale HTML
            $(event.target.parentElement).remove();
        }
    });
}