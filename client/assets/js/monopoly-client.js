var url = "http://127.0.0.1:1337/";
//var url = "http://monopolyserver.cloudapp.net:80/";
var socket = io();

var colorFicha = ["azul","rojo","verde","amarillo","rosa","naranja"];
var ctx;

// Fichas
var ficha_coord = [];
var fichas = []
var posicionesDraw = [];
// Propiedades
var propietario_coord = [];
var propietarios = []
var edificio_coord = [];
var propiedadesDraw = [];


function inicio(){
	cargarTablero();
	cargarCoordenadas();

	if ($.cookie("uid") == undefined)
		mostrarBotonPedirFicha()
	else{
		$.getJSON(url+"getFicha/" + $.cookie("uid"), function (data){
			if (data.error == 1){
				reiniciarSesion(data.msg)
			}
			else{
				if (data.datosFicha.datosPartida.fasePartida == "FaseInicial"){
					mostrarBotonesFaseInicial()
					mostrarDatosJugador(data.datosFicha)
				}
				else{
					comprobarTurno(data.datosFicha)
					if ($.cookie("datosTirada")){
						mostrarTirada(JSON.parse($.cookie("datosTirada")).tirada)
						habilitarBotonesDadosTirados(JSON.parse($.cookie("datosTirada")).dadosTirados)
					}
					mostrarDatosJugador(data.datosFicha)
				}
			}
		})
	}
}

//Funciones para modificar el index.html

function mostrarBotonPedirFicha(){
	$("#botones").append(
		"<div id='zonaPedir' class='input-group'>" +
			"<input type='text' id='input_nombre' placeholder='Nombre de Usuario' class='form-control'/>" +
			"<span class='input-group-btn'>" +
				"<button id='pedir_Btn' class='btn btn-default'>Pedir Ficha</button>" +
			"</span>" +
		"</div>")
	$('#pedir_Btn').on("click",function(){	
		obtenerFicha($("#input_nombre").val())
	})
}

function quitarZonaPedir(){$("#zonaPedir").remove()}
function quitarZonaInicial(){$("#zonaInicial").remove()}
function quitarZonaMeToca(){$("#zonaMeToca").remove()}
function quitarZonaDatosJugador(){$("#zonaDatosJugador").remove()}
function quitarZonaDados(){$("#zonaDados").remove()}
function quitarZonaAvisos(){$('#zonaAvisos').remove()}
function quitarZonaPropiedades(){$("#zonaPropiedades").remove()}
function quitarListaInfo(){$("#listaInfo").remove()}

function mostrarBotonesFaseInicial(){
	$("#botones").append(
		"<p id='zonaInicial'><button id='empezarPartida_Btn' class='btn btn-default'>Empezar partida</button></p>")
	$('#empezarPartida_Btn').on("click",function(){	
		empezarPartida($.cookie("uid"))
	})
}

function mostrarTirada(tirada){
	var cadena = "<h4 id='zonaDados' ><b>DADOS: " + tirada[0] + " + " + tirada[1] + "</h4>"

	if (tirada[0] == tirada[1])
		cadena = cadena + " <span class='label label-info'>Dobles</span></p>"
	else
		cadena = cadena + "</p>"

	$("#zonaDados").remove()
	$("#dados").append(cadena)
}

function mostrarBotonesMeToca(){
	$("#botones").append(
		"<div id='zonaMeToca' class='btn-group' role='group'>" +
			"<button id='lanzarDados_Btn' class='btn btn-default'>Lanzar Dados</button>" +
			"<button id='comprarPropiedad_Btn' class='btn btn-default' disabled>Comprar</button>" +
			"<button id='pasarTurno_Btn' class='btn btn-default' disabled>Pasar Turno</button>" +
		"</div>")	
	$('#lanzarDados_Btn').on("click",function(){	
		lanzarDados($.cookie("uid"))
	})
	$('#comprarPropiedad_Btn').on("click",function(){	
		comprarPropiedad($.cookie("uid"))
	})	
	$('#pasarTurno_Btn').on("click",function(){	
		pasarTurno($.cookie("uid"))
	})
}

function mostrarBotonesCarcel(tarjetaCarcel){
	$("#botones").append(
		"<div id='zonaMeToca' class='btn-group' role='group'>" +
			"<button id='lanzarDados_Btn' class='btn btn-default'>Lanzar Dados</button>" +
			"<button id='usarTarjeta_Btn' class='btn btn-default'>Usar Tarjeta</button>" +
			"<button id='pagarSalidaCarcel_Btn' class='btn btn-default'>Pagar 50 pelotis</button>" +
			"<button id='pasarTurno_Btn' class='btn btn-default' disabled>Pasar Turno</button>" +
		"</div>")

	$('#usarTarjeta_Btn').prop('disabled', !tarjetaCarcel)

	$('#lanzarDados_Btn').on("click",function(){	
		lanzarDados($.cookie("uid"))
	})
	$('#usarTarjeta_Btn').on("click",function(){	
		usarTarjetaLibreCarcel($.cookie("uid"))
	})	
	$('#pagarSalidaCarcel_Btn').on("click",function(){	
		pagarSalidaCarcel($.cookie("uid"))
	})
	$('#pasarTurno_Btn').on("click",function(){	
		pasarTurno($.cookie("uid"))
	})
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

function mostrarDatosCasilla(datosCasilla){
	quitarZonaAvisos()
	$("#avisos").append("<div id='zonaAvisos'></div>")

	if (datosCasilla.cobroSalida)
		setAlert("success", "Ha pasado por la casilla de Salida. Reciba 200 pelotis")

	if (datosCasilla.estado != "Libre")
		$('#comprarPropiedad_Btn').prop('disabled', true)
	else
		setAlert("info", datosCasilla.nombre + " está libre. Cómprela por " + datosCasilla.precio + " pelotis")

	if (datosCasilla.tarjetaCogida != ""){
		var callback = function(){setAlert("warning", "TARJETA: " + datosCasilla.tarjetaCogida)}
		showMsg("Tienes que coger una tarjeta", callback)
	}

	if (datosCasilla.tipo == "Impuesto")
		setAlert("danger", "Tiene que pagar: " + datosCasilla.impuesto + " pelotis")

	if (datosCasilla.casillaALaCarcel){
		showMsg("Vas a la cárcel")
	}
}

function dibujarTableroConDatos(numeroJugadores){
	cargarTablero()
	cargarPropiedades(numeroJugadores, ponerPropiedades)
	cargarFichas(numeroJugadores, ponerFichas)	
}

DatosJugador:{
	function mostrarDatosJugador(datosFicha){
		quitarZonaDatosJugador()
		quitarZonaAvisos()
		$("#datosJugador").append("<div id='zonaDatosJugador'></div>")

		mostrarNombre(datosFicha.nombre)
		mostrarColor(datosFicha.color)
		mostrarSaldo(datosFicha.saldo)
		if (datosFicha.turnosCarcel > 0)
			mostrarTurnosEnCarcel(datosFicha.turnosCarcel)
		//mostrarPosicion(datosFicha.posicion)		
		mostrarPropiedades(datosFicha.propiedades, datosFicha.monopolios)

		mostrarDatosPartida(datosFicha.datosPartida)

		mostrarInfoFicha(datosFicha.info)
	}

	function mostrarDatosPartida(datosPartida){
		posicionesDraw = datosPartida.posicionesFichas
		propiedadesDraw = datosPartida.propiedadesGlobales
		mostrarFasePartida(datosPartida.fasePartida)

		dibujarTableroConDatos(datosPartida.numeroJugadores)	
	}	

	function mostrarFasePartida(fasePartida){
		$("#zonaDatosJugador").append("<p id='fasePartida'>Fase de Partida: "+fasePartida+"</p>")	
	}

	function mostrarNombre(nombre){
		$('#nombreJugadorDefecto').remove()
		$("#nombre").remove()
		$("#nombreJugador").append("<h4 id='nombre' class='panel-title'>Bienvenido, "+nombre+"</h4>")
	}

	function mostrarColor(color){
		$("#zonaDatosJugador").append("<img height='50' width='50' src='client/assets/img/ficha_" + color + ".png'>")
	}

	function mostrarSaldo(saldo){
		if ($.cookie("saldo")){
			if ($.cookie("saldo") < saldo)
				$("#zonaDatosJugador").append("<h4><b>SALDO: "+saldo+" pelotis</b> <span class='label label-success'><span class='glyphicon glyphicon-arrow-up'/> "+(saldo-$.cookie("saldo"))+"</span></h4>")	
			else if ($.cookie("saldo") > saldo)
				$("#zonaDatosJugador").append("<h4><b>SALDO: "+saldo+" pelotis</b> <span class='label label-danger'><span class='glyphicon glyphicon-arrow-down'/> "+($.cookie("saldo")-saldo)+"</span></h4>")
			else
				$("#zonaDatosJugador").append("<h4><b>SALDO: "+saldo+" pelotis</b></h4>")
		}		
		$.cookie("saldo", saldo)		
	}

	function mostrarTurnosEnCarcel(turnosCarcel){
		$("#zonaDatosJugador").append("<h4><span class='label label-danger'>Turnos en cárcel <span class='badge'>"+turnosCarcel+"</span></span></h4>")	
	}

	function mostrarPosicion(posicion){
		$("#zonaDatosJugador").append("<p>Posicion: "+posicion+"</p>")	
	}	

	function mostrarInfoFicha(info){
		quitarListaInfo()

		var lista = "<ul id='listaInfo'>"
		info.forEach(function (v,i,array){
			lista = lista + "<li>" + v + "</li>"})
		lista = lista + "</ul>"

		$("#infoFicha").append(lista)
	}

	function mostrarPropiedades(propiedades, monopolios){
		quitarZonaPropiedades()
		$("#propiedades").append("<div class='panel-body' id='zonaPropiedades'/>");

		var vistos = []
		propiedades.forEach(function (v,i,array){
			if (vistos.indexOf(v.tipo) == -1){
				$("#zonaPropiedades").append("<div id='zonaProp_" + v.tipo + "'><h4><span class='label label-primary'>" + v.tipo + "</span></h4></div>")
				vistos.push(v.tipo)
			}

			switch (v.tipo){
				case "Calle":
					if (vistos.indexOf(v.color) == -1){
						if (monopolios.indexOf(v.color) == -1)
							$("#zonaProp_" + v.tipo).append("<p><b>" + v.color.toUpperCase() + "</b></p><ul id='prop-" + v.color + "' class='list-group'></ul>")
						else
							$("#zonaProp_" + v.tipo).append("<p><b>" + v.color.toUpperCase() + "</b> <span class='label label-primary'><span class='glyphicon glyphicon-home'/> MONOPOLIO</span></p><ul id='prop-" + v.color + "' class='list-group'></ul>")

						vistos.push(v.color)
					}

					var cadena = "<li class='list-group-item'>" + v.nombre
					if (monopolios.indexOf(v.color) != -1)
						cadena = cadena + " <div class='btn-group btn-group-xs' role='group'>" +
							"<button id='demoler" + i + "_Btn' onclick='edificar()' class='btn btn-default btn-danger' title='Demoler'><span class='glyphicon glyphicon-minus'/></button>" +
							"<button class='btn btn-default'><span class='glyphicon glyphicon-home'/> " + v.numCasas + "</button>" +
							"<button id='edificar" + i + "_Btn' class='btn btn-default btn-success' title='Construir'><span class='glyphicon glyphicon-plus'/></button></div>"
					else
						cadena = cadena + " <button disabled class='btn btn-default btn-xs'><span class='glyphicon glyphicon-home'/> " + v.numCasas + "</button>"
					
					if (v.estado == "Hipotecada")
						cadena = cadena + " <span class='label label-danger'>Hipotecada</span></li>"
					else
						cadena = cadena + " <button id='hipotecar" + i + "_Btn' class='btn btn-default btn-xs'>Hipotecar</button></li>"

					$("#prop-" + v.color).append(cadena)

					$('#edificar' + i + '_Btn').on("click",function(){edificarPropiedad($.cookie("uid"), v.nombre)})
					$('#demoler' + i + '_Btn').on("click",function(){demolerPropiedad($.cookie("uid"), v.nombre)})
					$('#hipotecar' + i + '_Btn').on("click",function(){hipotecarPropiedad($.cookie("uid"), v.nombre)})
					break;
				default:
					if (v.estado == "Hipotecada")
						$("#zonaProp_" + v.tipo).append("<li class='list-group-item'>" + v.nombre +	" <span class='label label-danger'>Hipotecada</span></li>")
					else
						$("#zonaProp_" + v.tipo).append("<li class='list-group-item'>" + v.nombre + " <button id='hipotecar" + i + "_Btn' class='btn btn-default btn-xs'>Hipotecar</button></li>")
					$('#hipotecar' + i + '_Btn').on("click",function(){hipotecarPropiedad($.cookie("uid"), v.nombre)})			
			}			
		})
	}
}

FuncionesAuxiliares:{
	function eliminarCookies(){
		$.removeCookie("uid")
		$.removeCookie("datosTirada")
		$.removeCookie("saldo")
	}

	function showMsg(msg, callback){
		$('#myModalMsg').remove()
		$('#myModalBody').append("<p id='myModalMsg'>" + msg + "</p>")

		$('#myModalButton').remove()
		$('#myModalFooter').append("<button id='myModalButton' type='button' class='btn btn-primary' data-dismiss='modal'>Aceptar</button>")

		if(callback) $('#myModalButton').on("click", callback)

		$('#myModal').modal({ backdrop: 'static', keyboard: false })
	}

	function setAlert(tipo, msg){
		$("#avisos").append("<div id='zonaAvisos'></div>")
		$("#zonaAvisos").append("<div class='alert alert-"+tipo+" alert-dismissible' role='alert'>" +
			"<button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>" +
			msg + "</div>")
	}

	// Reinicia la pagina por no tener ficha
	function reiniciarSesion(msg){
		eliminarCookies()
		quitarZonaPedir()
		quitarZonaInicial()
		$("#nombre").remove()
		$("#nombreJugadorDefecto").remove()
		$("#nombreJugador").append("<h4 class='panel-title' id='nombreJugadorDefecto'>Bienvenido</h4>")	
		quitarZonaDatosJugador()
		quitarZonaMeToca()
		quitarZonaDados()
		quitarZonaPropiedades()
		quitarZonaAvisos()
		cargarTablero()
		showMsg(msg)
		mostrarBotonPedirFicha()
	}

	function comprobarTurno(datosFicha){
		quitarZonaInicial()
		quitarZonaMeToca()
		quitarZonaDados()

		if (datosFicha.turno == "MeToca")
			if (datosFicha.turnosCarcel == 0)
				mostrarBotonesMeToca()
			else
				mostrarBotonesCarcel(datosFicha.tarjetaCarcel)

		mostrarDatosJugador(datosFicha)
	}
}

//Funciones para comunicar con el servidor

Sockets: {
	socket.on("cambioTurno", function (data){
		refrescar($.cookie("uid"))
	})

	socket.on("nuevaPosicion", function (data){
		if (data.uidFicha != $.cookie("uid"))
			refrescar($.cookie("uid"))
	})
}

function obtenerFicha(nombre){
	if (nombre != "")
		$.getJSON(url+"nuevoJugador/"+nombre, function (data){
			if (data.error == 1)
				showMsg(data.msg)
			else{
				eliminarCookies()
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
			reiniciarSesion(data.msg)
		else{
			quitarZonaInicial()
			comprobarTurno(data.datosFicha)
		}
	})
}

function refrescar(uid){
	$.getJSON(url+"refrescar/"+uid, function (data){
		if (data.error == 1)
			reiniciarSesion(data.msg)
		else{
			comprobarTurno(data.datosFicha)
		}
	})
}

function lanzarDados(uid){
	//$.getJSON(url+"lanzarDados/"+uid, function (data){
	$.getJSON(url+"lanzarDadosTest/"+uid+"/3/2", function (data){
		if (data.error == 1)
			reiniciarSesion(data.msg)
		else{
			$.removeCookie("datosTirada")
			$.cookie("datosTirada", JSON.stringify(data.datosTirada))
			comprobarTurno(data.datosFicha)
			habilitarBotonesDadosTirados(data.datosTirada.dadosTirados)
			mostrarTirada(data.datosTirada.tirada)
			mostrarDatosCasilla(data.datosCasilla)

			if (data.datosTirada.salidaCarcel){
				console.log("aaaaaaa")
				setAlert("info", "Sale de la cárcel")
			}
		}
	})
}

function comprarPropiedad(uid){
	$.getJSON(url+"comprarPropiedad/"+uid, function (data){
		if (data.error == 1)
			reiniciarSesion(data.msg)
		else{
			mostrarDatosJugador(data.datosFicha)
		}
	})
}

function edificarPropiedad(uid, nombreCalle){
	$.getJSON(url+"edificarPropiedad/"+uid+"/"+nombreCalle, function (data){
		if (data.error == 1)
			reiniciarSesion(data.msg)
		else{
			mostrarDatosJugador(data.datosFicha)
		}
	})
}

function demolerPropiedad(uid, nombreCalle){
	$.getJSON(url+"demolerPropiedad/"+uid+"/"+nombreCalle, function (data){
		if (data.error == 1)
			reiniciarSesion(data.msg)
		else{
			mostrarDatosJugador(data.datosFicha)
		}
	})
}

function hipotecarPropiedad(uid, nombrePropiedad){
	var r = confirm("¿Quieres hipotecar "+nombrePropiedad+"?");
	if (r == true)
		$.getJSON(url+"hipotecarPropiedad/"+uid+"/"+nombrePropiedad, function (data){
			if (data.error == 1)
				reiniciarSesion(data.msg)
			else{
				mostrarDatosJugador(data.datosFicha)
			}
		})
}

function pasarTurno(uid){
	$.getJSON(url+"pasarTurno/"+uid, function (data){
		if (data.error == 1)
			reiniciarSesion(data.msg)
		else{
			$.removeCookie("datosTirada")
			quitarZonaAvisos()
		}
	})
}

function usarTarjetaLibreCarcel(uid){
	$.getJSON(url+"usarTarjetaLibreCarcel/"+uid, function (data){
		if (data.error == 1)
			reiniciarSesion(data.msg)
		else{
			comprobarTurno(data.datosFicha)
			setAlert("info", "Sale de la cárcel")
		}
	})
}

function pagarSalidaCarcel(uid){
	$.getJSON(url+"pagarSalidaCarcel/"+uid, function (data){
		if (data.error == 1)
			if (data.msg = "Saldo insuficiente")
				setAlert("info",data.msg)
			else
				reiniciarSesion(data.msg)
		else{
			comprobarTurno(data.datosFicha)
			setAlert("info", "Sale de la cárcel")
		}
	})
}


FuncionesParaDibujarTablero: {

	function cargarTablero(){
		var canvas = document.getElementById("micanvas");
		ctx = canvas.getContext("2d");
		maxX = canvas.width;
		maxY = canvas.height;
		img = new Image();
		img.src = "client/assets/img/tablero.png";
		ctx.drawImage(img,0,0);
		img.onload = function(){
			ctx.drawImage(img,0,0);
		}
	}

	function cargarFichas(numJug,callback){
		var cont = 0;

		for(var i=0;i<numJug;i++){
			var color = colorFicha[i];
			var imag = new Image();
			imag.src = "client/assets/img/ficha_"+color+".png";
			fichas[color] = imag;

			ctx.drawImage(fichas[color],maxX,maxY);
			fichas[color].onload = function(){				
				if (++cont >= numJug)
					callback();
			}
		}	
	}

	function cargarPropiedades(numJug,callback){
		var cont = 0;

		for(var i=0;i<numJug;i++){
			var color = colorFicha[i];
			var imag = new Image();
			imag.src = "client/assets/img/user_"+color+".png";			
			propietarios[color] = imag;
			var imag2 = new Image();
			imag2.src = "client/assets/img/user_"+color+"_h.png";			
			propietarios[color+"_h"] = imag2;

			ctx.drawImage(propietarios[color],maxX,maxY);
			propietarios[color].onload = function(){
				if (++cont >= numJug)
					callback();
			}
		}	
	}

	function cargarCoordenadas(){
		for(i=0;i<40;i++) ficha_coord[i] = []
		inc=55;

		ficha_coord[0].push(maxX-inc*1.5)
		ficha_coord[0].push(maxY-inc*1.5)

		ficha_coord[1].push(maxX-160)
		ficha_coord[1].push(maxY-inc*1.5);

		for(i=2;i<10;i++){
			ficha_coord[i].push(ficha_coord[1][0]-inc*(i-1))
			ficha_coord[i].push(maxY-inc*1.5)
		}			

		ficha_coord[10].push(inc*0.6)
		ficha_coord[10].push(maxY-inc*1.5);

		ficha_coord[11].push(inc*0.6)
		ficha_coord[11].push(maxY-160);

		for(i=12;i<20;i++){			
			ficha_coord[i].push(inc*0.6)
			ficha_coord[i].push(ficha_coord[11][1]-inc*(i-11))
		}
		
		ficha_coord[20].push(inc*0.6)
		ficha_coord[20].push(inc*0.6);

		ficha_coord[30].push(maxX-inc*1.5)
		ficha_coord[30].push(inc*0.6);

		ficha_coord[29].push(maxX-160)
		ficha_coord[29].push(inc*0.6);

		for(i=28;i>20;i--){
			ficha_coord[i].push(ficha_coord[29][0]-inc*(29-i))
			ficha_coord[i].push(inc*0.6)
		}

		ficha_coord[39].push(maxX-inc*1.5)
		ficha_coord[39].push(maxY-160);

		for(i=38;i>30;i--){
			ficha_coord[i].push(maxX-inc*1.5)
			ficha_coord[i].push(ficha_coord[39][1]-inc*(39-i))
		}

		cargarCoordenadasPropietario()
	}

	function cargarCoordenadasPropietario(){
		for(i=0;i<40;i++) propietario_coord[i] = []
		inc=55;
		inc2=95

		propietario_coord[1].push(maxX-160)
		propietario_coord[1].push(maxY-inc2*1.5);

		for(i=2;i<10;i++){
			propietario_coord[i].push(propietario_coord[1][0]-inc*(i-1))
			propietario_coord[i].push(maxY-inc2*1.5)
		}			

		propietario_coord[11].push(inc2*1.1)
		propietario_coord[11].push(maxY-160);

		for(i=12;i<20;i++){			
			propietario_coord[i].push(inc2*1.1)
			propietario_coord[i].push(propietario_coord[11][1]-inc*(i-11))
		}

		propietario_coord[29].push(maxX-160)
		propietario_coord[29].push(inc2*1.1);

		for(i=28;i>20;i--){
			propietario_coord[i].push(propietario_coord[29][0]-inc*(29-i))
			propietario_coord[i].push(inc2*1.1)
		}

		propietario_coord[39].push(maxX-inc2*1.5)
		propietario_coord[39].push(maxY-160);

		for(i=38;i>30;i--){
			propietario_coord[i].push(maxX-inc2*1.5)
			propietario_coord[i].push(propietario_coord[39][1]-inc*(39-i))
		}
	}

	function cargarCoordenadasEdificios(){
		for(i=0;i<40;i++) edificio_coord[i] = []
		inc=55;
		inc2=45

		edificio_coord[1].push(maxX-135)
		edificio_coord[1].push(maxY-inc2);

		for(i=2;i<10;i++){
			edificio_coord[i].push(edificio_coord[1][0]-inc*(i-1))
			edificio_coord[i].push(maxY-inc2)
		}			

		edificio_coord[11].push(inc2*0.2)
		edificio_coord[11].push(maxY-135);

		for(i=12;i<20;i++){			
			edificio_coord[i].push(inc2*0.2)
			edificio_coord[i].push(edificio_coord[11][1]-inc*(i-11))
		}

		edificio_coord[29].push(maxX-135)
		edificio_coord[29].push(inc2*0.2);

		for(i=28;i>20;i--){
			edificio_coord[i].push(edificio_coord[29][0]-inc*(29-i))
			edificio_coord[i].push(inc2*0.2)
		}

		edificio_coord[39].push(maxX-inc2*0.9)
		edificio_coord[39].push(maxY-138);

		for(i=38;i>30;i--){
			edificio_coord[i].push(maxX-inc2*0.9)
			edificio_coord[i].push(edificio_coord[39][1]-inc*(39-i))
		}
	}

	function ponerFichas(){
		var cont = 0
		var numFichasEnMismaCasilla = []
		var posicionesDibujadas = []

		/*for(i in posicionesDraw){
			var posicion = posicionesDraw[i]
			if (numFichasEnMismaCasilla.indexOf(posicion)){
			}
		}*/

		for(i in posicionesDraw){			
			var posicion = posicionesDraw[i]
			var color = colorFicha[cont]

			if (posicion>=0 && posicion<40){
				var x = ficha_coord[posicion][0];
				var y = ficha_coord[posicion][1];

				// Hay más de una ficha en una casilla
				if (posicionesDibujadas.indexOf(posicion) != -1){
					x = x - 20
					y = y - 20
				}
				/*if (posicionesDibujadas.indexOf(posicion)){
					if (posicion == 0 || posicion == 20){
						x = x - 20
						y = y
					}
					else{

					}
				}*/

				ctx.drawImage(fichas[color],x,y,30,30);
				posicionesDibujadas.push(posicion)
			}

			cont++
		}
	}

	function ponerPropiedades(){
		var cont = 0

		for(i in propiedadesDraw){			
			var propiedadesFicha = propiedadesDraw[i]
			var color = colorFicha[cont]

			propiedadesFicha.forEach(function (v,i,array){				
				if (v.posicion>=0 && v.posicion<40){
					var x = propietario_coord[v.posicion][0];
					var y = propietario_coord[v.posicion][1];

					if (v.estado == "Hipotecada")
						ctx.drawImage(propietarios[color+"_h"],x,y,20,20);
					else
						ctx.drawImage(propietarios[color],x,y,20,20);
				}				
			})

			cont++		
		}
	}

}