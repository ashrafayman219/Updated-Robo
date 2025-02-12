let displayMap;
let view;
let startingAddressName;
let endingAddressName;
let reportroutingdata;
let tripData;
let startTime;
let startDate;
let endTime;
let endDate;
let amount;

let routeGeometry;
let directions;



function loadModule(moduleName) {
  return new Promise((resolve, reject) => {
    require([moduleName], (module) => {
      if (module) {
        resolve(module);
      } else {
        reject(new Error(`Module not found: ${moduleName}`));
      }
    }, (error) => {
      reject(error);
    });
  });
}

async function initializeRoboApp() {
  try {
    const [
      esriConfig,
      Map,
      MapView,
      locator,
      Graphic,
      Popup,
      Directions,
      RouteLayer,
      LayerList,
      reactiveUtils,
      Search,
      RouteParameters,
      GraphicsLayer,
      route,
      FeatureSet,
      Track,
      geometryEngine,
      Point,
      Polyline,
      networkService
    ] = await Promise.all([
      loadModule("esri/config"),
      loadModule("esri/Map"),
      loadModule("esri/views/MapView"),
      loadModule("esri/rest/locator"),
      loadModule("esri/Graphic"),
      loadModule("esri/widgets/Popup"),
      loadModule("esri/widgets/Directions"),
      loadModule("esri/layers/RouteLayer"),
      loadModule("esri/widgets/LayerList"),
      loadModule("esri/core/reactiveUtils"),
      loadModule("esri/widgets/Search"),
      loadModule("esri/rest/support/RouteParameters"),
      loadModule("esri/layers/GraphicsLayer"),
      loadModule("esri/rest/route"),
      loadModule("esri/rest/support/FeatureSet"),
      loadModule("esri/widgets/Track"),
      loadModule("esri/geometry/geometryEngine"),
      loadModule("esri/geometry/Point"),
      loadModule("esri/geometry/Polyline"),
      loadModule("esri/rest/networkService"),
    ]);

    // esriConfig.apiKey =
    //   "AAPKd7015c5bd40549d198ed7d592cc9f099sF9QSR2iGaKrU1mqQiqbldbvIDTUExU25VIJ0aLx4-8HCA0ph5T9hTJRvTI-J_DX"; // Will change it

    esriConfig.apiKey =
      "AAPK756f006de03e44d28710cb446c8dedb4rkQyhmzX6upFiYPzQT0HNQNMJ5qPyO1TnPDSPXT4EAM_DlQSj20ShRD7vyKa7a1H";
    let apiKey = "AAPK756f006de03e44d28710cb446c8dedb4rkQyhmzX6upFiYPzQT0HNQNMJ5qPyO1TnPDSPXT4EAM_DlQSj20ShRD7vyKa7a1H";

    const routeUrl =
      "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";
    const routeLayer = new GraphicsLayer();
    const routeParams = new RouteParameters({
      // An authorization string used to access the routing service
      apiKey:
        "AAPK756f006de03e44d28710cb446c8dedb4rkQyhmzX6upFiYPzQT0HNQNMJ5qPyO1TnPDSPXT4EAM_DlQSj20ShRD7vyKa7a1H",
      stops: new FeatureSet(),
      outSpatialReference: {
        // autocasts as new SpatialReference()
        wkid: 3857,
      },
      // travelMode: "Driving Time"
    });

    // Obtain the routing service's description. The description contains all preset travel modes.
    const serviceDescription = await networkService.fetchServiceDescription(routeUrl, apiKey);
    console.log(serviceDescription, "serviceDescription");

    const stopSymbol = {
      type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
      style: "cross",
      size: 15,
      outline: {
        // autocasts as new SimpleLineSymbol()
        width: 4,
      },
    };

    const routeSymbol = {
      type: "simple-line", // autocasts as SimpleLineSymbol()
      color: [0, 0, 255, 0.5],
      width: 5,
    };


    const timePickerend = document.getElementById("timePickerend");
    const timePickerstart = document.getElementById("timePickerstart");
    const datePickerstart = document.getElementById("datePickerstart");
    const datePickerend = document.getElementById("datePickerend");
    const tripAmount = document.getElementById("tripAmount");
    const searchWidgetContainer = document.getElementById(
      "searchWidgetContainer"
    );
    const searchWidgetContainer2 = document.getElementById(
      "searchWidgetContainer2"
    );

    displayMap = new Map({
      basemap: "arcgis-light-gray", //Basemap styles service
      // basemap: "arcgis/navigation", //Basemap styles service
      layers: [routeLayer],
    });

    view = new MapView({
      container: "displayMap",
      map: displayMap,
      center: [4.46, 50.50],
      zoom: 2,
      padding: {
        top: 55,
      },
      constraints: {
        snapToZoom: false,
      },
      popup: new Popup({
        dockEnabled: true,
        dockOptions: {
          position: "bottom-left",
          buttonEnabled: false,
          breakpoint: false,
        },
      }),
    });

    searchWidget = new Search({
      view: view,
      searchTerm: "THE HOTEL",
      container: searchWidgetContainer,
      // allPlaceholder: "Enter addresswwwwwwwwwwwwwww or place"
    });

    searchWidget2 = new Search({
      view: view,
      // searchTerm: "THE HOTEL",
      container: searchWidgetContainer2,
      // allPlaceholder: "Enter addresswwwwwwwwwwwwwww or place"
    });
    // view.ui.add(searchWidget, "bottom-left");

    searchWidget.on("select-result", function (event) {
      console.log("The selected search result: ", event.result);
      startingAddressName = event.result;
      // document.getElementById("startTripButton").setAttribute("disabled", "true");
      document.getElementById("timePickerstart").disabled = false;
      document.getElementById("datePickerstart").disabled = false;
      console.log("startingAddressName: ", startingAddressName);
    });

    searchWidget2.on("select-result", function (event) {
      console.log("The selected search result222222222: ", event.result);
      endingAddressName = event.result;
      document.getElementById("startTripButton").disabled = false;
      document.getElementById("timePickerend").disabled = false;
      document.getElementById("datePickerend").disabled = false;
      console.log("endingAddressName: ", endingAddressName);
    });

        // Event listeners for date and time pickers
        timePickerstart.addEventListener('calciteInputChange', (event) => {
          startTime = event.target.value;
        });
    
        datePickerstart.addEventListener('calciteInputDatePickerChange', (event) => {
          startDate = event.target.value;
        });
    
        timePickerend.addEventListener('calciteInputChange', (event) => {
          endTime = event.target.value;
        });
    
        datePickerend.addEventListener('calciteInputDatePickerChange', (event) => {
          endDate = event.target.value;
        });

        tripAmount.addEventListener('calciteInputChange', (event) => {
          amount = event.target.value;
        });

    async function startTrip(startingAddressName, endingAddressName) {
      console.log("Starting trip from:", startingAddressName, "to:", endingAddressName);
      // Add logic for starting the trip using the ArcGIS Directions or other related services

      if (startingAddressName && endingAddressName) {
        console.log("endingAddressName: ", endingAddressName);

        const stop11 = new Graphic({
          geometry: startingAddressName.feature.geometry,
          symbol: stopSymbol,
        });

        const stop12 = new Graphic({
          geometry: endingAddressName.feature.geometry,
          symbol: stopSymbol,
        });
        routeLayer.add(stop11);
        routeLayer.add(stop12);

        // Execute the route if 2 or more stops are input
        routeParams.stops.features.push(stop11);
        routeParams.stops.features.push(stop12);
        // routeParams.outSpatialReference = { wkid: 3857 };
        routeParams.returnDirections = true;


        // if (routeParams.stops.features.length >= 2) {
        //   route.solve(routeUrl, routeParams).then(showRoute);
        // }

        // function showRoute(data) {
        //   console.log(data, "data");
        //   reportroutingdata = data;
        //   const routeResult = data.routeResults[0].route;
        //   routeResult.symbol = routeSymbol;
        //   routeLayer.add(routeResult);
          
        // }

        if (routeParams.stops.features.length >= 2) {
          try {
            const data = await route.solve(routeUrl, routeParams);
            tripData = data;

            // Assuming you have a routeResult from the route.solve() method
            routeGeometry = data.routeResults[0].route.geometry;
            directions = tripData.routeResults[0].directions;

            const routeResult = data.routeResults[0].route;
            routeResult.symbol = routeSymbol;
            routeLayer.add(routeResult);
            return data; // Return the routing data
          } catch (error) {
            console.error("Error solving route:", error);
          }
        }
      }
    }




    let trackWidget = new Track({
      view: view
    });
    
    view.ui.add(trackWidget, "top-left");


// Conversion factor from miles to kilometers
const MILES_TO_KILOMETERS = 1.60934;

// Track the driver's position
trackWidget.on("track", ({ position }) => {
  const { longitude, latitude } = position.coords;
  const currentPosition = new Point({ longitude, latitude, spatialReference: { wkid: 3857 } });

  // Find the closest direction segment to the current position
  let closestSegmentIndex = -1;
  let minDistance = Infinity;

  directions.features.forEach((direction, index) => {
    const segmentGeometry = direction.geometry;
    const distance = geometryEngine.distance(currentPosition, segmentGeometry, "kilometers");
    if (distance < minDistance) {
      minDistance = distance;
      closestSegmentIndex = index;
    }
  });

  if (closestSegmentIndex !== -1) {
    // Calculate remaining distance and time from the closest segment to the end
    let remainingDistance = 0;
    let remainingTime = 0;

    for (let i = closestSegmentIndex; i < directions.features.length; i++) {
      const direction = directions.features[i];
      // Convert distance from miles to kilometers
      remainingDistance += direction.attributes.length * MILES_TO_KILOMETERS;
      remainingTime += direction.attributes.time;
    }

    // Update UI
    document.getElementById("remainingDistance").innerText = `Remaining Distance: ${remainingDistance.toFixed(2)} km`;
    document.getElementById("remainingTime").innerText = `Remaining Time: ${remainingTime.toFixed(2)} minutes`;
  } else {
    // Handle case where no valid segment is found
    document.getElementById("remainingDistance").innerText = `Remaining Distance: 0 km`;
    document.getElementById("remainingTime").innerText = `Remaining Time: 0 minutes`;
  }
});



    
    function generateReportData(tripData) {
      if (!tripData) {
        return 'No trip data available.';
      }

      return `
        <h3>Trip Report</h3>
        <p>From: ${startingAddressName.name}</p>
        <p>To: ${endingAddressName.name}</p>
        <p>Start Date: ${startDate}</p>
        <p>Start Time: ${startTime}</p>
        <p>End Date: ${endDate}</p>
        <p>End Time: ${endTime}</p>
        <p>Trip amount: ${amount}</p>
        <p>Distance: ${tripData.routeResults[0].route.attributes.Total_Kilometers.toFixed(2)} kilometers</p>
        <p>Duration: ${tripData.routeResults[0].route.attributes.Total_TravelTime.toFixed(2)} minutes</p>
      `;
    }

    function sendInvoiceTrip(tripData) {
      // Get the current server's URL
      // const baseUrl = window.location.origin;
      const baseUrl = window.location.origin + window.location.pathname;
      const newUrl = `${baseUrl}/submit?from=${encodeURIComponent(startingAddressName.name)}&to=${encodeURIComponent(endingAddressName.name)}&startDate=${encodeURIComponent(startDate)}&startTime=${encodeURIComponent(startTime)}&endDate=${encodeURIComponent(endDate)}&endTime=${encodeURIComponent(endTime)}&amount=${encodeURIComponent(amount)}&distance=${encodeURIComponent(tripData.routeResults[0].route.attributes.Total_Kilometers.toFixed(2))}&time=${encodeURIComponent(tripData.routeResults[0].route.attributes.Total_TravelTime.toFixed(2))}`;
      console.log(newUrl);
      // history.pushState(null, '', newUrl);
      // Open the new URL in a new tab
      window.open(newUrl, 'invoicePage');
    }

    function showReport(tripData) {
      document.getElementById('reportContent').innerHTML = generateReportData(tripData);
      document.getElementById('reportContainer').classList.remove('hidden');
    }

    function exitReport() {
      console.log("Exit button clicked");
      document.getElementById('reportContainer').classList.add('hidden');
    }

    document.getElementById("startTripButton").addEventListener("click", async () => {
      document.getElementById("generateReportButton").removeAttribute("disabled");
      const tripData = await startTrip(startingAddressName, endingAddressName);
      if (tripData) {
        console.log("Trip data:", tripData);
        view.goTo(
          {
            target: tripData.routeResults[0].route.geometry,
          },
          {
            duration: 1500,
          }
        );
        document.getElementById("endTripButton").disabled = false;
      }
    });

    function endtripBookFunction(tripData) {
      pickupadd = startingAddressName.name;
      dropoffadd = endingAddressName.name;
      dist = tripData.routeResults[0].route.attributes.Total_Kilometers.toFixed(2);
      time = tripData.routeResults[0].route.attributes.Total_TravelTime.toFixed(2);
      book(pickupadd , 
        dropoffadd , 
        amount , 
        dist , 
        time);
      view.graphics.removeAll();
      routeLayer.graphics.removeAll();
      view.goTo({
        target: view.center,
        zoom: 2
      });
      searchWidget.clear();
      searchWidget2.clear();
      timePickerstart.value = "";
      datePickerstart.value = "";
      timePickerend.value = "";
      datePickerend.value = "";
      tripAmount.value = "";
      document.getElementById("timePickerstart").disabled = true;
      document.getElementById("datePickerstart").disabled = true;
      document.getElementById("startTripButton").disabled = true;
      document.getElementById("timePickerend").disabled = true;
      document.getElementById("datePickerend").disabled = true;
      document.getElementById("generateReportButton").disabled = true;
    }

    document.getElementById('endTripButton').addEventListener('click', () => endtripBookFunction(tripData));

    document.getElementById('generateReportButton').addEventListener('click', () => showReport(tripData));
    // document.getElementById('viewInvoiceButton').addEventListener('click', () => sendInvoiceTrip(tripData));
    document.getElementById('exitReportButton').addEventListener('click', exitReport);

    document.getElementById('startNewTripButton').addEventListener('click', () => {
      document.getElementById('reportContainer').classList.add('hidden');
      view.graphics.removeAll();
      routeLayer.graphics.removeAll();
      view.goTo({
        target: view.center,
        zoom: 2
      });
      searchWidget.clear();
      searchWidget2.clear();
      timePickerstart.value = "";
      datePickerstart.value = "";
      timePickerend.value = "";
      datePickerend.value = "";
      document.getElementById("timePickerstart").disabled = true;
      document.getElementById("datePickerstart").disabled = true;
      document.getElementById("timePickerend").disabled = true;
      document.getElementById("datePickerend").disabled = true;
      document.getElementById("startTripButton").disabled = true;
      document.getElementById("endTripButton").disabled = true;
      document.getElementById("generateReportButton").disabled = true;
    });


    await view.when();





    // document.getElementById("generateReportButton").addEventListener("click", () => {
    //   generateReport();
    // });

    //add widgets
    addWidgets()
      .then(([view, displayMap]) => {
        console.log(
          "Widgets Returned From Require Scope",
          view,
          displayMap,
          featureLayer
        );
        // You can work with the view object here
      })
      .catch((error) => {
        // Handle any errors here
      });

    return [view, displayMap]; // You can return the view object
  } catch (error) {
    console.error("Error initializing map:", error);
    throw error; // Rethrow the error to handle it further, if needed
  }
}



// calling
initializeRoboApp()
  .then(() => {
    console.log("Map Returned From Require Scope", view, displayMap);
    // You can work with the view object here
  })
  .catch((error) => {
    // Handle any errors here
  });

async function addWidgets() {
  try {
    // await initializeMap();

    const [BasemapGallery, Expand, ScaleBar, Search, Home, BasemapToggle] = await Promise.all([
      loadModule("esri/widgets/BasemapGallery"),
      loadModule("esri/widgets/Expand"),
      loadModule("esri/widgets/ScaleBar"),
      loadModule("esri/widgets/Search"),
      loadModule("esri/widgets/Home"),
      loadModule("esri/widgets/BasemapToggle"),
    ]);

    var basemapGallery = new BasemapGallery({
      view: view,
    });

    var Expand22 = new Expand({
      view: view,
      content: basemapGallery,
      expandIcon: "basemap",
      group: "top-right",
      // expanded: false,
      expandTooltip: "Open Basmap Gallery",
      collapseTooltip: "Close",
    });
    view.ui.add([Expand22], { position: "top-left", index: 6 });

    var scalebar = new ScaleBar({
      view: view,
      unit: "metric",
    });
    view.ui.add(scalebar, "bottom-right");

    var search = new Search({
      //Add Search widget
      view: view,
      // sources: [{
      //   // placeholder: "Enter your Starting Location/Address",
      // }
      // ],
      // allPlaceholder: "Enter your Starting Location/Address",
    });

    // console.log(search, "OOO");
    // search.placeholder = "Enter your Starting Location/Address";
    // view.ui.add(search, { position: "top-left", index: 0 }); //Add to the map

    var homeWidget = new Home({
      view: view,
    });
    view.ui.add(homeWidget, "top-left");

        // 1 - Create the widget
        const toggle = new BasemapToggle({
          // 2 - Set properties
          view: view, // view that provides access to the map's 'topo-vector' basemap
          nextBasemap: "hybrid", // allows for toggling to the 'hybrid' basemap
        });
        // Add widget to the top right corner of the view
        view.ui.add(toggle, "top-left");

    await view.when();

    return [view, displayMap]; // You can return the view object
  } catch (error) {
    console.error("Error initializing map:", error);
    throw error; // Rethrow the error to handle it further, if needed
  }
}
