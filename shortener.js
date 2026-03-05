"use strict";

// Main
module.exports = async(url)=>{
    // Variables
    const response = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`)
    const data = await response.json()

    // Core
    return data.shorturl
}
