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

// Add these variables at the top of your script
let isRoutingInProgress = false;
let currentRoute = null;




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

// Function to save form data
function saveFormData() {
    const formData = {
        startAddress: startingAddressName ? {
            name: startingAddressName.name,
            geometry: startingAddressName.feature.geometry.toJSON()
        } : null,
        endAddress: endingAddressName ? {
            name: endingAddressName.name,
            geometry: endingAddressName.feature.geometry.toJSON()
        } : null,
        startTime: timePickerstart.value,
        startDate: datePickerstart.value,
        endTime: timePickerend.value,
        endDate: datePickerend.value,
        tripAmount: tripAmount.value
    };
    
    localStorage.setItem('roboMapFormData', JSON.stringify(formData));
}

// Simplify the openNavigation function to only handle Waze
function openNavigation(lat, lon) {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const wazeUrl = isMobile 
        ? `waze://?ll=${lat},${lon}&navigate=yes`
        : `https://www.waze.com/ul?ll=${lat},${lon}&navigate=yes`;

    // For mobile devices, try to open the app first
    if (isMobile) {
        window.location.href = wazeUrl;
        
        // Fallback to browser version after a short delay if app doesn't open
        setTimeout(() => {
            window.location.href = `https://www.waze.com/ul?ll=${lat},${lon}&navigate=yes`;
        }, 1000);
    } else {
        window.open(wazeUrl, '_blank');
    }
}

// Simplify the showNavigationModal function
function showNavigationModal(lat, lon) {
    try {
        const modal = document.getElementById('wazeModal');
        if (!modal) {
            console.error('Navigation modal not found');
            return;
        }

        const wazeBtn = document.getElementById('openWazeBtn');
        const cancelBtn = document.getElementById('cancelNavBtn');

        if (wazeBtn) {
            wazeBtn.onclick = () => {
                try {
                    openNavigation(lat, lon);
                    modal.open = false;
                } catch (error) {
                    console.error('Error opening Waze:', error);
                }
            };
        }

        if (cancelBtn) {
            cancelBtn.onclick = () => {
                modal.open = false;
            };
        }

        modal.open = true;
    } catch (error) {
        console.error('Error showing navigation modal:', error);
        alert('Unable to open navigation options. Please try again.');
    }
}
// Simplify the handleNavigationFromReport function
function handleNavigationFromReport() {
    if (!endingAddressName || !endingAddressName.feature) {
        console.error('No valid destination coordinates available');
        return;
    }

    const lat = endingAddressName.feature.geometry.latitude;
    const lon = endingAddressName.feature.geometry.longitude;
    openNavigation(lat, lon);
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
      networkService,
      SceneView,
      WebStyleSymbol
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
      loadModule("esri/views/SceneView"),
      loadModule("esri/symbols/WebStyleSymbol"),
    ]);

    // esriConfig.apiKey =
    //   "AAPKd7015c5bd40549d198ed7d592cc9f099sF9QSR2iGaKrU1mqQiqbldbvIDTUExU25VIJ0aLx4-8HCA0ph5T9hTJRvTI-J_DX"; // Will change it

    esriConfig.apiKey =
      "AAPK2744c6af7d1644909db94ae6f1e74313mCLYD9GMQ8L18zALxFQpXGr9lSTYYL_YtRt4cF-7-VoeaZxxD43ZAZV3Gg0stckS";
  
    let apiKey = "AAPK2744c6af7d1644909db94ae6f1e74313mCLYD9GMQ8L18zALxFQpXGr9lSTYYL_YtRt4cF-7-VoeaZxxD43ZAZV3Gg0stckS";
    
    const routeUrl =
      "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";
    const routeLayer = new GraphicsLayer();
    const routeParams = new RouteParameters({
      // An authorization string used to access the routing service
      apiKey:
        "AAPK2744c6af7d1644909db94ae6f1e74313mCLYD9GMQ8L18zALxFQpXGr9lSTYYL_YtRt4cF-7-VoeaZxxD43ZAZV3Gg0stckS",
      stops: new FeatureSet(),
      outSpatialReference: {
        // autocasts as new SpatialReference()
        wkid: 3857,
      },
    });



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
      locationEnabled: true,
      // searchTerm: "Add Starting Location",
      container: searchWidgetContainer,
      // allPlaceholder: "Enter addresswwwwwwwwwwwwwww or place"
    });

    searchWidget2 = new Search({
      view: view,
      locationEnabled: true,
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

      saveFormData();
    });


function waitForInternalButton(callback) {
  const interval = setInterval(() => {
    const shadowRoot01 = document.getElementById("startTripButton")?.shadowRoot;
    const shadowRoot02 = document.getElementById("generateReportButton")?.shadowRoot;
    const shadowRoot03 = document.getElementById("endTripButton")?.shadowRoot;

    const shadowRoot04 = document.getElementById("viewInvoiceButton")?.shadowRoot;
    const shadowRoot05 = document.getElementById("startNewTripButton")?.shadowRoot;
    const shadowRoot06 = document.getElementById("openWazeButton")?.shadowRoot;

    const innerButton01 = shadowRoot01?.querySelector('button');
    const innerButton02 = shadowRoot02?.querySelector('button');
    const innerButton03 = shadowRoot03?.querySelector('button');

    const innerButton04 = shadowRoot04?.querySelector('button');
    const innerButton05 = shadowRoot05?.querySelector('button');
    const innerButton06 = shadowRoot06?.querySelector('button');

    if (innerButton01, innerButton02, innerButton03, innerButton04, innerButton05, innerButton06) {
      clearInterval(interval);
      callback(innerButton01, innerButton02, innerButton03, innerButton04, innerButton05, innerButton06);
    }
  }, 50);
}

waitForInternalButton((innerButton01, innerButton02, innerButton03, innerButton04, innerButton05, innerButton06) => {
  innerButton01.style.borderRadius = '10px';
  innerButton01.style.backgroundColor = '#103225';
  innerButton01.style.color = '#f8fafc';

  innerButton02.style.borderRadius = '10px';
  innerButton02.style.backgroundColor = '#b7ed3b';
  innerButton02.style.color = '#1b3f1b';

  innerButton03.style.borderRadius = '10px';
  innerButton03.style.backgroundColor = '#b7ed3b';
  innerButton03.style.color = '#1b3f1b';

  innerButton04.style.borderRadius = '10px';
  innerButton04.style.backgroundColor = '#103225';
  innerButton04.style.color = '#f8fafc';

  innerButton05.style.borderRadius = '10px';
  innerButton05.style.backgroundColor = '#103225';
  innerButton05.style.color = '#f8fafc';

  innerButton06.style.borderRadius = '10px';
  innerButton06.style.backgroundColor = '#b7ed3b';
  innerButton06.style.color = '#1b3f1b';

  console.log("Modified internal button styles.");
});





    searchWidget2.on("select-result", function (event) {
      console.log("The selected search result222222222: ", event.result);
      endingAddressName = event.result;

      // Enable Waze button
      document.getElementById("openWazeButton").disabled = false;

      // Update your report actions event listeners
      document.getElementById('openWazeButton').addEventListener('click', () => {
          handleNavigationFromReport('waze');
      });

      document.getElementById("startTripButton").disabled = false;
      document.getElementById("timePickerend").disabled = false;
      document.getElementById("datePickerend").disabled = false;
      console.log("endingAddressName: ", endingAddressName);
      saveFormData();
    });



    // Event listeners for date and time pickers
    timePickerstart.addEventListener('calciteInputChange', (event) => {
      startTime = event.target.value;
      saveFormData();
    });

    datePickerstart.addEventListener('calciteInputDatePickerChange', (event) => {
      startDate = event.target.value;
      saveFormData();
    });

    timePickerend.addEventListener('calciteInputChange', (event) => {
      endTime = event.target.value;
      saveFormData();
    });

    datePickerend.addEventListener('calciteInputDatePickerChange', (event) => {
      endDate = event.target.value;
      saveFormData();
    });

    tripAmount.addEventListener('calciteInputChange', (event) => {
      amount = event.target.value;
      saveFormData();
    });

    async function startTrip(startingAddressName, endingAddressName) {
      // console.log("Starting trip from:", startingAddressName, "to:", endingAddressName);
      // // Add logic for starting the trip using the ArcGIS Directions or other related services

      // Prevent multiple clicks
      if (isRoutingInProgress) {
          return;
      }


          try {
        isRoutingInProgress = true;
        document.getElementById("startTripButton").disabled = true;

        // Clear existing route if any
        if (currentRoute) {
            routeLayer.removeAll();
            routeParams.stops.features = [];
        }

        if (startingAddressName && endingAddressName) {
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

            routeParams.stops.features.push(stop11);
            routeParams.stops.features.push(stop12);
            routeParams.returnDirections = true;

            if (routeParams.stops.features.length >= 2) {
                try {
                    const data = await route.solve(routeUrl, routeParams);
                    tripData = data;

                    routeGeometry = data.routeResults[0].route.geometry;
                    directions = tripData.routeResults[0].directions;

                    const routeResult = data.routeResults[0].route;
                    routeResult.symbol = routeSymbol;
                    routeLayer.add(routeResult);
                    currentRoute = routeResult;

                    // Show navigation modal
                    if (endingAddressName && endingAddressName.feature) {
                        const lat = endingAddressName.feature.geometry.latitude;
                        const lon = endingAddressName.feature.geometry.longitude;
                        showNavigationModal(lat, lon);
                    }

                    // Enable other relevant buttons
                    document.getElementById("generateReportButton").disabled = false;
                    document.getElementById("endTripButton").disabled = false;

                    return data;
                } catch (error) {
                    console.error("Error solving route:", error);
                    alert("Error calculating route. Please try again.");
                }
            }
        }
    } finally {
        isRoutingInProgress = false;
    }



      // if (startingAddressName && endingAddressName) {
      //   console.log("endingAddressName: ", endingAddressName);

      //   const stop11 = new Graphic({
      //     geometry: startingAddressName.feature.geometry,
      //     symbol: stopSymbol,
      //   });

      //   const stop12 = new Graphic({
      //     geometry: endingAddressName.feature.geometry,
      //     symbol: stopSymbol,
      //   });
      //   routeLayer.add(stop11);
      //   routeLayer.add(stop12);

      //   // Execute the route if 2 or more stops are input
      //   routeParams.stops.features.push(stop11);
      //   routeParams.stops.features.push(stop12);
      //   // routeParams.outSpatialReference = { wkid: 3857 };
      //   routeParams.returnDirections = true;


      //   // if (routeParams.stops.features.length >= 2) {
      //   //   route.solve(routeUrl, routeParams).then(showRoute);
      //   // }

      //   // function showRoute(data) {
      //   //   console.log(data, "data");
      //   //   reportroutingdata = data;
      //   //   const routeResult = data.routeResults[0].route;
      //   //   routeResult.symbol = routeSymbol;
      //   //   routeLayer.add(routeResult);
          
      //   // }

      //   if (routeParams.stops.features.length >= 2) {
      //     try {
      //       const data = await route.solve(routeUrl, routeParams);
      //       tripData = data;

      //       // Assuming you have a routeResult from the route.solve() method
      //       routeGeometry = data.routeResults[0].route.geometry;
      //       directions = tripData.routeResults[0].directions;

      //       const routeResult = data.routeResults[0].route;
      //       routeResult.symbol = routeSymbol;
      //       routeLayer.add(routeResult);


      //           // Show navigation modal after route is calculated
      //           if (endingAddressName && endingAddressName.feature) {
      //               const lat = endingAddressName.feature.geometry.latitude;
      //               const lon = endingAddressName.feature.geometry.longitude;
                    
      //               // Use the new modal instead of confirm
      //               showNavigationModal(lat, lon);
      //           }

      //       return data; // Return the routing data
      //     } catch (error) {
      //       console.error("Error solving route:", error);
      //     }
      //   }




      // }
    }

    
        const webStyleSymbol = new WebStyleSymbol({
      name: "Tesla_P7",
      styleName: "EsriRealisticTransportationStyle"
    });

    let trackWidget = new Track({
      view: view,
            graphic: new Graphic({
        symbol: webStyleSymbol // or taxiSymbolFont if using font icon
      }),
            goToLocationEnabled: true,
      rotationEnabled: true
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
        if (!tripData) return 'No trip data available.';
        
        return `
            <div class="report-title" style="font-weight: 700; color: #103225; font-size: 24px; margin-bottom: -8px;">
                Trip Info
            </div>


            <div class="info-block">
                <strong>From:</strong>
                <p>${startingAddressName.name}</p>
            </div>

            <div class="info-block">
                <strong>To:</strong>
                <p>${endingAddressName.name}</p>
            </div>

            <div class="info-block">
                <strong>Start Date:</strong>
                <p>${startDate}</p>
            </div>

            <div class="info-block">
                <strong>Start Time:</strong>
                <p>${startTime}</p>
            </div>

            <div class="info-block">
                <strong>End Date:</strong>
                <p>${endDate}</p>
            </div>

            <div class="info-block">
                <strong>End Time:</strong>
                <p>${endTime}</p>
            </div>

            <div class="info-block">
                <strong>Trip Amount:</strong>
                <p>${amount}</p>
            </div>

            <div class="info-block">
                <strong>Distance:</strong>
                <p>${tripData.routeResults[0].route.attributes.Total_Kilometers.toFixed(2)} kilometers

                </p>
            </div>

            <div class="info-block">
                <strong>Duration:</strong>
                <p>${tripData.routeResults[0].route.attributes.Total_TravelTime.toFixed(2)} minutes
                </p>
            </div>
        `;
    }
    // <span class="remaining">(Remaining: ${remainingTime})</span>
    // <span class="remaining">(Remaining: ${remainingDistance})</span>


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
      // Hide the input container first
      document.getElementById('inputContainer').classList.add('hidden01');


      // Generate and set report content
      document.getElementById('reportContent').innerHTML = generateReportData(tripData);
      
      // Show report container with animation
      const reportContainer = document.getElementById('reportContainer');
      reportContainer.classList.remove('hidden');
      // Give small delay for the animation to work
      setTimeout(() => {
          reportContainer.classList.add('visible');
      }, 50);
    }

    function exitReport() {
      const reportContainer = document.getElementById('reportContainer');
      reportContainer.classList.add('hidden');
      // Show the input button again
      document.getElementById('showInputButton').classList.add('visible', 'pulsing');

      console.log("Exit button clicked");
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

      if (!tripData) {
        console.error("No trip data available");
        return;
      }

      try {
        pickupadd = startingAddressName.name;
        dropoffadd = endingAddressName.name;
        dist = tripData.routeResults[0].route.attributes.Total_Kilometers.toFixed(2);
        time = tripData.routeResults[0].route.attributes.Total_TravelTime.toFixed(2);
        
	   book(pickupadd , 
        dropoffadd , 
        amount , 
        dist , 
        time,startDate,startTime);
        
        // Reset map and view
        view.graphics.removeAll();
        routeLayer.graphics.removeAll();
        view.goTo({
          target: view.center,
          zoom: 2
        });

        // Reset form inputs
      searchWidget.clear();
      searchWidget2.clear();
      timePickerstart.value = "";
      datePickerstart.value = "";
      timePickerend.value = "";
      datePickerend.value = "";
      tripAmount.value = "";

          document.getElementById("remainingDistance").textContent = "";
    document.getElementById("remainingTime").textContent = "";

        // Reset route data
        currentRoute = null;
              routeLayer.removeAll();
        routeParams.stops.features = [];
        routeGeometry = null;
        directions = null;


        // Clear saved form data
        localStorage.removeItem('roboMapFormData');



        // Disable all buttons - Fixed the disabled variable issue
        document.getElementById("timePickerstart").disabled = true;
        document.getElementById("datePickerstart").disabled = true;
        document.getElementById("startTripButton").disabled = true;
        document.getElementById("timePickerend").disabled = true;
        document.getElementById("datePickerend").disabled = true;
        document.getElementById("generateReportButton").disabled = true;
        document.getElementById("endTripButton").disabled = true;
        document.getElementById("openWazeButton").disabled = true;

      } catch (error) {
          console.error("Error in endtripBookFunction:", error);
          alert("Error ending trip. Please try again.");
      }

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
      tripAmount.value = "";
      document.getElementById("timePickerstart").disabled = true;
      document.getElementById("datePickerstart").disabled = true;
      document.getElementById("timePickerend").disabled = true;
      document.getElementById("datePickerend").disabled = true;
      document.getElementById("startTripButton").disabled = true;
      document.getElementById("endTripButton").disabled = true;
      document.getElementById("generateReportButton").disabled = true;

      document.getElementById('showInputButton').classList.add('visible', 'pulsing');
    });


    await view.when();

    // Function to restore form data
async function restoreFormData(Point) {
    try {
        const savedData = localStorage.getItem('roboMapFormData');
        if (!savedData) return;

        const formData = JSON.parse(savedData);

        // Restore trip amount
        if (formData.tripAmount) {
            tripAmount.value = formData.tripAmount;
            amount = formData.tripAmount;
        }

        // Restore dates and times
        if (formData.startTime) {
            timePickerstart.value = formData.startTime;
            startTime = formData.startTime;
            timePickerstart.disabled = false;
        }

        if (formData.startDate) {
            datePickerstart.value = formData.startDate;
            startDate = formData.startDate;
            datePickerstart.disabled = false;
        }

        if (formData.endTime) {
            timePickerend.value = formData.endTime;
            endTime = formData.endTime;
            timePickerend.disabled = false;
        }

        if (formData.endDate) {
            datePickerend.value = formData.endDate;
            endDate = formData.endDate;
            datePickerend.disabled = false;
        }

        // Restore addresses
        if (formData.startAddress) {
            const startPoint = {
                name: formData.startAddress.name,
                feature: {
                    geometry: new Point(formData.startAddress.geometry)
                }
            };
            startingAddressName = startPoint;
            searchWidget.searchTerm = formData.startAddress.name;
            await searchWidget.search();
        }

        if (formData.endAddress) {
            const endPoint = {
                name: formData.endAddress.name,
                feature: {
                    geometry: new Point(formData.endAddress.geometry)
                }
            };
            endingAddressName = endPoint;
            searchWidget2.searchTerm = formData.endAddress.name;
            await searchWidget2.search();

            // Enable start trip button if both addresses are present
            if (startingAddressName) {
                document.getElementById("startTripButton").disabled = false;
            }
        }

        // If both addresses are present, recalculate the route
        if (startingAddressName && endingAddressName) {
            await startTrip(startingAddressName, endingAddressName);
        }
    } catch (error) {
        console.error('Error restoring form data:', error);
    }
}


    // Restore saved form data
    await restoreFormData(Point);




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

        // // 1 - Create the widget
        // const toggle = new BasemapToggle({
        //   // 2 - Set properties
        //   view: view, // view that provides access to the map's 'topo-vector' basemap
        //   nextBasemap: "hybrid", // allows for toggling to the 'hybrid' basemap
        // });
        // // Add widget to the top right corner of the view
        // view.ui.add(toggle, "top-left");

    await view.when();

    return [view, displayMap]; // You can return the view object
  } catch (error) {
    console.error("Error initializing map:", error);
    throw error; // Rethrow the error to handle it further, if needed
  }
}
