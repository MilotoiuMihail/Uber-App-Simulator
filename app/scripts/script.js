window.onload = function () {
    let mapElement = document.getElementById('map')
    let btnAllow = document.getElementById('btnAllow')
    let btnSet = document.getElementById('btnSet')
    let title = document.getElementById('title')
    let pickupElement = document.getElementById('pickup')
    let destinationElement = document.getElementById('destination')
    let currentMarker = null
    let map = null
    let canSet = false

    initMap(37.7749, -122.4194) //setting coordinates for Uber HQ

    btnAllow.addEventListener('click', () => {
        navigator.geolocation.getCurrentPosition((position) => {
            onLocationAccess(position)
        })
    })

    btnSet.addEventListener('click', () => {
        canSet = true
    })

    pickupElement.addEventListener('focus', () => {
        title.textContent = 'Where can we pick you up?'
    })

    destinationElement.addEventListener('focus', () => {
        title.textContent = 'Where to?'
    })

    pickupElement.addEventListener('keypress', () => {

    })

    function initMap(lat, lng) {
        let verticalBound = mapElement.offsetHeight * .5;
        let bounds = L.latLngBounds(L.latLng(-verticalBound, 300), L.latLng(verticalBound, -300));
        map = L.map('map', {
            zoom: 10,
            maxBounds: bounds,
            worldCopyJump: true
        }).setView([lat, lng], 13)

        L.tileLayer('https://api.maptiler.com/maps/bright-v2/256/{z}/{x}/{y}.png?key=jZkKIah32WCkciSEKI2d', {
            minZoom: 4,
            maxZoom: 20,
            attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
        }).addTo(map)

        map.zoomControl.setPosition('bottomright')


        map.addEventListener('click', (e) => {
            if (!canSet) return
            if (currentMarker)
                currentMarker.removeFrom(map)
            currentMarker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map)
        })
    }

    function onLocationAccess(position) {
        map.setView([position.coords.latitude, position.coords.longitude], 17)
    }
}