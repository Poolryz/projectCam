import axios from "axios";

axios.get("/server", {})
  .then(function(response) {
    console.log(response)
  })
  .catch(function(error) {
    console.log(error)
  })
  .finally(function() {
  })
