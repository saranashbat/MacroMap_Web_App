const persistence = require("./persistence.js")
const crypto = require("crypto")

function computeHash(password){
    let hash = crypto.createHash('sha512')
    hash.update(password)
    let res = hash.digest('hex')
    return res
}

async function checkLogin(username, password) {
    let details = await persistence.getUserDetails(username)
    let hashedPass = computeHash(password)

    if (!details || details.password != hashedPass) {
        return undefined
    }
    return details.usertype
}


async function startSession(data) {
    let sessionkey = crypto.randomUUID()
    let expiry = new Date(Date.now() + 1000*60*10)
    await persistence.saveSession(sessionkey, expiry, data)
    return {
        sessionkey: sessionkey,
        expiry: expiry
    }
}

async function getSessionData(key) {
    return await persistence.getSessionData(key)
}

async function deleteSession(key) {
    await persistence.deleteSession(key)
}

async function getAllLocations(){
    return await persistence.getAllLocations()
}

async function getLocation(location){
    return await persistence.getLocation(location)
}

async function addPost(locationName, postData){
    await persistence.addPost(locationName, postData)
}

async function registerUser(data){
    data.password = computeHash(data.password)
    await persistence.registerUser(data)
}

async function getUserDetails(username){
    return await persistence.getUserDetails(username)
}

async function generateFormToken(sessionId) {
    let token = crypto.randomUUID()
    let sd = await persistence.getSessionData(sessionId)
    sd.csrfToken = token
    await persistence.updateSessionData(sessionId, sd)
    return token
}

async function cancelToken(sessionId) {
    let sd = await persistence.getSessionData(sessionId)
    delete sd.csrfToken
    await persistence.updateSessionData(sessionId, sd)
}

module.exports = {
    checkLogin, startSession, getSessionData, deleteSession, getAllLocations, getLocation, addPost, registerUser, getUserDetails, generateFormToken, cancelToken
}
