

function showCoordinates (e) {
    alert(e.latlng);
}

function centerMap (e) {
    brainmap.map.panTo(e.latlng);
}

function zoomIn (e) {
    brainmap.map.zoomIn();
}

function zoomOut (e) {
    brainmap.map.zoomOut();
}
