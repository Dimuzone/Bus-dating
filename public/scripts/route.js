// Setting variables for elements to be changed later
const search = document.getElementById("search-bar")
const stationWrap = document.getElementById("stations")
const swapClick = document.getElementById("swap")
const routeName = document.getElementById("route")
const directionStart = document.getElementById("starting")
const directionEnd = document.getElementById("ending")

// Set an initial route for the first route the user chose
let initialRoute = {
  id: sessionStorage.getItem("route"),
  name: sessionStorage.getItem("endingStation"),
  path: sessionStorage.getItem("stations_Id").split(",").map(Number),
  stations: null
}

// For storing the reverse option of the route
let reverseRoute = {
  id: null,
  name: null,
  path: null,
  stations: null
}

// Set the current route to be the initial route
let  currentRoute = initialRoute

// get the route information from the database
async function getRoute(route) {
  let stationsArray = []
  if(route.path == null) {
    let path = await db.collection("routes").doc(route.id).get()
    route.path = path.data().path
    route.name = path.data().name
  }
  for (let i = 0; i < route.path.length; i += 10) {
    let chunk = route.path.slice(i, i + 10)
    let col = await db.collection("stations").where("id", "in", chunk).get()
    col.forEach(doc => stationsArray.push(doc.data()))
  }
  stationsArray.sort((a, b) => route.path.indexOf(a.id) - route.path.indexOf(b.id))
  route.stations = stationsArray
  return route
}

// The main function for rendering the page with stations
main()
async function main() {
  initialRoute = await getRoute(initialRoute)
  render(initialRoute.stations)
  search.oninput = _ => {
    let stations = initialRoute.stations.filter(station =>
      station.id.toString().includes(search.value)
      || station.name.toLowerCase().includes(search.value.toLowerCase())
    )
    render(stations)
  }
  swapClick.onclick = onSwap
}

// The function for when the user clicks the swap button
async function onSwap() {
  if (currentRoute == initialRoute) {
    if (reverseRoute.stations == null) {
      char = initialRoute.id[initialRoute.id.length -1]
      let newRoute = initialRoute.id.slice(0, -1) + swapChar(char)
      reverseRoute.id = newRoute
      reverseRoute = await getRoute(reverseRoute)
    }
    currentRoute = reverseRoute
  } else {
      currentRoute = initialRoute
  }
  routeName.innerText = "Route " + currentRoute.id
  render(currentRoute.stations)
}

// Calling the render station function to re-arrange the page.
function render(stations) {
  patch(stationWrap, div({ id: "stations" }, stations.map(renderStation)))
}

// Function used for swapping West with East and North with South
function swapChar(char) {
  switch(char) {
    case "W" : return "E"
    case "E" : return "W"
    case "S" : return "N"
    case "N" : return "S"
  } 
}

routeName.innerText = "Route " + initialRoute.id

// Changing the html with the data gotten
function renderStation(station) {
  let startIndex = currentRoute.stations[0].name
  let ending = currentRoute.name
  let [start, end] = startIndex.split(" @ ")
  let [ubc, exchange] = start.split(" Exchange")

  directionStart.innerText = (start.startsWith("UBC") ? ubc : start)
  directionEnd.innerText = ending

  function onclick() {
    let index = currentRoute.path.indexOf(station.id)
    let before = currentRoute.stations[index - 1].name
    let after = currentRoute.stations[index + 1].name

    sessionStorage.setItem("after", after)
    sessionStorage.setItem("before", before)
    sessionStorage.setItem("stationId", station.id)
    sessionStorage.setItem("stationName", station.name)
    sessionStorage.setItem("route", currentRoute.id)
    location.href = "station.html"
  }

  let [on, at] = station.name.split(" @ ")
  let text = at.startsWith("Bay") ? on : at
  let subtext = station.id + " · " + (at.startsWith("Bay") ? at : on)

    return div({ class: "option", onclick: onclick }, [
      div({ class: "option-data"}, [
      p({ class: "option-text" }, text),
      div({ class: "option-subtext"},  subtext),
      ]),
      span({ class: "option-icon material-icons"}, "chevron_right")
    ])
  }