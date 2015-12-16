// Levantar servidor: node monopoly-server.js
// instalar modulos - npm install express

var fs = require("fs");
var express =  require("express");
var modelo = require("./server/modelo.js");
var http = require("http");

var config = JSON.parse(fs.readFileSync("./config.json"))
var host = config.host
var port = config.port

var app = express()
var server = http.createServer(app)
var io = require('socket.io')(server);
app.use("/",express.static(__dirname))

var partida = new modelo.Partida("1")

function comprobarJugador(uid, response){
	var jsonData
	var ficha = partida.getFicha(uid)

	if (ficha) return ficha

	jsonData = {"error":"1", "msg":"No tienes ficha en esta partida."}
	response.send(jsonData)
}

function getDatosFicha(ficha){
	return {"uid":ficha.getUsuario().getUid(), "nombre":ficha.getUsuario().getNombre(), "color":ficha.getColor(), "saldo":ficha.getSaldo(), 
		"posicion":ficha.getPosicion(), "turno":ficha.getTurno().constructor.name, "fasePartida":ficha.getPartida().getFase().constructor.name,
		"info":ficha.getInfo(), "propiedades":getPropiedades(ficha)}
}

function getPropiedades(ficha){
	var lista = []
	ficha.getPropiedades().forEach(function (v,i,array){
		if (v.getPropiedad().constructor.name == "Calle")
			lista.push({'tipo':v.getPropiedad().constructor.name, 'nombre':v.getPropiedad().getNombre(), 'color':v.getPropiedad().getColor(), 'numCasas':v.getPropiedad().getNumCasas()})
		else
			lista.push({'tipo':v.getPropiedad().constructor.name, 'nombre':v.getPropiedad().getNombre()})
	})
	return lista
}

app.get("/", function (request, response) {
	var contenido = fs.readFileSync("./client/index.html")
	response.setHeader("Content-type", "text/html")
	response.send(contenido)
})

app.get("/reset", function (request, response) {
	partida = new modelo.Partida("1")
	console.log("Partida reiniciada!!")
	response.redirect("/")
})

app.get("/getFicha/:uid", function (request, response) {
	var ficha = comprobarJugador(request.params.uid, response)
	if (ficha){
		var jsonData = {"error":"0", "datosFicha":getDatosFicha(ficha)}
		response.send(jsonData)
	}
})

app.get("/nuevoJugador/:nombre", function (request, response) {
	var jsonData
	var jugador = new modelo.Usuario(request.params.nombre)
	var ficha = jugador.unirseAPartida(partida)

	if (ficha)
		jsonData = {"error":"0", "datosFicha":getDatosFicha(ficha)}
	else
		jsonData = {"error":"1","msg":jugador.info}
	response.send(jsonData)
})

app.get("/empezarPartida/:uid", function (request, response) {
	var ficha = comprobarJugador(request.params.uid, response)
	ficha.empezarPartida()
	var jsonData = {"error":"0", "datosFicha":getDatosFicha(ficha)}
	response.send(jsonData)
})

app.get("/refrescar/:uid", function (request, response) {
	var ficha = comprobarJugador(request.params.uid, response)
	var jsonData = {"error":"0", "datosFicha":getDatosFicha(ficha)}
	response.send(jsonData)
})

app.get("/lanzarDados/:uid", function (request, response) {
	var jsonData
	var ficha = comprobarJugador(request.params.uid, response)
	var tirada = ficha.lanzarDados()
	if (tirada)
		jsonData = {"error":"0", "datosFicha":getDatosFicha(ficha),
			"datosTirada":{"tirada":tirada, "dadosTirados":ficha.getTurno().dadosTirados}}
	else
		jsonData = {"error":"1", "msg":"Ya has lanzado los dados en tu turno."}
	response.send(jsonData)
})

app.get("/empezarPartidaTest/:uid", function (request, response) {
	partida.calcularPrimerTurno(true)
	var ficha = comprobarJugador(request.params.uid, response)
	var jsonData = {"error":"0", "datosFicha":getDatosFicha(ficha)}
	response.send(jsonData)
})

app.get("/comprarPropiedad/:uid", function (request, response) {
	var ficha = comprobarJugador(request.params.uid, response)
	ficha.comprarPropiedad()
	var jsonData = {"error":"0", "datosFicha":getDatosFicha(ficha)}
	response.send(jsonData)
})

app.get("/pasarTurno/:uid", function (request, response) {
	var ficha = comprobarJugador(request.params.uid, response)
	ficha.pasarTurno()
	var jsonData = {"error":"0"}//, "datosFicha":getDatosFicha(ficha)}
	response.send(jsonData)
	io.emit("cambioTurno",{juego:"ok", "datosFicha":getDatosFicha(ficha)})
})


var lista = []
io.on("connection", function(client){
	/*client.on("listo", function(data){
		lista.push(data)
		console.log("Llega el jugador " + data.usr)
		if (lista.length == partida.numeroJugadores)
			io.emit("go", {juego:"ok"})
	})*/
  	/*client.on("pasarTurno",function(data){
  		io.socket.emit("cambioTurno",{juego:"ok"})
  	})*/
});

server.listen(port, host)
console.log("Servidor iniciado en puerto " + port)