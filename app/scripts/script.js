window.onload = function () {
    navigator.geolocation.getCurrentPosition((position) => {
        onLocationAccess(position)
    })

    function onLocationAccess(position) {
        let map = L.map('map', {
        }).setView([position.coords.latitude, position.coords.longitude], 15)
        L.tileLayer('https://api.maptiler.com/maps/bright-v2/256/{z}/{x}/{y}.png?key=jZkKIah32WCkciSEKI2d', {
            minZoom: 4,
            maxZoom: 20
        }).addTo(map)
    }
}