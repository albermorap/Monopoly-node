var url = "http://127.0.0.1:1337/";
//var url = "http://monopolyserver.cloudapp.net:80/";
var socket = io();

var colorFicha = ["azul","rojo","verde","amarillo","rosa","naranja"];
var ctx;

// Constantes
var PRECIO_EDIFICAR = 50
var PRECIO_DEMOLER = PRECIO_EDIFICAR * 0.5

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
		$.getJSON(url+"refrescar/" + $.cookie("uid"), function (data){
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
function quitarZonaJugadores(){$("#zonaJugadores").remove()}

function mostrarBotonesFaseInicial(){
	$("#botones").append(
		"<p id='zonaInicial'><button id='empezarPartida_Btn' class='btn btn-default'>Empezar partida</button></p>")
	$('#empezarPartida_Btn').on("click",function(){	
		empezarPartida($.cookie("uid"))
	})
}

function mostrarTirada(tirada){
	var cadena = "<h4 id='zonaDados' ><strong>DADOS: " + tirada[0] + " + " + tirada[1] + "</strong>"

	if (tirada[0] == tirada[1])
		cadena = cadena + " <span class='label label-info'>Dobles</span></h4>"
	else
		cadena = cadena + "</h4>"

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
		$('#usarTarjeta_Btn').prop('disabled', true)
		$('#pagarSalidaCarcel_Btn').prop('disabled', true)
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

	if (datosCasilla.infoPagoAFicha)
		setAlert("danger", "Has pagado <strong>"+datosCasilla.infoPagoAFicha.cantidad+" pelotis a "+datosCasilla.infoPagoAFicha.receptor+"</strong> por el alquiler")

	if (datosCasilla.cobroSalida)
		setAlert("success", "Ha pasado por la casilla de Salida. Reciba 200 pelotis")

	if ($.cookie("estadoCasilla") != "Libre")
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
		mostrarColor($.cookie("color"))
		mostrarSaldo(datosFicha.saldo)
		if (datosFicha.cantidadDeudas > 0)
			mostrarDeudas(datosFicha.saldo, datosFicha.cantidadDeudas)		
		if (datosFicha.turnosCarcel > 0)
			mostrarTurnosEnCarcel(datosFicha.turnosCarcel)

		if ($.cookie("estadoCasilla") != "Libre")
			$('#comprarPropiedad_Btn').prop('disabled', true)

		mostrarPropiedades(datosFicha.propiedades, datosFicha.monopolios)

		mostrarDatosPartida(datosFicha.datosPartida)
	}

	function mostrarDatosPartida(datosPartida){
		$("#nombrePartida").html(datosPartida.nombrePartida)
		posicionesDraw = datosPartida.posicionesFichas
		propiedadesDraw = datosPartida.propiedadesGlobales

		dibujarTableroConDatos(datosPartida.fichas.length)
		$.cookie("jugadores", JSON.stringify(datosPartida.fichas))
		mostrarJugadores(datosPartida.fichas)
	}

	function mostrarNombre(nombre){
		$("#nombreJugador").html("Bienvenido, "+nombre)
	}

	function mostrarColor(color){
		$("#zonaDatosJugador").append("<img height='50' width='50' src='client/assets/img/ficha_" + color + ".png'>")
	}

	function mostrarSaldo(saldo){
		if (saldo == -1){
			$("#zonaDatosJugador").append("<h4><strong>SALDO: </strong><span class='label label-danger'>En bancarrota</span></h4>")
		}
		else{
			if ($.cookie("saldo")){
				if ($.cookie("saldo") < saldo)
					$("#zonaDatosJugador").append("<h4 id='info_saldo'><strong>SALDO: "+saldo+" pelotis</strong> <span class='label label-success'><span class='glyphicon glyphicon-arrow-up'/> "+(saldo-$.cookie("saldo"))+"</span></h4>")	
				else if ($.cookie("saldo") > saldo)
					$("#zonaDatosJugador").append("<h4 id='info_saldo'><strong>SALDO: "+saldo+" pelotis</strong> <span class='label label-danger'><span class='glyphicon glyphicon-arrow-down'/> "+($.cookie("saldo")-saldo)+"</span></h4>")
				else
					$("#zonaDatosJugador").append("<h4 id='info_saldo'><strong>SALDO: "+saldo+" pelotis</strong></h4>")
			}
		}

		$.cookie("saldo", saldo)		
	}

	function mostrarDeudas(saldo, cantidad){
		showMsg("<span class='label label-danger'>ATENCIÓN</span> Debe "+cantidad+" pelotis. En caso de pases el turno sin pagar será declarado en bancarrota.")
		$("#info_saldo").html("<strong>SALDO: "+saldo+" pelotis</strong> <span class='label label-danger'>Debe "+cantidad+" pelotis</span>")
	}

	function mostrarTurnosEnCarcel(turnosCarcel){
		$("#zonaDatosJugador").append("<h4><span class='label label-danger'>Turnos en cárcel <span class='badge'>"+turnosCarcel+"</span></span></h4>")	
	}

	function mostrarPosicion(posicion){
		$("#zonaDatosJugador").append("<p>Posicion: "+posicion+"</p>")	
	}

	function mostrarJugadores(fichas){
		quitarZonaJugadores()
		$("#jugadoresTabla").append("<tbody id='zonaJugadores'></tbody>")

		for (i in fichas){
			$("#zonaJugadores").append("<tr id='jugador_"+fichas[i].color+"'>" +
						"<th scope='row'><img height='30' width='30' src='client/assets/img/user_" + fichas[i].color + ".png'></th>" +						
						"<td>" + fichas[i].nombre + "</td></tr>")

			if (fichas[i].turno == "MeToca")
				$("#jugador_"+fichas[i].color).attr('class', 'success')

			if (fichas[i].enBancarrota)
				$("#jugador_"+fichas[i].color).attr('class', 'danger')
		}
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
							$("#zonaProp_" + v.tipo).append("<p class='text-uppercase'><strong>" + v.color + "</strong></p><ul id='prop-" + v.color + "' class='list-group'></ul>")
						else
							$("#zonaProp_" + v.tipo).append("<p class='text-uppercase'><strong>" + v.color + "</strong> <span class='label label-info'><span class='glyphicon glyphicon-home'/> MONOPOLIO</span></p><ul id='prop-" + v.color + "' class='list-group'></ul>")

						vistos.push(v.color)
					}

					var cadena = "<li class='list-group-item'>" + v.nombre
					if (monopolios.indexOf(v.color) != -1)
						cadena = cadena + " <div class='btn-group btn-group-xs' role='group'>" +
							"<button id='demoler" + i + "_Btn' onclick='edificar()' class='btn btn-default btn-danger' title='Demoler: +"+PRECIO_DEMOLER+" pelotis'><span class='glyphicon glyphicon-minus'/></button>" +
							"<button id='numCasas" + i + "_Btn' class='btn btn-default'><span class='glyphicon glyphicon-home'/> " + v.numCasas + "</button>" +
							"<button id='edificar" + i + "_Btn' class='btn btn-default btn-success' title='Construir: -"+PRECIO_EDIFICAR+" pelotis'><span class='glyphicon glyphicon-plus'/></button></div>"
					else
						cadena = cadena + " <button disabled class='btn btn-default btn-xs'><span class='glyphicon glyphicon-home'/> " + v.numCasas + "</button>"
					
					if (v.estado == "Hipotecada"){
						cadena = cadena + " <button id='subastar" + i + "_Btn' class='btn btn-default btn-xs'>Subastar</button>" +
							 " <span class='label label-danger'>Hipotecada</span></li>"
					}
					else{
						cadena = cadena + " <button id='hipotecar" + i + "_Btn' class='btn btn-default btn-xs' title='+ "+(v.precio*0.5)+" pelotis'>Hipotecar</button>" +
							"<button id='vender" + i + "_Btn' class='btn btn-default btn-xs' title='Valor: "+v.precio+" pelotis'>Vender</button></li>"
					}

					$("#prop-" + v.color).append(cadena)

					$('#edificar' + i + '_Btn').on("click",function(){edificarPropiedad($.cookie("uid"), v.nombre)})
					$('#demoler' + i + '_Btn').on("click",function(){demolerPropiedad($.cookie("uid"), v.nombre)})		

					switch (v.numCasas){
						case 0:
							$('#demoler' + i + '_Btn').prop('disabled', true)
							$('#hipotecar' + i + '_Btn').on("click",function(){hipotecarPropiedad($.cookie("uid"), v.nombre)})
							break;
						case 5:
							$('#edificar' + i + '_Btn').prop('disabled', true)
							$('#hipotecar' + i + '_Btn').on("click",function(){showMsg("No puede hipotecar la propieda porque tiene un hotel")})
							$('#numCasas' + i + '_Btn').html("<span class='glyphicon glyphicon-home'/> Hotel")
							break;
						default:
							$('#hipotecar' + i + '_Btn').on("click",function(){showMsg("No puede hipotecar la propieda porque tiene "+v.numCasas+" casa/s")})
					}

					break;
				default:
					if (v.estado == "Hipotecada")
						$("#zonaProp_" + v.tipo).append("<li class='list-group-item'>" + v.nombre +	" <button id='subastar" + i + "_Btn' class='btn btn-default btn-xs'>Subastar</button>" +
							" <span class='label label-danger'>Hipotecada</span></li>")
					else{
						$("#zonaProp_" + v.tipo).append("<li class='list-group-item'>" + v.nombre + " <button id='hipotecar" + i + "_Btn' class='btn btn-default btn-xs' title='+ "+(v.precio*0.5)+" pelotis'>Hipotecar</button>" +
							"<button id='vender" + i + "_Btn' class='btn btn-default btn-xs' title='Vender a otro jugador'>Vender</button></li>")
					}
					$('#hipotecar' + i + '_Btn').on("click",function(){hipotecarPropiedad($.cookie("uid"), v.nombre)})			
			}

			$('#vender' + i + '_Btn').on("click",function(){ofertarVentaPropiedad($.cookie("uid"), v.nombre)})
			$('#subastar' + i + '_Btn').on("click",function(){comenzarSubasta($.cookie("uid"), v.nombre)})	
		})
	}
}

FuncionesAuxiliares:{
	function eliminarCookies(){
		$.removeCookie("uid")
		$.removeCookie("color")
		$.removeCookie("datosTirada")
		$.removeCookie("saldo")
		$.removeCookie("estadoCasilla")
		$.removeCookie("jugadores")
	}

	function showMsg(msg, callback){
		$('#myModalBody').html("<p>" + msg + "</p>")

		$('#myModalFooter').html("<button id='myModalButton' type='button' class='btn btn-primary' data-dismiss='modal'>Aceptar</button>")

		if(callback) $('#myModalButton').on("click", callback)

		$('#myModal').modal({ backdrop: 'static', keyboard: false })
	}

	function showMsgSiNo(header, msg, callback){
		$('#modalSiNoHeader').html(header)
		$('#modalSiNoBody').html("<p>" + msg + "</p>")

		$('#modalSiNoFooter').html("<button id='modalSiNo_siButton' type='button' class='btn btn-primary' data-dismiss='modal'>Sí</button>" +
								 "<button type='button' class='btn btn-default' data-dismiss='modal'>No</button>")

		$('#modalSiNo_siButton').on("click", callback)

		$('#modalSiNo').modal({ backdrop: 'static', keyboard: false })
	}

	function showMsgPuja(info, callback){
		if (info){
			$('#infoSubasta').html("<p>" + info + "</p>")

			$('#modalSubastaFooter').html("<button id='modalSubasta_pujarButton' type='button' class='btn btn-primary'>Pujar</button>" +
									 "<button id='modalSubasta_abandonarButton' type='button' class='btn btn-default'>Abandonar subasta</button>")

			$('#modalSubasta_pujarButton').on("click", callback)
			$('#modalSubasta_abandonarButton').on("click", function(){pujar($.cookie("uid"), -1)})
		}

		$('#modalSubasta').modal({ backdrop: 'static', keyboard: false })
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
		$("#nombreJugador").html("Bienvenido")
		quitarZonaDatosJugador()
		quitarZonaJugadores()
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

	function mostrarGanador(nombreGanador, msg){
		$('#ganadoAlert').prop('hidden', false)
		if (nombreGanador == false)
			$('#ganadoAlert').html("<h3 class='text-center'><strong>¡¡Fin de la partida!! Nadie ha ganado</strong></h3>")
		else
			$('#ganadoAlert').html("<h3 class='text-center'><strong>"+msg+"</strong></h3>")
	}
}

//Funciones para comunicar con el servidor

Sockets: {
	socket.on("nuevoJugador", function (data){
		mostrarJugadores(data.jugadores)
	})

	socket.on("empiezaPartida", function (data){
		if (data.color == $.cookie("color"))
			empezarPartida($.cookie("uid"))
	})

	socket.on("partidaEmpezada", function (data){
		if ($.cookie("uid") != undefined)
			refrescar($.cookie("uid"))
	})

	socket.on("cambioTurno", function (data){
		if ($.cookie("uid") != undefined)
			refrescar($.cookie("uid"))
	})

	socket.on("nuevaPosicion", function (data){
		if ($.cookie("uid") != undefined && data.color != $.cookie("color"))
			refrescar($.cookie("uid"))
	})

	socket.on("finPartida", function (data){
		if ($.cookie("uid") != undefined){
			showMsg("¡¡Fin de la partida!!", function(){refrescar($.cookie("uid"))})			
			mostrarGanador(data.nombreGanador, data.msg)
		}			
	})

	socket.on("ofertaVentaPropiedad", function (data){
		if ($.cookie("uid") != undefined && data.colorComprador == $.cookie("color")){
			var callback = function(){aceptarOfertaVentaPropiedad($.cookie("uid"), data.nombrePropiedad, data.colorVendedor, data.cantidad)}
			showMsgSiNo("Venta de propiedad",
				"¿Acepta la venta que ofrece "+data.nombreVendedor+" de la propiedad "+data.nombrePropiedad+" por "+data.cantidad+" pelotis?", callback)
		}
	})

	socket.on("ventaPropiedad", function (data){
		if ($.cookie("uid") != undefined){
			if (data.colorVendedor == $.cookie("color"))
				showMsg(data.nombreComprador+" ha aceptado la venta de "+data.nombrePropiedad, function(){inicio()})
			else
				showMsg(data.nombreVendedor+" acaba de vender la propiedad "+data.nombrePropiedad+" a "+data.nombreComprador)
		}
	})

	socket.on("comienzaSubasta", function (data){
		if ($.cookie("uid") != undefined){
			if (data.colorTurno == $.cookie("color"))
				showMsgPuja("Comienza la subasta de "+data.nombrePropiedad+" que tiene un valor de "+data.valor+". Realice su puja.", function(){pujar($.cookie("uid"))})
			else
				showMsg("Ha comenzado una subasta de la propiedad "+data.nombrePropiedad)
		}
	})

	socket.on("nuevaPuja", function (data){
		if ($.cookie("uid") != undefined){
			if (data.colorTurno == $.cookie("color"))
				showMsgPuja("Subasta de "+data.nombrePropiedad+" que tiene un valor de "+data.valor+
					". Última puja de "+data.jugador+" por "+data.cantidadPujada+" pelotis. Realice su puja.", function(){pujar($.cookie("uid"))})
		}
	})

	socket.on("finSubasta", function (data){
		if ($.cookie("uid") != undefined){
			showMsg(data.ganador +" ha ganado la subasta", function(){refrescar($.cookie("uid"))})
		}
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
				$.cookie("color", data.datosFicha.color)

				quitarZonaPedir()				
				mostrarBotonesFaseInicial()
				mostrarDatosJugador(data.datosFicha)

				socket.emit('conectado', {"nombreJugador":data.datosFicha.nombre, "colorJugador":data.datosFicha.color})
			}		
		})
}

function empezarPartida(uid){
	$.getJSON(url+"empezarPartida/"+uid, function (data){
		if (data.error == 1)
			reiniciarSesion(data.msg)
		else if (data.error == 2)
			showMsg(data.msg)
	})
}

function refrescar(uid){
	$.getJSON(url+"refrescar/"+uid, function (data){
		if (data.error == 1)
			reiniciarSesion(data.msg)
		else{
			comprobarTurno(data.datosFicha)
			if ($.cookie("datosTirada")){
				mostrarTirada(JSON.parse($.cookie("datosTirada")).tirada)
				habilitarBotonesDadosTirados(JSON.parse($.cookie("datosTirada")).dadosTirados)
			}
		}
	})
}

function lanzarDados(uid){
	$.getJSON(url+"lanzarDados/"+uid, function (data){
	//$.getJSON(url+"lanzarDadosTest/"+uid+"/1/-1", function (data){
		if (data.error == 1)
			reiniciarSesion(data.msg)
		else if (data.error == 2)
			showMsg(data.msg)
		else{
			$.removeCookie("datosTirada")
			$.cookie("datosTirada", JSON.stringify(data.datosTirada))
			$.cookie("estadoCasilla", data.datosCasilla.estado)
			comprobarTurno(data.datosFicha)
			habilitarBotonesDadosTirados(data.datosTirada.dadosTirados)
			mostrarTirada(data.datosTirada.tirada)
			mostrarDatosCasilla(data.datosCasilla)

			if (data.datosTirada.salidaCarcel)
				setAlert("info", "Sale de la cárcel")
		}
	})
}

function comprarPropiedad(uid){
	$.getJSON(url+"comprarPropiedad/"+uid, function (data){
		if (data.error == 1)
			reiniciarSesion(data.msg)
		else if (data.error == -1)
			showMsg(data.msg)
		else{
			$.cookie("estadoCasilla","Comprada")
			mostrarDatosJugador(data.datosFicha)
		}
	})
}

function edificarPropiedad(uid, nombreCalle){
	$.getJSON(url+"edificarPropiedad/"+uid+"/"+nombreCalle, function (data){
		if (data.error == 1)
			reiniciarSesion(data.msg)
		else if (data.error == -1)
			showMsg(data.msg)
		else{
			if (data.error == 2)
				showMsg(data.msg)
			else
				mostrarDatosJugador(data.datosFicha)
		}
	})
}

function demolerPropiedad(uid, nombreCalle){
	$.getJSON(url+"demolerPropiedad/"+uid+"/"+nombreCalle, function (data){
		if (data.error == 1)
			reiniciarSesion(data.msg)
		else if (data.error == -1)
			showMsg(data.msg)
		else{
			if (data.error == 2)
				showMsg(data.msg)
			else
				mostrarDatosJugador(data.datosFicha)
		}
	})
}

function hipotecarPropiedad(uid, nombrePropiedad){
	var callback = function(){
		$.getJSON(url+"hipotecarPropiedad/"+uid+"/"+nombrePropiedad, function (data){
			if (data.error == 1)
				reiniciarSesion(data.msg)
			else if (data.error == -1)
				showMsg(data.msg)
			else if (data.error == 2)
				showMsg(data.msg)
			else
				mostrarDatosJugador(data.datosFicha)
		})
	}
	showMsgSiNo("Hipotecar propiedad", "¿Quieres hipotecar "+nombrePropiedad+"?", callback)
}

function comenzarSubasta(uid, nombrePropiedad){
	$.getJSON(url+"subastar/"+uid+"/"+nombrePropiedad, function (data){
		if (data.error == 1)
			reiniciarSesion(data.msg)
		else if (data.error == -1)
			showMsg(data.msg)
	})
}

function pujar(uid, cantidad){
	if ((parseInt($("#input_puja").val()) && parseInt($("#input_puja").val()) > 0) || cantidad){
		var cantidadPuja
		if (cantidad == -1)
			cantidadPuja = -1						
		else
			cantidadPuja = $("#input_puja").val()

		$.getJSON(url+"pujar/"+uid+"/"+cantidadPuja, function (data){
			switch(data.error){
				case "1": reiniciarSesion(data.msg);break;
				case "0":
					$('#modalSubasta').modal('toggle')
					$('#label_puja').html("Puja")
					break;
				default: $('#label_puja').html("Puja <span class='label label-danger'>"+data.msg+"</span>");
			}
		})
	}
	else
		$('#label_puja').html("Puja <span class='label label-danger'>Puja no válida</span>")

	$("#input_puja").val('')	
}

function ofertarVentaPropiedad(uid, nombrePropiedad){	
	var cadena = "<option value='' selected>¿A quién?</option>"
	var lista = JSON.parse($.cookie("jugadores")) 
	for (i in lista){
		if ($.cookie("color") != lista[i].color && !lista[i].enBancarrota)
			cadena +=  "<option value='"+lista[i].color+"'>Ficha "+lista[i].color+" - "+lista[i].nombre+"</option>"
	}
	$('#select_colorComprador').html(cadena)

	$('#modalVentaPropiedadFooter').html("<button id='modalVentaPropiedad_EnviarButton' type='button' class='btn btn-primary' data-dismiss='modal'>Enviar oferta</button>" +
		"<button type='button' class='btn btn-default' data-dismiss='modal'>Cancelar</button>")

	$('#modalVentaPropiedad_EnviarButton').on("click", function(){
		var colorComprador = $("#select_colorComprador").val()
		var cantidad = $("#input_cantidadVenta").val()

		if (colorComprador == ""){
			showMsg("No has elegido ningún jugador", function(){
				ofertarVentaPropiedad(uid, nombrePropiedad)
			})
		}
		else if (parseInt(cantidad) && cantidad >= 0)
		{
			$.getJSON(url+"ofertarVentaPropiedad/"+uid+"/"+nombrePropiedad+"/"+colorComprador+"/"+cantidad, function (data){
				if (data.error == 1)
					reiniciarSesion(data.msg)
				else if (data.error == -1)
					showMsg(data.msg)
				else{
					showMsg("Ha enviado la oferta al comprador correctamente. Espere su respuesta")
				}
			})
		}
		else
			showMsg("La cantidad introducida no es válida", function(){
				ofertarVentaPropiedad(uid, nombrePropiedad)
			})
	})

	$("#input_cantidadVenta").val('')

	$('#modalVentaPropiedad').modal({ backdrop: 'static', keyboard: false })
}

function aceptarOfertaVentaPropiedad(uid, nombrePropiedad, colorVendedor, cantidad){
	$.getJSON(url+"aceptarOfertaVentaPropiedad/"+uid+"/"+nombrePropiedad+"/"+colorVendedor+"/"+cantidad, function (data){
		if (data.error == 1)
			reiniciarSesion(data.msg)
		else{
			if (data.error != 0)
				showMsg(data.msg)
			else
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
			reiniciarSesion(data.msg)
		else if (data.error == 1)
			setAlert("info",data.msg)
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