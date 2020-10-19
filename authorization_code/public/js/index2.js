$.ajax({
    type: "POST",
    url: `http://localhost:8888/playlists`,
    data: {},
    complete: function(response){
        $("#playlists-container").html(response.responseJSON.responseHTML);
    },
    contentType: 'application/json',
    dataType: 'json'
});