window.onload = function () {
    let mapElement = document.getElementById('map')
    let btnPosition = document.getElementById('btnPosition')
    let btnSet = document.getElementById('btnSet')
    let title = document.getElementById('title')
    let pickupElement = document.getElementById('pickup')
    let destinationElement = document.getElementById('destination')
    let resultList = document.getElementById('results')
    let buttonContainer = document.getElementById('buttonContainer')
    let btnConfirm = document.getElementById('btnConfirm')
    let btnCancel = document.getElementById('btnCancel')
    let inputContainer = document.getElementById('inputContainer')
    let currentSetMarker = null
    let positionMarker = null
    let map = null
    let geocoder = null
    let canSet = false
    let currentPosition = null
    let searchBounds = null
    let lastInput = null
    let pickupMarker = null
    let destinationMarker = null
    let pickupSet = false
    let destinationSet = false

    //coordinates for Uber HQ
    const defaultLat = 37.7749
    const defaultLng = -122.4194


    //#region functions
    async function init() {
        initMap()
        geocoder = L.Control.Geocoder.nominatim()
        let permissionStatus = await getPermission()
        switch (permissionStatus.state) {
            case "granted":
                navigator.geolocation.getCurrentPosition((position) => {
                    onLocationAccess(position)
                    if (btnPosition)
                        geocoder.reverse(positionMarker._latlng, 10, result => {
                            //schimba textul butonului de position cu numele locatiei 
                            btnPosition.textContent = result[0].name
                        })
                })
                break;
            case "denied":
                onLocationDenied()
            default:
                setMapView(defaultLat, defaultLng, 13)
                break;
        }
        pickupElement.focus()
    }


    function getPermission() {
        return navigator.permissions.query({ name: 'geolocation' }).then(permissionStatus => permissionStatus)
    }

    function initMap() {
        //map bounds to avoid gray margins
        let verticalBound = mapElement.offsetHeight * .5;
        let viewBounds = L.latLngBounds(L.latLng(-verticalBound, 300), L.latLng(verticalBound, -300));

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

    function setMapView(lat, lng, zoom) {
        if (!map)
            initMap()
        map.setView([lat, lng], zoom)
    }

    function onLocationAccess(position) {
        setPositionMarker(position)
        let zoom = 17
        setMapView(position.coords.latitude, position.coords.longitude, zoom)
        let radius = 100000
        setSearchBounds(position.coords.latitude, position.coords.longitude, radius)
    }

    function onLocationDenied() {
        btnPosition.remove()
    }

    function setSearchBounds(lat, lng, radius) {
        let center = L.latLng(lat, lng)
        searchBounds = center.toBounds(radius)
        geocoder.options.geocodingQueryParams = {
            viewbox: searchBounds.toBBoxString(),
            bounded: 1
        }
    }

    function setPositionMarker(position) {
        if (positionMarker)
            positionMarker.removeFrom(map)
        positionMarker = L.marker([position.coords.latitude, position.coords.longitude]).addTo(map)
    }

    function createResult(result) {
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
        return item
    }

    function isReady(input) {
        if (input === pickupElement)
            pickupSet = true
        else
            destinationSet = true
        if (pickupSet && destinationSet) {
            resultList.innerHTML = 'Fotbal'
            let route = L.Routing.control({
                waypoints: [
                    L.latLng(57.74, 11.94),
                    L.latLng(57.6792, 11.949)
                ],
                draggableWaypoints: false,
                routeWhileDragging: false,
                addWaypoints: false,
                show: false,
                lineOptions: {
                    styles: [{ color: 'black' }]
                }
            }).addTo(map)
        }
    }

    const inputSearchHandler = (e) => {
        resultList.innerHTML = ''
        let input = e.target
        geocoder.geocode(input.value, results => {
            results.forEach(result => {
                let item = createResult(result)
                console.log(result)
                item.addEventListener('click', (e) => {
                    input.value = result.name
                    input.blur()
                    resultList.innerHTML = ''
                    setMapView(result.center.lat, result.center.lng, 17)
                    //depinde de lastInput
                    if (pickupMarker)
                        pickupMarker.removeFrom(map)
                    pickupMarker = L.marker(result.center).addTo(map)
                    isReady(input)
                })
                resultList.appendChild(item)
            })
        })
    }
    //#endregion

    //code
    init()

    map.addEventListener('click', (e) => {
        if (!canSet) return
        if (currentSetMarker)
            currentSetMarker.removeFrom(map)
        currentSetMarker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map)
        console.log(map)
        geocoder.reverse(currentSetMarker._latlng, 100, result => {
            //schimba textul butonului de set cu numele locatiei 
            btnSet.textContent = result[0].name
        })
    })

    btnPosition.addEventListener('click', () => {
        navigator.geolocation.getCurrentPosition((position) => {
            onLocationAccess(position)
            if (btnPosition)
                geocoder.reverse(positionMarker._latlng, 100, result => {
                    //schimba textul butonului de position cu numele locatiei 
                    btnPosition.textContent = result[0].name
                    pickupElement.value = result[0].name
                    isReady(lastInput)
                })
        })
    })

    btnSet.addEventListener('click', () => {
        canSet = true
        resultList.innerHTML = ''
        title.textContent = 'Choose your pickup location'
        buttonContainer.classList.remove('hidden')
        inputContainer.classList.add('hidden')
        btnPosition.classList.add('hidden')
    })

    btnCancel.addEventListener('click', () => {
        canSet = false
        if (currentSetMarker)
            currentSetMarker.removeFrom(map)
        buttonContainer.classList.add('hidden')
        inputContainer.classList.remove('hidden')
        lastInput.focus()
        //resetezi textul de pe butonul de set
        btnSet.textContent = 'Set location on map'
    })

    btnConfirm.addEventListener('click', () => {
        canSet = false
        if (currentSetMarker)
            currentSetMarker.removeFrom(map)
        buttonContainer.classList.add('hidden')
        //iei valoarea din butonul de set
        if (currentSetMarker)
            geocoder.reverse(currentSetMarker._latlng, 100, result => {
                //schimba textul butonului de set cu numele locatiei 
                lastInput.value = result[0].name
            })
        //resetezi textul de pe butonul de set
        inputContainer.classList.remove('hidden')
        //resetezi textul de pe butonul de set
        btnSet.textContent = 'Set location on map'
        isReady(lastInput)
    })

    pickupElement.addEventListener('focus', (e) => {
        lastInput = pickupElement
        btnPosition.classList.remove('hidden')
        title.textContent = 'Where can we pick you up?'
        inputSearchHandler(e)
    })

    destinationElement.addEventListener('focus', (e) => {
        lastInput = destinationElement
        btnPosition.classList.add('hidden')
        title.textContent = 'Where to?'
        inputSearchHandler(e)
    })

    pickupElement.addEventListener('keyup', (e) => {
        pickupSet = false
        inputSearchHandler(e)
    })

    destinationElement.addEventListener('keyup', (e) => {
        destinationSet = false
        inputSearchHandler(e)
    })

}