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
		"posicion":ficha.getPosicion(), "turno":ficha.getTurno().constructor.name, "info":ficha.getInfo(), "turnosCarcel":ficha.getTurnosEnCarcel(),
		"tarjetaCarcel":ficha.tieneTarjetaLibreCarcel(), "propiedades":getPropiedades(ficha), "monopolios":ficha.getMonopolios(), "datosPartida":getDatosPartida()}
}

function getPropiedades(ficha){
	var lista = []
	ficha.getPropiedades().forEach(function (v,i,array){
		if (v.getPropiedad().constructor.name == "Calle")
			lista.push({'posicion':partida.tablero.getPosicion(v.getPropiedad()), 'tipo':v.getPropiedad().getTipo(), 'nombre':v.getPropiedad().getNombre(),
				'color':v.getPropiedad().getColor(), 'numCasas':v.getPropiedad().getNumCasas(), 'estado':v.getPropiedad().getEstado().constructor.name})
		else
			lista.push({'posicion':partida.tablero.getPosicion(v.getPropiedad()), 'tipo':v.getPropiedad().getTipo(), 'nombre':v.getPropiedad().getNombre(),
				'estado':v.getPropiedad().getEstado().constructor.name})
	})
	return lista
}

function getDatosPartida(ficha){
	return {"numeroJugadores":partida.getFichas().length, "fasePartida":partida.getFase().constructor.name,	"posicionesFichas":getPosicionesFichas(),
			"propiedadesGlobales":getPropiedadesPartida()}
}

function getDatosCasilla(ficha){	
	var temaCasilla = partida.tablero.getCasilla(ficha.getPosicion()).getTema()

	var impuesto
	if (temaCasilla.getTipo() == "Impuesto") impuesto = temaCasilla.getDinero()

	if (temaCasilla.getEstado().constructor.name == "NoComprable")
		return {"tipo":temaCasilla.getTipo(), "estado":temaCasilla.getEstado().constructor.name, "tarjetaCogida":ficha.getTarjetaCogida(), "impuesto":impuesto,
				"cobroSalida":ficha.getCobroSalida(), "casillaALaCarcel":ficha.getCasillaALaCarcel()}
	else
		return {"tipo":temaCasilla.getTipo(), "estado":temaCasilla.getEstado().constructor.name, "nombre":temaCasilla.getNombre(), "precio":temaCasilla.getPrecio(),
				"cobroSalida":ficha.getCobroSalida(), "tarjetaCogida":ficha.getTarjetaCogida(), "casillaALaCarcel":ficha.getCasillaALaCarcel()}
}

function getPosicionesFichas(){
	var posiciones = new Object() // objeto porque array no funciona
	partida.getFichas().forEach(function (v,i,array){posiciones[v.getColor()] = v.getPosicion()})
	return posiciones
}

function getPropiedadesPartida(){
	var propiedades = new Object()
	var fichas = partida.getFichas()
	for (var i=0;i<fichas.length;i++)
		propiedades[fichas[i].getColor()] = getPropiedades(fichas[i])
	return propiedades
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
	if (ficha){
		ficha.empezarPartida()

		var jsonData = {"error":"0", "datosFicha":getDatosFicha(ficha)}
		response.send(jsonData)
	}	
})

app.get("/refrescar/:uid", function (request, response) {
	var ficha = comprobarJugador(request.params.uid, response)
	if (ficha){
		var jsonData = {"error":"0", "datosFicha":getDatosFicha(ficha)}
		response.send(jsonData)
	}
})

app.get("/lanzarDados/:uid", function (request, response) {
	var jsonData
	var ficha = comprobarJugador(request.params.uid, response)
	if (ficha){
		var turnoPrev = ficha.getTurnosEnCarcel()
		var tirada = ficha.lanzarDados()
		var salidaCarcel = false

		if (turnoPrev > 0 && ficha.getTurnosEnCarcel() == 0) salidaCarcel = true

		if (tirada){
			jsonData = {"error":"0", "datosFicha":getDatosFicha(ficha),
				"datosTirada":{"tirada":tirada, "dadosTirados":ficha.getTurno().dadosTirados}, "datosCasilla":getDatosCasilla(ficha), "salidaCarcel":salidaCarcel}
		}
		else
			jsonData = {"error":"1", "msg":"Ya has lanzado los dados en tu turno."}
		response.send(jsonData)
		io.emit("nuevaPosicion",{juego:"ok", "uidFicha":ficha.getUsuario().getUid()})
	}
})

app.get("/empezarPartidaTest/:uid", function (request, response) {
	partida.calcularPrimerTurno(true)
	var ficha = comprobarJugador(request.params.uid, response)
	if (ficha){
		var jsonData = {"error":"0", "datosFicha":getDatosFicha(ficha)}
		response.send(jsonData)
	}
})

app.get("/lanzarDadosTest/:uid/:tirada1/:tirada2", function (request, response) {
	var jsonData
	var ficha = comprobarJugador(request.params.uid, response)
	if (ficha){
		var turnoPrev = ficha.getTurnosEnCarcel()
		var tirada = ficha.lanzarDados([parseInt(request.params.tirada1), parseInt(request.params.tirada2)])
		var salidaCarcel = false

		if (turnoPrev > 0 && ficha.getTurnosEnCarcel() == 0) salidaCarcel = true

		if (tirada){
			jsonData = {"error":"0", "datosFicha":getDatosFicha(ficha),
				"datosTirada":{"tirada":tirada, "dadosTirados":ficha.getTurno().dadosTirados, "salidaCarcel":salidaCarcel}, "datosCasilla":getDatosCasilla(ficha)}
		}
		else
			jsonData = {"error":"1", "msg":"Ya has lanzado los dados en tu turno."}
		response.send(jsonData)
		io.emit("nuevaPosicion",{juego:"ok", "uidFicha":ficha.getUsuario().getUid()})
	}
})

app.get("/comprarPropiedad/:uid", function (request, response) {
	var ficha = comprobarJugador(request.params.uid, response)
	if (ficha){
		ficha.comprarPropiedad()

		var jsonData = {"error":"0", "datosFicha":getDatosFicha(ficha)}
		response.send(jsonData)
	}
})

app.get("/edificarPropiedad/:uid/:nombrePropiedad", function (request, response) {
	var ficha = comprobarJugador(request.params.uid, response)
	if (ficha){
		var titulo = ficha.getPropiedad(request.params.nombrePropiedad)
		ficha.edificar(titulo)

		var jsonData = {"error":"0", "datosFicha":getDatosFicha(ficha)}
		response.send(jsonData)
	}
})

app.get("/demolerPropiedad/:uid/:nombrePropiedad", function (request, response) {
	var ficha = comprobarJugador(request.params.uid, response)
	if (ficha){
		var titulo = ficha.getPropiedad(request.params.nombrePropiedad)
		ficha.venderEdificio(titulo)

		var jsonData = {"error":"0", "datosFicha":getDatosFicha(ficha)}
		response.send(jsonData)
	}
})

app.get("/hipotecarPropiedad/:uid/:nombrePropiedad", function (request, response) {
	var ficha = comprobarJugador(request.params.uid, response)
	if (ficha){
		var titulo = ficha.getPropiedad(request.params.nombrePropiedad)
		ficha.hipotecarPropiedad(titulo)

		var jsonData = {"error":"0", "datosFicha":getDatosFicha(ficha)}
		response.send(jsonData)
	}
})

app.get("/pasarTurno/:uid", function (request, response) {
	var ficha = comprobarJugador(request.params.uid, response)
	if (ficha){
		ficha.pasarTurno()

		var jsonData = {"error":"0"}
		response.send(jsonData)
		io.emit("cambioTurno",{juego:"ok", "datosFicha":getDatosFicha(ficha)})
	}
})

app.get("/usarTarjetaLibreCarcel/:uid", function (request, response) {
	var ficha = comprobarJugador(request.params.uid, response)
	if (ficha){
		ficha.usarTarjetaLibreCarcel()

		var jsonData = {"error":"0", "datosFicha":getDatosFicha(ficha)}
		response.send(jsonData)
	}
})

app.get("/pagarSalidaCarcel/:uid", function (request, response) {
	var jsonData
	var ficha = comprobarJugador(request.params.uid, response)
	if (ficha){
		ficha.pagarSalidaCarcel()

		if (ficha.getTurnosEnCarcel() == 0)
			jsonData = {"error":"0", "datosFicha":getDatosFicha(ficha)}
		else
			jsonData = {"error":"1", "msg":"Saldo insuficiente"}

		response.send(jsonData)
	}
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