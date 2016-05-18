function RequestURL(url)
{
	return new Promise ((resolve, reject) =>
	{
		var request = new XMLHttpRequest()
		request.open("GET", url)

		request.onload = () => 
		{
			if (request.status === 200)
			{
				resolve(request.response)
			}
			else
			{
				reject(Error(request.statusText))
			}
		}

		request.onerror = () => {reject(Error("Network Error"))}

		request.send()
	})
}

function RequestLocationFromRemoteService()
{
	return RequestURL("https://location.services.mozilla.com/v1/geolocate?key=test")
}

function RequestLocationNameFromRemoteService(lat, lon)
{
	let url = " http://nominatim.openstreetmap.org/reverse?format=json&lat=" + lat + "&lon=" + lon + "&zoom=18&addressdetails=1"
	
	return RequestURL(url)	
}


function RequestLocationFromBrowser ()
{
	return new Promise( (resolve, reject) =>
	{
		if ("geolocation" in navigator)
		{
			navigator.geolocation.getCurrentPosition(resolve)
		}
		else
	 	{
	 		reject(Error("No Geolocation"))
	 	}
	}
	)	
}