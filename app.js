const express = require('express') 
const business = require('./business.js') 
const bodyParser = require('body-parser') 
const cookieParser = require('cookie-parser') 
const handlebars = require('express-handlebars')
const path = require('path')
const fileUpload=require('express-fileupload')
const { auth } = require('express-openid-connect');


let app = express()


app.set('views', __dirname+"/coreui_dist")
app.set('view engine', 'handlebars')
app.engine('handlebars', handlebars.engine())

const config = {
    authRequired: false,
    auth0Logout: true,
    secret: '7B405EC1A9F2638D',
    baseURL: 'http://localhost:8000',
    clientID: 'xS3yT85SL0yzyznPNPsxdlE4lD8zmH3N',
    issuerBaseURL: 'https://dev-u88lvdxnj7lovsnk.us.auth0.com'
  }

app.use(auth(config))
app.use(express.static(path.join(__dirname, 'coreui_dist')));
app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())
app.use(fileUpload())


app.get('/', async (req, res) => {

    /*userData = ''
    let session = req.cookies.session
    if(session){
        let sessionData = await business.getSessionData(session)
        if (sessionData){
            userData = sessionData.data
        }
    }
    
    
    res.render('index', {layout: false, userData: userData})*/
    res.render('index', {layout: false})
})


app.get('/macrofilter', async (req, res) => {

    
})

/*
app.get('/404', (req, res) => {
    
    res.render('404', {layout: false})
})


app.get('/locations', async (req, res) => {
    userData = ''
    let session = req.cookies.session
    if(session){
        let sessionData = await business.getSessionData(session)
        if (sessionData){
            userData = sessionData.data
        }
    }
    let locations = await business.getAllLocations() 
    res.render('locations', {layout: false, location: locations, userData: userData})
})
*/


/*
app.get('/dashboard', async (req, res) => {
    let sessionKey = req.cookies.session
    if (!sessionKey) {
        res.redirect("/login?message=Not logged in")
        return
    }
    let sessionData = await business.getSessionData(sessionKey)
    if (!sessionData) {
        res.redirect("/login?message=Not logged in")
        return
    }

    if (sessionData && sessionData.data && sessionData.data.usertype && sessionData.data.usertype != 'admin') {
        res.redirect("/login?message=Invalid User Type")
        return
    }
    
    
    let allLocations = await business.getAllLocations()

    res.render('dashboard', {layout: false, allLocations: allLocations, userData: sessionData.data})
})



app.use('/posts/:name', express.static(path.join(__dirname, 'coreui_dist')))

app.get('/posts/:name', async (req, res) =>{
    let location = req.params.name
    let data = await business.getLocation(location)

    if(!data){
        res.status(404).render('404', {layout: false})
        return
    }

    userData = ''
    let session = req.cookies.session
    if(session){
        let sessionData = await business.getSessionData(session)
        if (sessionData){
            userData = sessionData.data
        }
    }

    res.render('posts', {layout: false, data: data, userData: userData})

})

app.get('/posts/:name/add', async (req, res) =>{
    let location = req.params.name
    let data = await business.getLocation(location)

    if(!data){
        res.status(404).render('404', {layout: false})
        return
    }

    let sessionKey = req.cookies.session
    if (!sessionKey) {
        res.redirect("/login?message=Not logged in")
        return
    }
    let sessionData = await business.getSessionData(sessionKey)
    if (!sessionData) {
        res.redirect("/login?message=Not logged in")
        return
    }

    if (sessionData && sessionData.data && sessionData.data.usertype && sessionData.data.usertype != 'member') {
        res.redirect("/login?message=Invalid User Type")
        return
    }

    let token = await business.generateFormToken(sessionKey)

    res.render('addpost', {layout: false, data: data, csrfToken: token, userData: sessionData.data})
})


app.post('/posts/:name/add', async (req, res) =>{
    let location = req.params.name
    let data = await business.getLocation(location)

    if(!data){
        return
    }

    let sessionKey = req.cookies.session
    if (!sessionKey) {
        res.redirect("/login?message=Not logged in")
        return
    }
    let sessionData = await business.getSessionData(sessionKey)
    if (!sessionData) {
        res.redirect("/login?message=Not logged in")
        return
    }

    if (sessionData && sessionData.data && sessionData.data.usertype && sessionData.data.usertype != 'member') {
        res.redirect("/login?message=Invalid User Type")
        return
    }

    let token = req.body.csrfToken
    if (!sessionData.csrfToken) {
        let message = "CSRF token issue"
        res.redirect(`/posts/${data.name}?message=${message}`)
        return
    }
    if (sessionData.csrfToken != token) {
        let message = "CSRF token issue"
        res.redirect(`/posts/${data.name}?message=${message}`)
        return
    }

    let errors = {}
    //image upload check
    let fileName = ''
    if(req.files && req.files.image){
        let image = req.files.image
        fileName = image.name

        const extensions = ['.jpg', '.jpeg', '.png', '.gif'];
        const fileExtension = path.extname(fileName).toLowerCase();

        if (!extensions.includes(fileExtension)) {
            errors.extError = "Please add a file with a supported extension (.jpg, .jpeg, .png, .gif)"
            
        }

        await image.mv(`${__dirname}/coreui_dist/images/${fileName}`)
    }

    
    if (!req.body.title || req.body.title.trim() == '') {
        errors.titleError = "Please enter a title."
    }

    if (!req.body.content || req.body.content.trim() == '') {
        errors.contentError = "Please enter a description."
    }

    if (Object.keys(errors).length > 0) {
        res.render('addpost', { layout: false, data: data, errors: errors })
        return
    }

    let postData = {
        title: req.body.title, 
        content: req.body.content,
        user: sessionData.data.username,
        image: fileName,
        food_added: req.body.food_added,
        water_added: req.body.water_added,
        current_food_level: req.body.current_food_level, 
        cat_count: req.body.cat_count,
        health_issue: req.body.health_issue, 
        timestamp: new Date().toISOString()
    }

    let locationName = data.name

    await business.addPost(locationName, postData)

    await business.cancelToken(sessionKey)

    let message = 'Post Added'
    res.redirect(`/posts/${location}?message=${message}`)
})



app.get('/dashboard/data', async (req, res) => {
    let allLocations = await business.getAllLocations()

    let latestPosts = []
    for (i of allLocations){
        let latestPost = null
        let latestDate = null

        for (post of i.posts){
            const postDate = new Date(post.timestamp);
            if(!latestDate || postDate > latestDate){
                latestDate = postDate
                latestPost = post
            }
        }
        latestPosts.push(latestPost)
    }

    let response = {
        allLocations: allLocations,
        latestPosts: latestPosts

    }
    res.json(response)
})

*/
app.use((req,res) => {
    res.status(404).render('404', {layout: undefined});
})



app.listen(8000, () => {console.log('Running')})