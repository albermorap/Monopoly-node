var url = "http://127.0.0.1:1337/";
var socket = io();

function inicio(){
	if ($.cookie("uid") == undefined)
		mostrarBotonPedirFicha()
	else{
		$.getJSON(url+"getFicha/" + $.cookie("uid"), function (data){
			if (data.error == 1){
				eliminarCookies()
				alert(data.msg)
				mostrarBotonPedirFicha()
			}
			else{
				if (data.datosFicha.fasePartida == "FaseInicial"){
					mostrarBotonesFaseInicial()
					mostrarDatosJugador(data.datosFicha)
				}
				else{
					comprobarTurno(data.datosFicha)
					if ($.cookie("datosTirada")){
						mostrarTirada(JSON.parse($.cookie("datosTirada")).tirada)
						habilitarBotonesDadosTirados(JSON.parse($.cookie("datosTirada")).dadosTirados)
					}
				}
			}
		})
	}
}

function eliminarCookies(){
	$.removeCookie("uid")
	$.removeCookie("datosTirada")
}

//Funciones para modificar el index.html

function mostrarBotonPedirFicha(){
	$("#botones").append(
		"<p id='zonaPedir'>Nombre: <input type='text' id='nombre' />"+
		"<button id='pedir_Btn' class='btn btn-sm btn-default'>Pedir Ficha</button></p>")
	$('#pedir_Btn').on("click",function(){	
		obtenerFicha($("#nombre").val())
	})
}

function quitarZonaPedir(){$("#zonaPedir").remove()}
function quitarZonaInicial(){$("#zonaInicial").remove()}
function quitarZonaMeToca(){$("#zonaMeToca").remove()}
function quitarZonaDados(){$("#zonaDados").remove()}

function mostrarBotonesFaseInicial(){
	$("#botones").append(
		"<p id='zonaInicial'><button id='empezarPartida_Btn' class='btn btn-sm btn-default'>Empezar partida</button></p>")
	$('#empezarPartida_Btn').on("click",function(){	
		empezarPartida($.cookie("uid"))
	})
}

function mostrarTirada(tirada){
	$("#zonaDados").remove()
	$("#dados").append(
		"<p id='zonaDados' ><b>DADOS: " + tirada[0] + " + " + tirada[1] + "</b></p>")
}

function mostrarBotonesMeToca(){
	$("#botones").append(
		"<p id='zonaMeToca'>" +
		"<button id='lanzarDados_Btn' class='btn btn-sm btn-default'>Lanzar Dados</button>" +
		"<button id='comprarPropiedad_Btn' class='btn btn-sm btn-default' disabled>Comprar Propiedad</button>" +
		"<button id='pasarTurno_Btn' class='btn btn-sm btn-default' disabled>Pasar Turno</button>" +
		"</p>")	
	$('#lanzarDados_Btn').on("click",function(){	
		lanzarDados($.cookie("uid"))
	})
	$('#comprarPropiedad_Btn').on("click",function(){	
		comprarPropiedad($.cookie("uid"))
	})	
	$('#pasarTurno_Btn').on("click",function(){	
		pasarTurno($.cookie("uid"))
	})
	/*$("#botones").append(
		"<p id='zonaEdificar'>" +
		"<button id='edificarPropiedad_Btn' disabled>Edificar Propiedad</button>" +
		"</p>")
	$('#edificarPropiedad_Btn').on("click",function(){	
		empezarPartida($.cookie("uid"))
	})*/
}

function habilitarBotonesDadosTirados(datosTirados){
	$('#comprarPropiedad_Btn').prop('disabled', false)
	$('#edificarPropiedad_Btn').prop('disabled', false)

	if (datosTirados){
		$('#lanzarDados_Btn').prop('disabled', true)
		$('#pasarTurno_Btn').prop('disabled', false)
	}
	else{
		$('#lanzarDados_Btn').prop('disabled', false)		
		$('#pasarTurno_Btn').prop('disabled', true)
	}
}

DatosJugador:{
	function mostrarDatosJugador(datosFicha){
		mostrarNombre(datosFicha.nombre)
		mostrarColor(datosFicha.color)
		mostrarSaldo(datosFicha.saldo)
		mostrarPosicion(datosFicha.posicion)
		mostrarFasePartida(datosFicha.fasePartida)
		mostrarInfoFicha(datosFicha.info)
		mostrarPropiedades(datosFicha.propiedades)
	}

	function mostrarNombre(nombre){
		$('#nombreJugadorDefecto').remove()
		$("#nombre").remove()
		$("#nombreJugador").append("<h4 id='nombre' class='panel-title'>Bienvenido, "+nombre+"</h4>")
	}

	function mostrarColor(color){
		$("#color").remove()
		$("#datosJugador").append("<p id='color'>Color: "+color+"</p>")
	}

	function mostrarSaldo(saldo){
		$("#saldo").remove();
		$("#datosJugador").append("<p id='saldo'>Saldo: "+saldo+" pelotis</p>")	
	}

	function mostrarPosicion(posicion){
		$("#posicion").remove();
		$("#datosJugador").append("<p id='posicion'>Posicion: "+posicion+"</p>")	
	}

	function mostrarFasePartida(fasePartida){
		$("#fasePartida").remove();
		$("#datosJugador").append("<p id='fasePartida'>Fase de Partida: "+fasePartida+"</p>")	
	}

	function mostrarInfoFicha(info){
		$("#listaInfo").remove();

		var lista = "<ul id='listaInfo'>"
		info.forEach(function (v,i,array){
			lista = lista + "<li>" + v + "</li>"})
		lista = lista + "</ul>"

		$("#infoFicha").append(lista)
	}

	function mostrarPropiedades(propiedades){
		for(var i=0; i<40; i++){ // Max 40 propiedades y ni eso
			$("#prop-num-" + i).remove();
		}

		propiedades.forEach(function (v,i,array){
			switch (v.tipo){
				case "Calle":
					$("#prop-" + v.color).append("<li id='prop-num-" + i + "'>" + v.nombre + " - " + v.numCasas + " casas </li>")
					break;
				case "Estacion":
					$("#prop-estacion").append("<li id='prop-num-" + i + "'>" + v.nombre + " </li>")
					break;
				case "ServicioPublico":
					$("#prop-servicioPublico").append("<li id='prop-num-" + i + "'>" + v.nombre + "</li>")
					break;
			}
		})	
	}
}

FuncionesAuxiliares:{
	function comprobarTurno(datosFicha){
		quitarZonaMeToca()
		quitarZonaDados()

		if (datosFicha.turno == "MeToca")
			mostrarBotonesMeToca()

		mostrarDatosJugador(datosFicha)
	}
}

//Funciones para comunicar con el servidor

Sockets: {
	socket.on("cambioTurno", function (data){
		getTurno($.cookie("uid"))
	})
}

function obtenerFicha(nombre){
	if (nombre != "")
		$.getJSON(url+"nuevoJugador/"+nombre, function (data){
			if (data.error == 1)
				alert(data.msg)
			else{
				$.cookie("uid", data.datosFicha.uid)

				quitarZonaPedir()				
				mostrarBotonesFaseInicial()
				mostrarDatosJugador(data.datosFicha)
			}		
		})
}

function empezarPartida(uid){
	$.getJSON(url+"empezarPartida/"+uid, function (data){
		if (data.error == 1)
			alert(data.msg)
		else{
			quitarZonaInicial()
			comprobarTurno(data.datosFicha)
		}
	})
}

function getTurno(uid){
	$.getJSON(url+"refrescar/"+uid, function (data){
		if (data.error == 1)
			alert(data.msg)
		else{
			comprobarTurno(data.datosFicha)
		}
	})
}

function lanzarDados(uid){
	$.getJSON(url+"lanzarDados/"+uid, function (data){
		if (data.error == 1)
			alert(data.msg)
		else{
			$.removeCookie("datosTirada")
			$.cookie("datosTirada", JSON.stringify(data.datosTirada))
			habilitarBotonesDadosTirados(data.datosTirada.dadosTirados)
			mostrarTirada(data.datosTirada.tirada)
			mostrarDatosJugador(data.datosFicha)
		}
	})
}

function comprarPropiedad(uid){
	$.getJSON(url+"comprarPropiedad/"+uid, function (data){
		if (data.error == 1)
			alert(data.msg)
		else{
			mostrarDatosJugador(data.datosFicha)
		}
	})
}

function pasarTurno(uid){
	$.getJSON(url+"pasarTurno/"+uid, function (data){
		if (data.error == 1)
			alert(data.msg)
		else{
			$.removeCookie("datosTirada")
		}
	})
}