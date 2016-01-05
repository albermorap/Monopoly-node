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

var partida = new modelo.Partida("1", 2)

function comprobarJugador(uid, response){
	var jsonData
	var ficha = partida.getFicha(uid)

	if (ficha) return ficha

	jsonData = {"error":"1", "msg":"No tienes ficha en esta partida."}
	response.send(jsonData)
}


function getDatosFicha(ficha){
	var cantidadDeudas = 0
	var deudas = ficha.getDeudas()
	for (i in deudas) cantidadDeudas += deudas[i].cantidad

	return {"uid":ficha.getUsuario().getUid(), "nombre":ficha.getUsuario().getNombre(), "color":ficha.getColor(), "saldo":ficha.getSaldo(), 
		"posicion":ficha.getPosicion(), "turno":ficha.getTurno().constructor.name, "turnosCarcel":ficha.getTurnosEnCarcel(),
		"tarjetaCarcel":ficha.tieneTarjetaLibreCarcel(), "propiedades":getPropiedades(ficha), "monopolios":ficha.getMonopolios(), "datosPartida":getDatosPartida(),
		"cantidadDeudas":cantidadDeudas}
}

function getPropiedades(ficha){
	var lista = []
	ficha.getPropiedades().forEach(function (v,i,array){
		if (v.getPropiedad().constructor.name == "Calle")
			lista.push({'posicion':partida.tablero.getPosicion(v.getPropiedad()), 'tipo':v.getPropiedad().getTipo(), 'nombre':v.getPropiedad().getNombre(),
				'color':v.getPropiedad().getColor(), 'numCasas':v.getPropiedad().getNumCasas(), 'estado':v.getPropiedad().getEstado().constructor.name,
				'precio':v.getPropiedad().getPrecio()})
		else
			lista.push({'posicion':partida.tablero.getPosicion(v.getPropiedad()), 'tipo':v.getPropiedad().getTipo(), 'nombre':v.getPropiedad().getNombre(),
				'estado':v.getPropiedad().getEstado().constructor.name, 'precio':v.getPropiedad().getPrecio()})
	})
	return lista
}

function getDatosPartida(ficha){
	var listaFichas = []
	partida.getFichas().forEach(function (v,i,array){listaFichas[i] = {'color':v.getColor(), 'nombre':v.getUsuario().getNombre(), 'enBancarrota':v.enBancarrota()}})

	return {"fichas":listaFichas, "fasePartida":partida.getFase().constructor.name,	"posicionesFichas":getPosicionesFichas(),
			"propiedadesGlobales":getPropiedadesPartida()}
}

function getDatosCasilla(ficha){	
	var temaCasilla = partida.tablero.getCasilla(ficha.getPosicion()).getTema()

	var impuesto
	if (temaCasilla.getTipo() == "Impuesto") impuesto = temaCasilla.getDinero()

	if (temaCasilla.getEstado().constructor.name == "NoComprable")
		return {"tipo":temaCasilla.getTipo(), "estado":temaCasilla.getEstado().constructor.name, "tarjetaCogida":ficha.getTarjetaCogida(), "impuesto":impuesto,
				"cobroSalida":ficha.getCobroSalida(), "casillaALaCarcel":ficha.getCasillaALaCarcel(), "infoPagoAFicha":ficha.getInfoPagoAFicha()}
	else
		return {"tipo":temaCasilla.getTipo(), "estado":temaCasilla.getEstado().constructor.name, "nombre":temaCasilla.getNombre(), "precio":temaCasilla.getPrecio(),
				"cobroSalida":ficha.getCobroSalida(), "tarjetaCogida":ficha.getTarjetaCogida(), "casillaALaCarcel":ficha.getCasillaALaCarcel(), "infoPagoAFicha":ficha.getInfoPagoAFicha()}
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
	partida = new modelo.Partida("1", 2)
	console.log("Partida reiniciada!!")
	response.redirect("/")
})

app.get("/refrescar/:uid", function (request, response) {
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
	else if (partida.getFichas().length == 6)
		jsonData = {"error":"1","msg":"Máximo número de jugadores. No hay fichas disponibles"}
	else
		jsonData = {"error":"1","msg":"No se pueden unir más jugadores a la partida " + partida.getNombre()}
	response.send(jsonData)
})

app.get("/empezarPartida/:uid", function (request, response) {
	var jsonData
	var ficha = comprobarJugador(request.params.uid, response)	
	if (ficha){
		ficha.empezarPartida()

		if (partida.getFase().constructor.name == "FaseJugar"){
			jsonData = {"error":"0"}
			io.emit("partidaEmpezada")
		}
		else
			jsonData = {"error":"2", "msg":"Se necesitan al menos "+partida.getMinNumJugadores()+" jugadores para empezar la partida"}

		response.send(jsonData)
	}	
})

app.get("/empezarPartidaTest/:uid", function (request, response) {
	partida.calcularPrimerTurno(true)
	var ficha = comprobarJugador(request.params.uid, response)
	if (ficha){
		var jsonData = {"error":"0"}
		response.send(jsonData)
	}
})

app.get("/lanzarDados/:uid", function (request, response) {
	var jsonData
	var ficha = comprobarJugador(request.params.uid, response)
	if (ficha){
		lanzarDados(ficha, response)
	}
})

app.get("/lanzarDadosTest/:uid/:tirada1/:tirada2", function (request, response) {
	var ficha = comprobarJugador(request.params.uid, response)
	if (ficha){
		var tiradaTest = [parseInt(request.params.tirada1), parseInt(request.params.tirada2)]
		lanzarDados(ficha, response, tiradaTest)
	}
})

function lanzarDados(ficha, response, tiradaTest){
	var jsonData
	var turnoPrev = ficha.getTurnosEnCarcel()
	var tirada
	if (tiradaTest)
		tirada = ficha.lanzarDados(tiradaTest)
	else
		tirada = ficha.lanzarDados()

	var salidaCarcel = false
	if (turnoPrev > 0 && ficha.getTurnosEnCarcel() == 0) salidaCarcel = true

	if (tirada){
		jsonData = {"error":"0", "datosFicha":getDatosFicha(ficha),
			"datosTirada":{"tirada":tirada, "dadosTirados":ficha.getTurno().dadosTirados}, "salidaCarcel":salidaCarcel, "datosCasilla":getDatosCasilla(ficha)}
	}
	else
		jsonData = {"error":"2", "msg":"Ya has lanzado los dados en tu turno."}
	response.send(jsonData)
	io.emit("nuevaPosicion",{juego:"ok", "color":ficha.getColor()})
}

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

app.get("/ofertarVentaPropiedad/:uid/:nombrePropiedad/:colorComprador/:cantidad", function (request, response) {
	var ficha = comprobarJugador(request.params.uid, response)
	if (ficha){
		var jsonData = {"error":"0"}
		response.send(jsonData)
		io.emit("ofertaVentaPropiedad",{"colorComprador":request.params.colorComprador, "nombreVendedor":ficha.getUsuario().getNombre(), "colorVendedor":ficha.getColor(), 
			"nombrePropiedad":request.params.nombrePropiedad, "cantidad":request.params.cantidad})
	}
})

app.get("/aceptarOfertaVentaPropiedad/:uid/:nombrePropiedad/:colorVendedor/:cantidad", function (request, response) {
	var ficha = comprobarJugador(request.params.uid, response)
	if (ficha){
		var vendedor = partida.getFichaPorColor(request.params.colorVendedor)
		var titulo = vendedor.getPropiedad(request.params.nombrePropiedad)
		vendedor.venderPropiedad(titulo, ficha, parseInt(request.params.cantidad))

		var jsonData
		// Si aún tiene la propiedad es que no se ha producido la venta
		if (vendedor.getPropiedad(request.params.nombrePropiedad))
			jsonData = {"error":"2", "msg":"No se ha podido llevar a cabo la venta de la propiedad porque el vendedor ha pasado su turno"}
		else{
			jsonData = {"error":"0", "datosFicha":getDatosFicha(ficha)}
			io.emit("ventaPropiedad",{"nombreVendedor":vendedor.getUsuario().getNombre(), "colorVendedor":vendedor.getColor(), "nombreComprador":ficha.getUsuario().getNombre(), 
					"nombrePropiedad":titulo.getPropiedad().getNombre()})
		}

		response.send(jsonData)
	}
})

app.get("/pasarTurno/:uid", function (request, response) {
	var ficha = comprobarJugador(request.params.uid, response)
	if (ficha){
		ficha.pasarTurno()

		var jsonData = {"error":"0"}
		response.send(jsonData)
		
		if (partida.getFase().constructor.name == "FaseFinal"){
			var ganador = partida.getGanador()
			if (ganador)
				io.emit("finPartida",{"nombreGanador":ganador.getUsuario().getNombre()})
			else
				io.emit("finPartida",{"nombreGanador":false})
		}
		else
			io.emit("cambioTurno",{juego:"ok"})
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
			jsonData = {"error":"2", "msg":"Saldo insuficiente"}

		response.send(jsonData)
	}
})


var contJugadores = 0
io.on("connection", function(client){
	client.on("conectado", function(data){
		contJugadores++
		console.log("Llega el jugador: " + data.nombreJugador)
		io.emit("nuevoJugador", {"jugadores":getDatosPartida().fichas})
		// Si se llega al máximo de jugadores se lanza la partida
		if (contJugadores == partida.coloresFichas.length)	io.emit("empiezaPartida", {"color":data.colorJugador})
	})
});

server.listen(port, host)
console.log("Servidor iniciado en puerto " + port)