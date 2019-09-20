const express = require("express")
const request = require("sync-request")
const url = require("url")
const qs = require("qs")
const querystring = require('querystring')
const cons = require('consolidate')
const randomstring = require("randomstring")
const __ = require('underscore')
__.string = require('underscore.string')

const app = express()

app.engine('html', cons.underscore)
app.set('view engine', 'html')
app.set('views', 'files/client')


const authServer = {
	authorizationEndpoint: 'http://oauth-authorizationserver.igpolytech.fr/authorize',
	tokenEndpoint: 'http://oauth-authorizationserver.igpolytech.fr/token'
}


const client = {
	"client_id": "oauth-client-1", 
	"client_secret": "oauth-client-secret-1", 
	"redirect_uris": ["http://localhost:9000/callback"]
}

const protectedResource = 'http://oauth-protectedresource.igpolytech.fr/resource'

let state, access_token, scope = null

app.get('/', (req, res) => {
	res.render('index', {access_token: access_token, scope: scope})
})

app.get('/authorize', (req, res) => {


	res.redirect(302, authServer.authorizationEndpoint+'?response_type=code&scope=foo&client_id='+client.client_id+'&redirect_uri='+client.redirect_uris[0])

})

app.get('/callback', (req, res) => {


	let form_data = qs.stringify({
		grant_type: 'authorization_code', 
		code: code,
		redirect_uris: client.redirect_uris[0]
	})

	let headers = {
		'Content-Type':'application/x-www-form-urlencoded',
		'Authorization': 'Basic '+ encodeClientCredentials(client.client_id,client.client_secret) 		
	}

	
	let tokRes = request('POST', authServer.tokenEndpoint, {
		headers: headers,
		body: form_data
	})


	let body = JSON.parse(tokRes.getBody()) 
	access_token = body.access_token
	res.render('index', {access_token: access_token, scope: body.scope})
})

app.get('/fetch_resource', (req, res) => {

	

	if (!access_token) {
		res.render('error', {error:'Mising access token'})
		return;
	}

	let headers = {
		
		'Authorization': 'Bearer ' + access_token
	}

	
	let resource = request('POST', protectedResource, {
		headers: headers
	})

	if(resource.statusCode >= 200 && resource.statusCode < 300){
		
		let body = JSON.parse(resource.getBody())
		res.render('data', {resource: body})
		return;
	}else {
		res.render('error', {error: `Server returned response code: ${resource.statusCode}`})
	}
})

const buildUrl = (base, options, hash) => {
	let newUrl = url.parse(base, true)
	delete newUrl.search
	if (!newUrl.query) {
		newUrl.query = {}
	}
	__.each(options, function(value, key, list) {
		newUrl.query[key] = value
	})
	if (hash) {
		newUrl.hash = hash
	}

	return url.format(newUrl)
}

const encodeClientCredentials = (clientId, clientSecret) => {
	return new Buffer(querystring.escape(clientId) + ':' + querystring.escape(clientSecret)).toString('base64')
}

app.use('/', express.static('files/client'))

const server = app.listen(9000, 'localhost', () => {
  const {address: host, port: port} = server.address()
  console.log(`OAuth Client is listening at http://${host}:${port}`)
})
 
