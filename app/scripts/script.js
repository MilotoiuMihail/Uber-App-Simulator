window.onload = function () {
    navigator.geolocation.getCurrentPosition((position) => {
        onLocationAccess(position)
    })

    function onLocationAccess(position) {
        let mapElement = document.getElementById('map');

        let currentMarker = null

        let verticalBound = mapElement.offsetHeight * .5;
        let bounds = L.latLngBounds(L.latLng(-verticalBound, 300), L.latLng(verticalBound, -300));

        let map = L.map('map', {
            maxBounds: bounds,
            worldCopyJump: true
        }).setView([position.coords.latitude, position.coords.longitude], 15)

        L.tileLayer('https://api.maptiler.com/maps/bright-v2/256/{z}/{x}/{y}.png?key=jZkKIah32WCkciSEKI2d', {
            minZoom: 4,
            maxZoom: 20,
            attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
        }).addTo(map)

        map.addEventListener('click', (e) => {
            if (currentMarker)
                currentMarker.removeFrom(map)
            currentMarker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map)
        })
    }
}