window.onload = function () {
    const mapElement = document.getElementById('map')
    const btnPosition = document.getElementById('btnPosition')
    const btnSet = document.getElementById('btnSet')
    const title = document.getElementById('title')
    const resultList = document.getElementById('results')
    const buttonContainer = document.getElementById('buttonContainer')
    const btnConfirm = document.getElementById('btnConfirm')
    const btnCancel = document.getElementById('btnCancel')
    const inputContainer = document.getElementById('inputContainer')
    let map = null
    let geocoder = null
    let lastInput = null
    let route = null

    const pickup = {
        element: document.getElementById('pickup'),
        marker: null,
        location: null
    }

    const destination = {
        element: document.getElementById('destination'),
        marker: null,
        location: null
    }

    const setPoint = {
        marker: null,
        canSet: false
    }

    const user = {
        marker: null
    }

    //coordinates for Uber HQ
    const defaultLat = 37.7749
    const defaultLng = -122.4194


    //#region functions
    async function init() {
        initMap()
        geocoder = L.Control.Geocoder.nominatim()
        const permissionStatus = await getPermission()
        switch (permissionStatus.state) {
            case "granted":
                navigator.geolocation.getCurrentPosition(async (position) => {
                    onLocationAccess(position)
                    const result = await reverseSearch(user.marker._latlng)
                    if (result)
                        //schimba textul butonului de position cu numele locatiei 
                        btnPosition.textContent = result.name
                })
                break;
            case "denied":
                onLocationDenied()
            default:
                setMapView([defaultLat, defaultLng], 13)
                break;
        }
        pickup.element.focus()
    }


    function getPermission() {
        return navigator.permissions.query({ name: 'geolocation' }).then(permissionStatus => permissionStatus)
    }

    function initMap() {
        //map bounds to avoid gray margins
        const verticalBound = mapElement.offsetHeight * .5;
        const viewBounds = L.latLngBounds(L.latLng(-verticalBound, 300), L.latLng(verticalBound, -300));

        map = L.map('map', {
            zoom: 13,
            maxBounds: viewBounds,
            worldCopyJump: true
        }).setView([0, 0], 3)

        L.tileLayer('https://api.maptiler.com/maps/bright-v2/256/{z}/{x}/{y}.png?key=jZkKIah32WCkciSEKI2d', {
            minZoom: 3,
            maxZoom: 20,
            attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
        }).addTo(map)

        map.zoomControl.setPosition('bottomright')
    }

    function setMapView(center, zoom) {
        if (!map)
            initMap()
        map.setView(center, zoom)
    }

    function onLocationAccess(position) {
        const center = L.latLng(position.coords.latitude, position.coords.longitude)
        setMarker(user, center)
        const zoom = 17
        setMapView(center, zoom)
        const radius = 100000
        setSearchBounds(center, radius)
    }

    function onLocationDenied() {
        btnPosition.remove()
    }

    function setSearchBounds(center, radius) {
        const searchBounds = center.toBounds(radius)
        geocoder.options.geocodingQueryParams = {
            viewbox: searchBounds.toBBoxString(),
            bounded: 1
        }
    }

    function setMarker(input, center) {
        if (input.marker) {
            input.marker.setLatLng(center)
            if (!map.hasLayer(input.marker))
                input.marker.addTo(map)
        }
        else
            input.marker = L.marker(center).addTo(map)
    }
    function removeMarker(marker) {
        if (marker)
            marker.removeFrom(map)
    }

    function setLocation(input, location) {
        input.element.value = location.name
        input.location = location
        setMarker(input, location.center)
        isReady()
    }

    function createResult(result) {
        const item = document.createElement("div")
        item.classList.add("resultItem");
        if (result.icon) {
            const img = document.createElement("img");
            img.classList.add("icon");
            img.src = result.icon;
            item.appendChild(img);
        }
        const text = document.createTextNode(result.name);
        item.appendChild(text);
        return item
    }

    async function reverseSearch(center) {
        return await new Promise(resolve => {
            geocoder.reverse(center, 10, results => {
                resolve(results[0])
            })
        })
    }

    function setRoute(waypoints) {
        if (route) {
            route.setWaypoints(waypoints)
            if (!map.hasLayer(route))
                route.addTo(map)
        }
        else
            route = L.Routing.control({
                waypoints: waypoints,
                draggableWaypoints: false,
                routeWhileDragging: false,
                addWaypoints: false,
                show: false,
                lineOptions: {
                    styles: [{ color: 'black' }]
                }
            }).addTo(map)
    }

    function isReady() {
        if (pickup.location && destination.location) {
            //display ubers
            resultList.innerHTML = 'Fotbal'
            setRoute([pickup.location.center, destination.location.center])
        }
    }

    const inputSearch = (input) => {
        resultList.innerHTML = ''
        geocoder.geocode(input.element.value, results => {
            results.forEach(result => {
                const item = createResult(result)
                item.addEventListener('click', () => {
                    input.element.blur()
                    resultList.innerHTML = ''
                    setMapView(result.center, 17)
                    setLocation(input, result)
                })
                resultList.appendChild(item)
            })
        })
    }
    //#endregion

    //code
    init()

    map.addEventListener('click', async (e) => {
        if (!setPoint.canSet) return
        setMarker(setPoint, [e.latlng.lat, e.latlng.lng])
        const result = await reverseSearch(setPoint.marker._latlng)
        //schimba textul butonului de set cu numele locatiei
        if (!result) return
        btnSet.textContent = result.name
    })

    btnPosition.addEventListener('click', () => {
        navigator.geolocation.getCurrentPosition(async (position) => {
            onLocationAccess(position)
            const result = await reverseSearch(user.marker._latlng)
            if (!result) return
            setLocation(pickup, result)
            removeMarker(pickup.marker)
            //schimba textul butonului de position cu numele locatiei 
            btnPosition.textContent = result.name
        })
    })

    btnSet.addEventListener('click', () => {
        setPoint.canSet = true
        resultList.innerHTML = ''
        title.textContent = 'Choose your pickup location'
        buttonContainer.classList.remove('hidden')
        inputContainer.classList.add('hidden')
        btnPosition.classList.add('hidden')
    })

    btnCancel.addEventListener('click', () => {
        setPoint.canSet = false
        removeMarker(setPoint.marker)
        buttonContainer.classList.add('hidden')
        inputContainer.classList.remove('hidden')
        lastInput.element.focus()
        //resetezi textul de pe butonul de set
        btnSet.textContent = 'Set location on map'
    })

    btnConfirm.addEventListener('click', async () => {
        setPoint.canSet = false
        removeMarker(setPoint.marker)
        buttonContainer.classList.add('hidden')
        if (setPoint.marker) {
            const result = await reverseSearch(setPoint.marker._latlng)
            if (result)
                setLocation(lastInput, result)
        }
        inputContainer.classList.remove('hidden')
        //resetezi textul de pe butonul de set
        btnSet.textContent = 'Set location on map'
    })

    pickup.element.addEventListener('focus', () => {
        lastInput = pickup
        btnPosition.classList.remove('hidden')
        title.textContent = 'Where can we pick you up?'
        inputSearch(pickup)
    })

    destination.element.addEventListener('focus', () => {
        lastInput = destination
        btnPosition.classList.add('hidden')
        title.textContent = 'Where to?'
        inputSearch(destination)
    })

    pickup.element.addEventListener('keyup', () => {
        inputSearch(pickup)
    })

    destination.element.addEventListener('keyup', () => {
        inputSearch(destination)
    })

}