window.onload = function () {
    let mapElement = document.getElementById('map')
    let btnPosition = document.getElementById('btnPosition')
    let btnSet = document.getElementById('btnSet')
    let title = document.getElementById('title')
    let pickupElement = document.getElementById('pickup')
    let destinationElement = document.getElementById('destination')
    let resultList = document.getElementById('results')

    let currentMarker = null
    let map = null
    let geocoder = L.Control.Geocoder.nominatim()
    let canSet = false
    let currentPosition = null
    let searchBounds = null
    //coordinates for Uber HQ
    const defaultLat = 37.7749
    const defaultLng = -122.4194


    //functions
    async function init() {
        let permissionStatus = await getPermission()
        switch (permissionStatus.state) {
            case "granted":
                navigator.geolocation.getCurrentPosition((position) => {
                    onLocationAccess(position)
                    initMap(position.coords.latitude, position.coords.longitude)
                })
                break;
            case "denied":
                btnPosition.remove()
            default:
                initMap(defaultLat, defaultLng)
                break;
        }
    }


    function getPermission() {
        return navigator.permissions.query({ name: 'geolocation' }).then(function (permissionStatus) {
            return permissionStatus
        });
    }

    function initMap(lat, lng) {
        let verticalBound = mapElement.offsetHeight * .5;
        let viewBounds = L.latLngBounds(L.latLng(-verticalBound, 300), L.latLng(verticalBound, -300));
        map = L.map('map', {
            zoom: 10,
            maxBounds: viewBounds,
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
        currentPosition = position
        let radius = 100000
        setSearchBounds(position.coords.latitude, position.coords.longitude, radius)
        geocoder.options.geocodingQueryParams = {
            viewbox: searchBounds.toBBoxString(),
            bounded: 1
        }
    }

    function setSearchBounds(lat, lng, radius) {
        let center = L.latLng(lat, lng)
        searchBounds = center.toBounds(radius)
    }
    //code
    init()

    btnPosition.addEventListener('click', () => {
        navigator.geolocation.getCurrentPosition((position) => {
            onLocationAccess(position)
            map.setView([position.coords.latitude, position.coords.longitude], 17)
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

    pickupElement.addEventListener('keyup', (e) => {
        for (let i = 2; i < resultList.children.length; i++) {
            resultList.removeChild(resultList.children[i]);
        }
        let search = pickupElement.value

        geocoder.geocode(search, (results) => {
            results.forEach(result => {
                let item = document.createElement("div")
                item.classList.add("resultItem");
                if (result.icon) {
                    let img = document.createElement("img");
                    img.classList.add("icon");
                    img.src = result.icon;
                    item.appendChild(img);
                }
                let text = document.createTextNode(result.name);
                item.appendChild(text);
                item.addEventListener('click', (e) => {
                    //??
                    if (title.textContent === "Where can we pick you up?")
                        pickupElement.value = result.name
                    else
                        destinationElement.value = result.name
                })
                resultList.appendChild(item)
            })
        })
    })

}