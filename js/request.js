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
  let url = "http://nominatim.openstreetmap.org/reverse?format=json&lat=" + lat + "&lon=" + lon + "&zoom=18&addressdetails=1"

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

//TODO (OS): Convert everything to work this way
var Flickr  = {

  // https://www.flickr.com/services/api/flickr.places.findByLatLon.html
  BASE_URL: "https://api.flickr.com/services/rest/?",

  RequestSearchByLatLong : function(lat, lng)
  {
    // let method = "flickr.places.findByLatLon"
    let method = "flickr.photos.search"
    let accuracy = 11 //dunno, let's try that?
    let sort = "interestingness-desc"
    let content_type = 1
    let geo_context = 2 //outdoors

    let url = Flickr.BASE_URL + "&method=" + method + "&lat=" + lat + "&lon=" + lng + "&accuracy=" + accuracy + "&sort=" + sort + "&content_type=" + content_type + "&privacy_filter=1" + Flickr.EPILOG
    return RequestURL(url).then(Flickr.StripResponse)
  },

  RequestGetInfo : function (id)
  {
    let method = "flickr.photos.getInfo"
    let url = Flickr.BASE_URL + "&method=" + method + "&photo_id=" + id + Flickr.EPILOG
    return RequestURL(url).then(Flickr.StripResponse)
  },

  RequestGetSizes : function (id)
  {
    let method = "flickr.photos.getSizes"
    let url = Flickr.BASE_URL + "&method=" + method + "&photo_id=" + id + Flickr.EPILOG
    return RequestURL(url).then(Flickr.StripResponse)
  },

  ConstructPhotoURL : function (id, size, server, farm, secret)
  {
    /*
    from https://www.flickr.com/services/api/misc.urls.html:

    https://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}.jpg
      or
    https://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}_[mstzb].jpg
      or
    https://farm{farm-id}.staticflickr.com/{server-id}/{id}_{o-secret}_o.(jpg|gif|png)
    */

    return "https://farm" + farm + ".staticflickr.com/" + server + "/" +  id + "_" + secret + "_" + size + ".jpg"
  },

  StripResponse : function(response)
  {
    return new Promise((resolve, reject) =>
  {
      let initial = "jsonFlickrApi("
      if (response.length < initial.length + 1)
      {
        reject(Error("illegal response"))
      }
      else if (response.substring(0, initial.length) === initial)
      {
        resolve(response.substring(initial.length, response.length - 1))
      }
      else
      {
        reject(Error("illegal response : " + response))
      }
    })

  },
}
