import rides from '../resources/data/rides.json' assert {type: 'json'}
import drivers from '../resources/data/drivers.json' assert {type: 'json'}



window.onload = function () {
    const title = document.getElementById('title')
    const description = document.getElementById('description')
    const inputContainer = document.getElementById('inputContainer')
    const locationBtns = document.getElementById('locationBtns')
    const btnPosition = document.getElementById('btnPosition')
    const btnSet = document.getElementById('btnSet')
    const resultList = document.getElementById('results')
    const confirmBtns = document.getElementById('confirmBtns')
    const btnRequest = document.getElementById('btnRequest')
    const btnConfirm = document.getElementById('btnConfirm')
    const btnCancel = document.getElementById('btnCancel')
    const mapElement = document.getElementById('map')
    let map = null
    let geocoder = null
    let lastInput = null
    let carIcon = null
    let driverRoute = null

    const pickup = {
        element: document.getElementById('pickup'),
        marker: null,
        location: null,
        icon: null
    }

    const destination = {
        element: document.getElementById('destination'),
        marker: null,
        location: null,
        icon: null
    }

    const setPoint = {
        marker: null,
        canSet: false,
        icon: null
    }

    const user = {
        marker: null,
        icon: null,
        order: {
            route: null,
            rideType: null,
            price: null
        }
    }

    //coordinates for Uber HQ
    const defaultLat = 37.7749
    const defaultLng = -122.4194


    //#region functions
    async function init() {
        initMap()
        geocoder = L.Control.Geocoder.nominatim()
        const permissionStatus = await getPermission()
        setMarkerIcons()
        switch (permissionStatus.state) {
            case "granted":
                navigator.geolocation.getCurrentPosition(async (position) => {
                    onLocationAccess(position)
                    spawnDrivers(L.latLng(position.coords.latitude, position.coords.longitude))
                    const result = await reverseSearch(user.marker._latlng)
                    if (result)
                        btnPosition.replaceChildren(createAddressResult(result));
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
        const verticalBound = mapElement.offsetHeight * .5;
        const viewBounds = L.latLngBounds(L.latLng(-verticalBound, 300), L.latLng(verticalBound, -300));

        map = L.map('map', {
            zoom: 13,
            maxBounds: viewBounds,
            worldCopyJump: true
        }).setView([0, 0], 3)
        // https://api.maptiler.com/maps/bright-v2/256/{z}/{x}/{y}.png?key=jZkKIah32WCkciSEKI2d
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
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
            input.marker = L.marker(center, { icon: input.icon })
                .addTo(map)
    }
    function removeMarker(marker) {
        if (marker)
            marker.removeFrom(map)
    }

    function setLocation(input, location) {
        input.element.value = location.name
        input.location = location
        setMarker(input, location.center)
        input.marker.bindTooltip(location.name, {
            permanent: true,
            direction: 'right'
        })
        isReady()
    }

    function getMarkerIcon(fileName, size) {
        return L.icon({
            iconUrl: `resources/icons/markers/${fileName}.png`,
            iconSize: [size, size],
            iconAnchor: [20, 20]
        })
    }

    function setMarkerIcons() {
        user.icon = getMarkerIcon('current', 16)
        destination.icon = getMarkerIcon('destination', 16)
        setPoint.icon = getMarkerIcon('marker', 32)
        pickup.icon = getMarkerIcon('pickup', 16)
        carIcon = getMarkerIcon('car', 32)
    }

    function createAddressResult(result) {
        const item = document.createElement("div")
        item.classList.add("resultItem");
        if (result.icon) {
            const img = document.createElement("img");
            img.classList.add("icon");
            img.src = result.icon;
            item.appendChild(img);
        }

        let addressContainer = parseAddressString(result.name);
        item.appendChild(addressContainer);

        return item;
    }

    function parseAddressString(addressItemsString) {
        let addressContainer = document.createElement('div');
        addressContainer.classList.add('address-container');

        let words = addressItemsString.toString().split(',');

        let streetAndName = words.splice(0, 2).reduce((words, word, ind) => (`${words}${ind != 0 ? "," : ""}${word}`), "");
        const address = document.createElement('p');
        address.classList.add("address");
        address.innerHTML = streetAndName;
        addressContainer.appendChild(address);

        //words[0] = words[0].slice(1); //remove the space in front of the first word
        let cityAndDistrict = words.splice(0, 2).reduce((words, word, ind) => (`${words}${ind != 0 ? "," : ""}${word}`), "");
        const city = document.createElement('p');
        city.classList.add("city");
        city.innerHTML = cityAndDistrict;
        addressContainer.appendChild(city);

        return addressContainer;
    }

    function createRideResult(result) {
        const item = document.createElement("div")
        item.classList.add("resultItem");
        if (result.icon) {
            const img = document.createElement("img");
            img.classList.add("icon");
            img.src = result.icon;
            item.appendChild(img);
        }
        const car = document.createElement('div');
        car.classList.add('car-name');
        car.innerHTML = result.name;
        item.appendChild(car);
        return item;
    }

    async function reverseSearch(center) {
        return await new Promise(resolve => {
            geocoder.reverse(center, 10, results => {
                resolve(results[0])
            })
        })
    }

    async function setRoute(waypoints) {
        return await new Promise(resolve => {

            if (user.order.route) {
                user.order.route.setWaypoints(waypoints)
                if (!map.hasLayer(user.order.route))
                    user.order.route.addTo(map)
                resolve()
            }
            else {
                user.order.route = L.Routing.control({
                    waypoints: waypoints,
                    draggableWaypoints: false,
                    routeWhileDragging: false,
                    addWaypoints: false,
                    show: false,
                    createMarker: () => { },
                    lineOptions: {
                        styles: [{ color: 'black' }]
                    }
                }).addTo(map).on('routeselected', () => resolve())
            }
        })
    }

    async function isReady() {
        if (!pickup.location || !destination.location) return;
        await setRoute([pickup.location.center, destination.location.center])
        resultList.innerHTML = ''
        const price = computePrice()
        rides.forEach(ride => {
            const item = createRideResult(ride)
            const text = document.createTextNode((price * ride.multiplier).toFixed(2) + ' ron');
            item.appendChild(text)
            resultList.appendChild(item)
            item.classList.add('ride')
            item.addEventListener('click', (event) => {
                user.order.type = ride.name;
                user.order.price = price * ride.multiplier;
                document.querySelectorAll('.ride.selectedRide').forEach(e => e.classList.remove("selectedRide"));
                item.classList.add("selectedRide");

            })
        })
        title.textContent = 'Choose a ride'
        toRequestView()
    }

    function computePrice() {
        if (!user.order.route) return
        const kmPrice = Math.random() * (5 - 3) + 3
        const basePrice = 10
        return user.order.route._selectedRoute.summary.totalDistance * .001 * kmPrice + basePrice
    }

    function toSetView() {
        description.classList.remove('hidden')
        inputContainer.classList.add('hidden')
        locationBtns.classList.add('hidden')
        confirmBtns.classList.remove('hidden')
    }

    function toMainView() {
        description.classList.add('hidden')
        inputContainer.classList.remove('hidden')
        locationBtns.classList.remove('hidden')
        confirmBtns.classList.add('hidden')
        btnRequest.classList.add('hidden')
    }

    function toRequestView() {
        locationBtns.classList.add('hidden')
        btnRequest.classList.remove('hidden')
    }

    function toPickupView() {
        btnPosition.classList.remove('hidden')
    }

    function toDestinationView() {
        btnPosition.classList.add('hidden')
    }

    function randomLocation(center) {
        const radius = 2000
        const bounds = center.toBounds(radius)
        const randomLat = bounds.getSouthWest().lat + Math.random() * (bounds.getNorthEast().lat - bounds.getSouthWest().lat);
        const randomLng = bounds.getSouthWest().lng + Math.random() * (bounds.getNorthEast().lng - bounds.getSouthWest().lng);
        return [randomLat, randomLng]
    }

    function spawnDrivers(center) {
        drivers.forEach(driver => {
            driver.location = randomLocation(center)
            driver.marker = L.marker(driver.location, { icon: carIcon }).addTo(map);
        })
    }

    const inputSearch = (input) => {
        resultList.innerHTML = ''
        geocoder.geocode(input.element.value, results => {
            results.forEach(result => {
                const item = createAddressResult(result)
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
        if (!result) return
        description.textContent = result.name
    })

    btnPosition.addEventListener('click', () => {
        navigator.geolocation.getCurrentPosition(async (position) => {
            onLocationAccess(position)
            const result = await reverseSearch(user.marker._latlng)
            if (!result) return
            removeMarker(user.marker)
            setLocation(pickup, result)
            btnPosition.replaceChildren(createAddressResult(result));
            if (drivers.some(driver => !driver.location))
                spawnDrivers(pickup.location.center)
        })
    })

    btnSet.addEventListener('click', () => {
        setPoint.canSet = true
        setPoint.marker = null
        resultList.innerHTML = ''
        const setTitle = lastInput === pickup ? 'Choose your pickup location' : 'Set your destination'
        title.textContent = setTitle
        toSetView()
    })

    btnCancel.addEventListener('click', () => {
        setPoint.canSet = false
        removeMarker(setPoint.marker)
        lastInput.element.focus()
        description.textContent = ''
        toMainView()
    })

    btnConfirm.addEventListener('click', async () => {
        setPoint.canSet = false
        removeMarker(setPoint.marker)
        description.textContent = ''
        toMainView()
        if (setPoint.marker) {
            const result = await reverseSearch(setPoint.marker._latlng)
            if (result)
                setLocation(lastInput, result)
        }
    })

    btnRequest.addEventListener('click', () => {
        if (!user.order.type) return
        title.textContent = 'Waiting for a driver'
        resultList.innerHTML = ''
        inputContainer.classList.add('hidden')
        btnRequest.classList.add('hidden')
        description.classList.remove('hidden')
        setTimeout(async () => {
            title.textContent = 'Get ready'
            const index = Math.floor(Math.random() * drivers.length)
            const driver = drivers[index]
            description.textContent = `${driver.name} will arrive shortly in a ${driver.car.color} ${driver.car.brand}.\n Look for ${driver.car.plate}`
            driverRoute = L.Routing.control({
                waypoints: [driver.location, pickup.location.center],
                draggableWaypoints: false,
                routeWhileDragging: false,
                addWaypoints: false,
                show: false,
                createMarker: () => { },
                lineOptions: {
                    styles: [{ color: 'black' }]
                }
            }).addTo(map).on('routeselected', () => {
                const driverItinerary = driverRoute._routes[0].coordinates
                let i = 0;
                setInterval(() => {
                    if (i < driverItinerary.length) {
                        driver.marker.setLatLng(driverItinerary[i]);
                        i++;
                    }
                }, 500);
                driver.marker.on('move', () => {
                    let userItinerary = user.order.route._routes[0].coordinates
                    if (driver.marker._latlng === driverItinerary[driverItinerary.length - 1]) {
                        title.textContent = 'Have a safe ride'
                        description.textContent = 'You will arrive shortly.'
                        let j = 0
                        setInterval(() => {
                            if (j < userItinerary.length) {
                                driver.marker.setLatLng(userItinerary[j]);
                                j++;
                            }
                        }, 500);
                    }
                    if (userItinerary)
                        if (driver.marker._latlng === userItinerary[userItinerary.length - 1]) {
                            title.textContent = 'You have arrived'
                            description.textContent = 'Thanks for using our service'
                        }
                })
            })
        }, 1000)
    })

    pickup.element.addEventListener('focus', () => {
        lastInput = pickup
        title.textContent = 'Where can we pick you up?'
        inputSearch(pickup)
        toMainView()
        toPickupView()
    })

    destination.element.addEventListener('focus', () => {
        lastInput = destination
        title.textContent = 'Where to?'
        inputSearch(destination)
        toMainView()
        toDestinationView()
    })

    pickup.element.addEventListener('keyup', () => {
        inputSearch(pickup)
    })

    destination.element.addEventListener('keyup', () => {
        inputSearch(destination)
    })

}