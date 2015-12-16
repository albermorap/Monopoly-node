Constantes: {
	var DEUDA_NO_REQUERIDA = -1
	var DEUDA_REQUERIDA = 0
	var PRECIO_EDIFICAR = 50
}

function FactoryMethod(){
	this.crearTablero = function(numeroCasillas){return new Tablero(40)}
	this.crearDado = function(){return new Dado()}
	this.crearFicha = function(usuario, partida, color){return new Ficha(usuario, partida, color)}
	this.crearTituloPropiedad = function(propiedad){return new TituloPropiedad(propiedad)}
}

FasesPartida: {
	function FaseInicial(){
		this.solicitarNuevoJugador = function(partida, usuario){return partida.crearJugador(usuario)}
		this.empezar = function(partida){
			partida.calcularPrimerTurno(false)			
			console.log(partida.getNombre() + ":  COMIENZA")
		}
		this.lanzarDados = function(partida){console.log("La partida " + partida.getNombre() + " aún no ha comenzado.")}
	}

	function FaseJugar(){
		this.solicitarNuevoJugador = function(partida, usuario){
			usuario.setInfo("La partida " + partida.getNombre() + " ya está empezada y no se permiten nuevos jugadores.")
		}
		this.empezar = function(partida){console.log("La partida " + partida.getNombre() + " ya está empezada.")}
		this.lanzarDados = function(partida){return partida.lanzarDados()}
	}

	function FaseFinal(){
		this.solicitarNuevoJugador = function(partida, usuario){
			usuario.setInfo("La partida " + partida.getNombre() + " ha finalizado y no se permiten nuevos jugadores.")
		}
		this.empezar = function(partida){console.log("La partida " + partida.getNombre() + " ha finalizado.")}
		this.lanzarDados = function(partida){console.log("La partida " + partida.getNombre() + " ha finalizado.")}
	}
}


function Partida(nombre){
	this.nombre = nombre
	this.tablero = (new FactoryMethod).crearTablero(40)
	this.dado = (new FactoryMethod).crearDado()
	this.fichas = []
	this.coloresFichas = ["azul","rojo","verde","amarillo","rosa","naranja"]
	this.fase = new FaseInicial()
	this.turno = -1 // Almacena el índice de la ficha que posee el turno
	var numCasas = 32
	var numHoteles = 12
	this.cajaTarjetasComunidad
	this.cajaTarjetasSuerte

	this.getNombre = function(){return "Partida " + this.nombre}
	this.getFase = function(){return this.fase}
	this.getTurno = function(){return this.turno}
	this.getFichaConTurno = function(){return this.fichas[this.turno]}
	this.getNumCasas = function(){return numCasas}
	this.getNumHoteles = function(){return numHoteles}
	this.getFicha = function(uid){
		var ficha = this.fichas.filter(function (v,i,array){return v.getUsuario().getUid() == uid})
		if (ficha.length == 1)
			return ficha[0]
	}

	this.generarCajaTarjetas = function(){
		var inicial = [new LibreCarcel(), new Avanzar(3), new Retroceder(3), new Pagar(50), new Cobrar(50)]
		var caja = []

		while (inicial.length > 0){
			var alea = Math.round(Math.random() * (inicial.length - 1))
			caja.push(inicial.splice(alea,1)[0]) // splice devuelve un array con el elemento que quita
		}	

		return caja
	}
	this.getTarjeta = function(clase){
		var tarjeta

		if (clase == "suerte"){
			tarjeta = this.cajaTarjetasSuerte.shift()
			this.cajaTarjetasSuerte.push(tarjeta)
		}
		else {
			tarjeta = this.cajaTarjetasComunidad.shift()
			this.cajaTarjetasComunidad.push(tarjeta)
		}

		return tarjeta
	}

	this.solicitarNuevoJugador = function(usuario){return this.fase.solicitarNuevoJugador(this, usuario)}
	this.crearJugador = function(usuario){
		if (this.fichas.length != this.coloresFichas.length){
			var ficha = (new FactoryMethod).crearFicha(usuario, this, this.coloresFichas[this.fichas.length])
			this.fichas.push(ficha)
			console.log(this.getNombre() + ":  NUEVO JUGADOR - " + usuario.getNombre())
			return ficha
		}			
		else
			usuario.setInfo("No hay fichas disponibles")
	}

	this.empezar = function(){this.fase.empezar(this)}
	this.calcularPrimerTurno = function(test){
		var maxTirada = 0, index = 0

		this.fase = new FaseJugar()
		this.cajaTarjetasComunidad = this.generarCajaTarjetas()
		this.cajaTarjetasSuerte = this.generarCajaTarjetas()		

		// En el modo test le damos el turno al primer jugador
		if (!test){
			for (var i=0; i<this.fichas.length; i++){
				var tirada = this.lanzarDados()
				//console.log("Tirada del jugador " + this.fichas[i].getUsuario().getNombre() + ": " + tirada[0] + " + " + tirada[1])
				tirada = tirada[0] + tirada[1]
				if (tirada > maxTirada){
					maxTirada = tirada
					index = i
				}
			}			
		}

		this.turno = index		
		this.fichas[this.turno].setTurno(new MeToca())
		console.log(this.getNombre() + ":  PRIMER TURNO - " + this.fichas[this.turno].getUsuario().getNombre())
	}	

	// Devuelve los dos resultados y no la suma
	this.solicitarLanzarDados = function(){return this.fase.lanzarDados(this)}
	this.lanzarDados = function(){return [this.dado.lanzar(), this.dado.lanzar()]}

	this.moverFicha = function(ficha, num){
		var antiguaPosicion = ficha.getPosicion()
		var nuevaPosicion = (antiguaPosicion + num) % this.tablero.numeroCasillas		
		
		if (nuevaPosicion < 0)
			nuevaPosicion = this.tablero.numeroCasillas + nuevaPosicion

		ficha.setPosicion(nuevaPosicion)
		console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  HA CAIDO EN CASILLA - " + nuevaPosicion)

		// Ha pasado por la casilla de salida sin caer en ella
		if (nuevaPosicion != 0 && nuevaPosicion <= antiguaPosicion)
			this.cobrarDineroSalida(ficha)

		this.tablero.getCasilla(nuevaPosicion).caer(ficha);
	}

	this.comprarPropiedad = function(ficha){this.tablero.getCasilla(ficha.getPosicion()).comprar(ficha)}
	this.comprarCasa = function(){
		var aux = numCasas - 1
		if (aux >= 0){
			numCasas--
			return true
		}
		else{
			console.log("No quedan casas.")
			return false
		}
			
	}
	this.comprarHotel = function(){
		var aux = numHoteles - 1
		if (aux >= 0){
			numHoteles--
			return true
		}
		else{
			console.log("No quedan hoteles.")
			return false
		}
	}

	this.devolverCasa = function(){numCasas++}
	this.devolverHotel = function(){numHoteles++}


	this.comprobarMonopolio = function(ficha, calle){
		var propMismoColor = calle.getPropietario().getPropiedades().filter(function (v,i,array){return v.getPropiedad().getColor() == calle.getColor()})
		if (propMismoColor.length == this.tablero.numeroColoresCalles[calle.getColor()]){
			ficha.setMonopolio(calle.getColor())
			ficha.setInfo("CONSEGUIDO MONOPOLIO " + calle.getColor())
			console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  MONOPOLIO - " + calle.getColor())
		}
	}

	this.cobrarDineroSalida = function(ficha){
		ficha.setInfo("HA PASADO POR LA CASILLA DE SALIDA - cobra 200 pelotis")
		console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  HA PASADO POR LA CASILLA DE SALIDA - cobra 200 pelotis")
		ficha.cobrar(200)
	}

	this.cambiarTurno = function(){
		this.fichas[this.turno].setTurno(new NoMeToca()) // Quitamos turno

		if (!this.comprobarGanador()){
			this.turno = (this.turno + 1) % this.fichas.length

			// Si está en bancarrota pasamos le saltamos
			if (this.fichas[this.turno].enBancarrota())
				this.turno = (this.turno + 1) % this.fichas.length

			this.fichas[this.turno].setTurno(new MeToca()) // Damos el turno al siguiente
			console.log(this.getNombre() + ":  TURNO DE - " + this.getFichaConTurno().getUsuario().getNombre())
		}
	}

	this.comprobarGanador = function(){
		var ganador = this.fichas.filter(function (v,i,array){return !v.enBancarrota()})
		var hayGanador = false

		// fichas >= 2 - Para que las partidad de un jugador no gane en el primer turno
		if (this.fichas.length >= 2 && ganador.length == 1)
			hayGanador = this.finalizarPartida(ganador[0])
		else{
			ganador = this.fichas.filter(function (v,i,array){return v.getSaldo() >= 20000})

			if (ganador.length > 0)
				hayGanador = this.finalizarPartida(ganador[0])
		}

		return hayGanador
	}

	this.finalizarPartida = function(ganador){
		this.fase = new FaseFinal()
		this.fichas.forEach(function (v,i,array){v.setGanador(ganador == v)})
		console.log(this.getNombre() + ":  FIN PARTIDA, GANADOR - " + ganador.getUsuario().getNombre())

		return true
	}
}

function Dado(){
	this.lanzar = function(){return Math.round(Math.random()*5) + 1}
}

Comando: {
	function Avanzar(numCasillas){
		this.numCasillas = numCasillas
		this.ejecutar = function(ficha){
			ficha.setInfo("TARJETA AVANZAR - " + this.numCasillas + " casillas")
			console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  TARJETA AVANZAR - " + this.numCasillas + " casillas")
			ficha.getPartida().moverFicha(ficha, this.numCasillas)
		}
	}

	function Retroceder(numCasillas){
		this.numCasillas = numCasillas
		this.ejecutar = function(ficha){
			ficha.setInfo("TARJETA RETROCEDER - " + this.numCasillas + " casillas")
			console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  TARJETA RETROCEDER - " + this.numCasillas + " casillas")
			ficha.getPartida().moverFicha(ficha, -this.numCasillas)
		}
	}

	function Pagar(cantidad){
		this.cantidad = cantidad
		this.ejecutar = function(ficha){
			ficha.setInfo("TARJETA PAGAR - " + this.cantidad + " pelotis")
			console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  TARJETA PAGAR - " + this.cantidad + " pelotis")
			ficha.pagar(cantidad, DEUDA_REQUERIDA)
		}
	}

	function Cobrar(cantidad){
		this.cantidad = cantidad
		this.ejecutar = function(ficha){
			ficha.setInfo("TARJETA COBRAR - " + this.cantidad + " pelotis")
			console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  TARJETA COBRAR - " + this.cantidad + " pelotis")
			ficha.cobrar(cantidad)
		}
	}

	function LibreCarcel(){
		this.ejecutar = function(ficha){
			ficha.setInfo("TARJETA LIBRE CÁRCEL - obtiene la tarjeta")
			console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  TARJETA LIBRE CÁRCEL - obtiene la tarjeta")
			ficha.setTarjetaLibreCarcel(true)
		}
	}
}

Tablero: {

	function Tablero(numeroCasillas){
		this.casillas
		this.numeroCasillas = numeroCasillas
		this.numeroColoresCalles = []

		this.agregarCasilla = function(posicion, casilla){
			this.casillas[posicion] = casilla
		}

		this.getCasilla = function(posicion){return this.casillas[posicion]}

		this.iniciar = function(){
			this.casillas = []
			this.numeroColoresCalles["marron"] = 2
			this.numeroColoresCalles["azulClaro"] = 3
			this.numeroColoresCalles["rosa"] = 3
			this.numeroColoresCalles["naranja"] = 3
			this.numeroColoresCalles["rojo"] = 3
			this.numeroColoresCalles["amarillo"] = 3
			this.numeroColoresCalles["verde"] = 3
			this.numeroColoresCalles["azul"] = 2

			this.agregarCasilla(0, new Casilla(new Salida()))
			this.agregarCasilla(1, new Casilla(new Calle("marron", "Ronda de Valencia", 60)))
			this.agregarCasilla(2, new Casilla(new Tarjeta("comunidad")))
			this.agregarCasilla(3, new Casilla(new Calle("marron", "Plaza Lavapies", 60)))
			this.agregarCasilla(4, new Casilla(new Impuesto(200)))
			this.agregarCasilla(5, new Casilla(new Estacion("Estacion de Goya", 200)))
			this.agregarCasilla(6, new Casilla(new Calle("azulClaro", "Glorieta Cuatro Caminos", 100)))
			this.agregarCasilla(7, new Casilla(new Tarjeta("suerte")))
			this.agregarCasilla(8, new Casilla(new Calle("azulClaro", "Avenida Reina Sofia", 100)))
			this.agregarCasilla(9, new Casilla(new Calle("azulClaro", "Calle Bravo Murillo", 120)))
			
			this.agregarCasilla(10, new Casilla(new Carcel()))
			this.agregarCasilla(11, new Casilla(new Calle("rosa", "Glorieta de Bilbao", 140)))
			this.agregarCasilla(12, new Casilla(new ServicioPublico("Compañia de Electricidad")))
			this.agregarCasilla(13, new Casilla(new Calle("rosa", "Calle Alberto Aguilera", 140)))
			this.agregarCasilla(14, new Casilla(new Calle("rosa", "Calle Fuencarral", 160)))
			this.agregarCasilla(15, new Casilla(new Estacion("Estacion de las Delicias", 200)))
			this.agregarCasilla(16, new Casilla(new Calle("naranja", "Avenida Felipe II", 180)))
			this.agregarCasilla(17, new Casilla(new Tarjeta("comunidad")))
			this.agregarCasilla(18, new Casilla(new Calle("naranja", "Calle Velazquez", 180)))
			this.agregarCasilla(19, new Casilla(new Calle("naranja", "Calle Serrano", 200)))
			
			this.agregarCasilla(20, new Casilla(new Parking()))
			this.agregarCasilla(21, new Casilla(new Calle("rojo", "Avenida de America", 220)))
			this.agregarCasilla(22, new Casilla(new Tarjeta("suerte")))
			this.agregarCasilla(23, new Casilla(new Calle("rojo", "Calle Maria de Molina", 220)))
			this.agregarCasilla(24, new Casilla(new Calle("rojo", "Calle Cea Bermudez", 240)))
			this.agregarCasilla(25, new Casilla(new Estacion("Estacion del Mediodia", 200)))
			this.agregarCasilla(26, new Casilla(new Calle("amarillo", "Avenida Los Reyez Catolicos", 260)))
			this.agregarCasilla(27, new Casilla(new Calle("amarillo", "Calle Bailen", 260)))
			this.agregarCasilla(28, new Casilla(new ServicioPublico("Compañia de Aguas")))
			this.agregarCasilla(29, new Casilla(new Calle("amarillo", "Plaza de España", 280)))
			
			this.agregarCasilla(30, new Casilla(new IrCarcel()))
			this.agregarCasilla(31, new Casilla(new Calle("verde", "Puerta del Sol", 300)))
			this.agregarCasilla(32, new Casilla(new Calle("verde", "Calle Alcala", 300)))
			this.agregarCasilla(33, new Casilla(new Tarjeta("comunidad")))
			this.agregarCasilla(34, new Casilla(new Calle("verde", "Gran Via", 320)))
			this.agregarCasilla(35, new Casilla(new Estacion("Estacion del Norte", 200)))
			this.agregarCasilla(36, new Casilla(new Tarjeta("suerte")))
			this.agregarCasilla(37, new Casilla(new Calle("azul", "Paseo de la Castellana", 380)))
			this.agregarCasilla(38, new Casilla(new Impuesto(100)))
			this.agregarCasilla(39, new Casilla(new Calle("azul", "Paseo del Prado", 400)))
		}

		this.iniciar()
	}

	function Casilla(tema){
		this.tema = tema

		this.getTema = function(){return this.tema}
		this.getTipo = function(){return this.tema.constructor.name}

		this.caer = function(ficha){this.tema.caer(ficha)}
		this.comprar = function(ficha){this.tema.comprar(ficha)}
	}	

	Tema: {

		EstadoCasilla: {
			function NoComprable(){
				this.caer = function(casilla, ficha){}
				this.comprar = function(casilla, ficha){console.log("La casilla " + casilla.getTipo() + " no se puede comprar.")}
				this.edificar = function(casilla, ficha){console.log("La casilla " + casilla.getTipo() + " no es edificable.")}
				this.hipotecar = function(casilla,ficha){console.log("La casilla " + casilla.getTipo() + " no es hipotecable.")}
			}

			function Libre(){
				this.caer = function(casilla, ficha){ficha.setInfo(casilla.getNombre() + " está libre - " + casilla.getPrecio() + " pelotis.")}
				this.comprar = function(casilla, ficha){casilla.ejecutarCompra(ficha)}
				this.edificar = function(casilla, ficha){console.log("Primero tienes que comprar La casilla " + casilla.getTipo())}
				this.hipotecar = function(casilla,ficha){console.log("Primero tienes que comprar La casilla " + casilla.getTipo())}
			}

			function Comprada(){
				this.caer = function(casilla, ficha){
					if (casilla.getPropietario() != ficha)
						casilla.cobrarAlquiler(ficha)
					else
						console.log("La " + casilla.getNombre() + " es tuya.")
				}
				this.comprar = function(casilla, ficha){console.log("La " + casilla.getNombre() + " ya está comprada.")}
				this.edificar = function(casilla, ficha){casilla.ejecutarEdificacion(ficha)}
				this.hipotecar = function(casilla,ficha){casilla.ejecutarHipoteca(ficha)}
			}

			function Hipotecada(){
				this.caer = function(casilla, ficha){console.log("La " + casilla.getNombre() + " está hipotocada.")}
				this.comprar = function(casilla, ficha){console.log("La " + casilla.getNombre() + " está hipotocada.")}
				this.edificar = function(casilla, ficha){console.log("La " + casilla.getNombre() + " está hipotocada.")}
				this.hipotecar = function(casilla,ficha){console.log("La " + casilla.getNombre() + " está hipotocada.")}
			}
		}

		Propiedad: {

			function TituloPropiedad(propiedad){
				this.propiedad = propiedad		
				this.propietario
				this.valorHipotecario = 50
				var hipotecado = false

				this.getPropiedad = function(){return this.propiedad}
				this.getPropietario = function(){return this.propietario == undefined ? undefined : this.propietario}
				this.setPropietario = function(propietario){
					this.propietario = propietario
					this.propietario.asignarPropiedad(this)
				}
				this.getAlquiler = function(){return this.propiedad.calcularAlquiler()}

				this.edificar = function(ficha){
					if (this.esPropietario(ficha))
						this.propiedad.edificar(ficha)
				}
				this.venderEdificio = function(ficha){
					if (this.esPropietario(ficha))
						this.propiedad.venderEdificio(ficha)
				}
				this.hipotecarPropiedad = function(ficha){
					if (this.esPropietario(ficha))
						this.propiedad.hipotecar(ficha)
				}

				this.esPropietario = function(ficha){
					if (this.propietario == ficha)
						return true
					console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  OPERACION DENEGADA - " + this.nombre + ": no es propietario")
					return false
				}
			}			

			function Calle(color, nombre, precio){
				this.tipo = "Calle"
				this.color = color
				this.nombre = nombre
				this.precio = precio

				this.estado = new Libre()
				this.numCasas = 0
				this.titulo = (new FactoryMethod).crearTituloPropiedad(this)			

				this.getTipo = function(){return this.tipo}
				this.getNombre = function(){return this.nombre}
				this.getColor = function(){return this.color}
				this.getPrecio = function(){return this.precio}
				this.setPrecio = function(precio){this.precio = precio}

				this.getEstado = function(){return this.estado}
				this.getAlquiler = function(){return this.titulo.getAlquiler()}
				this.getPropietario = function(){return this.titulo.getPropietario()}
				this.getNumCasas = function(){return this.numCasas}

				this.caer = function(ficha){this.estado.caer(this, ficha)}

				this.comprar = function(ficha){this.estado.comprar(this, ficha)}
				this.ejecutarCompra = function(ficha){
					if (ficha.pagar(this.precio, DEUDA_NO_REQUERIDA)){
						this.titulo.setPropietario(ficha)						
						this.estado = new Comprada()
						console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  PROPIEDAD COMPRADA - " + this.nombre)

						ficha.getPartida().comprobarMonopolio(ficha, this)
					}
				}

				this.calcularAlquiler = function(){return this.precio * 0.25 * (this.numCasas + 1)}
				this.cobrarAlquiler = function(ficha){
					var alquiler = this.getAlquiler()
					ficha.setInfo("PAGAR ALQUILER - " + alquiler + " pelotis a " + this.getPropietario().getUsuario().getNombre())
					console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  PAGAR ALQUILER - " + alquiler + " pelotis")
					ficha.pagar(alquiler, this.getPropietario())
				}

				this.edificar = function(ficha){this.estado.edificar(this, ficha)}
				this.venderEdificio = function(ficha){
					if (this.numCasas > 0){
						if (this.numCasas == 5)
							ficha.getPartida().devolverHotel()
						else
							ficha.getPartida().devolverCasa()

						this.numCasas--
						this.getPropietario().cobrar(PRECIO_EDIFICAR * 0.5)
					}
					else
						console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  NO HAY EDIFICIOS")
				}
				this.hipotecar = function(ficha){this.estado.hipotecar(this, ficha)}

				this.ejecutarEdificacion = function(ficha){
					if (ficha.getMonopolios().indexOf(this.color) != -1){
						if (this.numCasas == 5)
							console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  IMPOSIBLE EDIFICAR - " + this.nombre + ": ya tiene hotel")
						else{
							// Comprobamos que se edifica en orden
							if (this.comprobarOrdenDeEdificacion(ficha, this)){
								if (this.numCasas == 4 && ficha.getPartida().comprarHotel()){
									if (ficha.pagar(PRECIO_EDIFICAR, DEUDA_NO_REQUERIDA)){
										this.numCasas++
										console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  HOTEL CONSTRUIDO - " + this.nombre)
									}
									else
										ficha.getPartida().devolverHotel()
								}
								else if (ficha.getPartida().comprarCasa()){
									if (ficha.pagar(PRECIO_EDIFICAR, DEUDA_NO_REQUERIDA)){
										this.numCasas++
										console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  CASA CONSTRUIDA - " + this.nombre + ": " + this.numCasas)
									}
									else
										ficha.getPartida().devolverCasa()
								}
								else
									console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  IMPOSIBLE EDIFICAR - no quedan edificios disponibles")
							}
							else
								console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  IMPOSIBLE EDIFICAR - tiene que edificar en orden")
						}
					}
					else
						console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  IMPOSIBLE EDIFICAR - " + this.nombre + ": no tiene el monopolio " + this.color)
				}

				this.comprobarOrdenDeEdificacion = function(ficha, calle){
					var enOrden = true

					ficha.getPropiedades().forEach(
						function (v,i,array){
							if (v.getPropiedad() != calle && v.getPropiedad().getColor() == calle.getColor())
								if (calle.getNumCasas()+1 > v.getPropiedad().getNumCasas()+1)
									enOrden =  false			
						}
					)

					return enOrden
				}

				this.ejecutarHipoteca = function(ficha){
					if (this.numCasas == 0){
						this.estado = new Hipotecada()
						ficha.cobrar(this.precio * 0.5)
						console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  PROPIEDAD HIPOTECADA - " + this.nombre)
					}
					else
						console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  IMPOSIBLE HIPOTECAR - " + this.nombre + ": hay " + this.numCasas + " edificios")
				}
			}

			function Estacion(nombre){
				this.tipo = "Estacion"
				this.nombre = nombre
				this.precio = 200

				this.estado = new Libre()
				this.titulo = (new FactoryMethod).crearTituloPropiedad(this)

				this.getTipo = function(){return this.tipo}
				this.getNombre = function(){return this.nombre}
				this.getPrecio = function(){return this.precio}

				this.getEstado = function(){return this.estado}
				this.getAlquiler = function(){return this.titulo.getAlquiler()}
				this.getPropietario = function(){return this.titulo.getPropietario()}

				this.caer = function(ficha){this.estado.caer(this, ficha)}
				this.comprar = function(ficha){this.estado.comprar(this, ficha)}

				this.ejecutarCompra = function(ficha){
					if (ficha.pagar(this.precio, DEUDA_NO_REQUERIDA)){
						this.titulo.setPropietario(ficha)
						this.estado = new Comprada()
					}
				}

				this.calcularAlquiler = function(){
					if (this.getPropietario() != undefined){
						var estaciones = this.getPropietario().getPropiedades().filter(
							function (v,i,array){return v.getPropiedad().getTipo() == "Estacion"}
						)
						return 50 * estaciones.length
					}
					else
						return 50
				}

				this.cobrarAlquiler = function(ficha){
					var alquiler = this.getAlquiler()
					console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  PAGAR ALQUILER - " + alquiler + " pelotis")
					ficha.pagar(alquiler, this.getPropietario())
				}

				this.edificar = function(ficha){console.log("La " + this.nombre + " no es edificable.")}
				this.venderEdificio = function(ficha){console.log("La " + this.nombre + " no es edificable.")}
				this.hipotecar = function(ficha){this.estado.edificar(this, ficha)}

				this.ejecutarHipoteca = function(ficha){
					this.estado = new Hipotecada()
					ficha.cobrar(PRECIO_EDIFICAR * 0.5)
					console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  PROPIEDAD HIPOTECADA - " + this.nombre)
				}
			}

			function ServicioPublico(nombre){
				this.tipo = "ServicioPublico"
				this.nombre	= nombre
				this.precio = 150

				this.estado = new Libre(this)
				this.titulo = (new FactoryMethod).crearTituloPropiedad(this)

				this.getTipo = function(){return this.tipo}
				this.getNombre = function(){return this.nombre}
				this.getPrecio = function(){return this.precio}

				this.getEstado = function(){return this.estado}
				this.getAlquiler = function(){return this.titulo.getAlquiler()}
				this.getPropietario = function(){return this.titulo.getPropietario()}

				this.caer = function(ficha){this.estado.caer(this, ficha)}
				this.comprar = function(ficha){this.estado.comprar(this, ficha)}

				this.ejecutarCompra = function(ficha){
					if (ficha.pagar(this.precio, DEUDA_NO_REQUERIDA)){
						this.titulo.setPropietario(ficha)
						this.estado = new Comprada()
					}
				}

				// Devuelve el factor por que el que se tiene que multiplicar la tirada
				this.calcularAlquiler = function(){
					if (this.getPropietario() != undefined){
						var servicios = this.getPropietario().getPropiedades().filter(
							function (v,i,array){return v.getPropiedad().getTipo() == "ServicioPublico"}
							)
						return 5 * servicios.length
					}
					else
						return 5
				}

				this.cobrarAlquiler = function(ficha){
					console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  TIRA DADOS PARA PAGAR ALQUILER")
					var tirada = ficha.partida.lanzarDados()
					var alquiler = (tirada[0] + tirada[1]) * this.getAlquiler()

					console.log("   Usuario " + ficha.getUsuario().getNombre() + 
						":  PAGAR ALQUILER - Tirada " + tirada[0] + " + " + tirada[1] + ": " + alquiler + " pelotis")
					ficha.pagar(alquiler, this.getPropietario())
				}

				this.edificar = function(ficha){console.log("La " + this.nombre + " no es edificable.")}
				this.venderEdificio = function(ficha){console.log("La " + this.nombre + " no es edificable.")}
				this.hipotecar = function(ficha){this.estado.edificar(this, ficha)}

				this.ejecutarHipoteca = function(ficha){
					this.estado = new Hipotecada()
					ficha.cobrar(PRECIO_EDIFICAR * 0.5)
					console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  PROPIEDAD HIPOTECADA - " + this.nombre)
				}
			}
		}

		function Carcel(){
			this.tipo = "Carcel"
			this.estado = new NoComprable()

			this.getTipo = function(){return this.tipo}
			this.getEstado = function(){return this.estado}

			this.caer = function(ficha){
				if (ficha.getTurnosEnCarcel() > 0)
					console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  ENCARCELADO POR 3 TURNOS")
				else
					console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  VISITA CÁRCEL")
			}

			this.comprar = function(ficha){this.estado.comprar(this, ficha)}
			this.edificar = function(ficha){this.estado.edificar(ficha)}
		}

		function Tarjeta(clase){
			this.tipo = "Tarjeta"
			this.clase = clase
			this.estado = new NoComprable()

			this.getTipo = function(){return this.tipo}
			this.getClase = function(){return this.clase}
			this.getEstado = function(){return this.estado}

			this.caer = function(ficha){
				var tarjetaCogida = ficha.getPartida().getTarjeta(this.clase)
				tarjetaCogida.ejecutar(ficha)
			}

			this.comprar = function(ficha){this.estado.comprar(this, ficha)}
			this.edificar = function(ficha){this.estado.edificar(ficha)}
		}

		function Impuesto(dinero){
			this.tipo = "Impuesto"
			this.dinero = dinero
			this.estado = new NoComprable()

			this.getTipo = function(){return this.tipo}
			this.getDinero = function(){return this.dinero}
			this.getEstado = function(){return this.estado}

			this.caer = function(ficha){
				ficha.setInfo("PAGAR IMPUESTO - " + this.dinero + " pelotis")
				console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  PAGAR IMPUESTO - " + this.dinero + " pelotis")
				ficha.pagar(this.dinero, DEUDA_REQUERIDA)
			}

			this.comprar = function(ficha){this.estado.comprar(this, ficha)}
			this.edificar = function(ficha){this.estado.edificar(ficha)}
		}


		function IrCarcel(){
			this.tipo = "IrCarcel"
			this.estado = new NoComprable()

			this.getTipo = function(){return this.tipo}
			this.getEstado = function(){return this.estado}

			this.caer = function(ficha){
				console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  A LA CÁRCEL!!")
				ficha.encarcelar()
			}

			this.comprar = function(ficha){this.estado.comprar(this, ficha)}
			this.edificar = function(ficha){this.estado.edificar(ficha)}
		}

		function Parking(){
			this.tipo = "Parking"
			this.estado = new NoComprable()

			this.getTipo = function(){return this.tipo}
			this.getEstado = function(){return this.estado}

			this.caer = function(ficha){
				
			}

			this.comprar = function(ficha){this.estado.comprar(this, ficha)}
			this.edificar = function(ficha){this.estado.edificar(ficha)}
		}

		function Salida(){
			this.tipo = "Salida"
			this.estado = new NoComprable()

			this.getTipo = function(){return this.tipo}
			this.getEstado = function(){return this.estado}

			this.caer = function(ficha){ficha.getPartida().cobrarDineroSalida(ficha)}
			this.comprar = function(ficha){this.estado.comprar(this, ficha)}
			this.edificar = function(ficha){this.estado.edificar(ficha)}
		}
	}
}

Jugadores: {

	function Usuario(nombre){
		var nombre = nombre
		this.fichas = []
		var uid
		this.info

		this.getNombre = function(){return nombre}
		this.getUid = function(){return uid}
		this.getInfo = function(){return this.info}
		this.setInfo = function(info){this.info = info}

		var generateUid = function(){return (new Date()).valueOf().toString()}

		this.unirseAPartida = function(partida){
			var ficha = partida.solicitarNuevoJugador(this)
			if (ficha) this.fichas.push(ficha)
			return ficha
		}

		uid = generateUid()
	}

	Turno: {
		function MeToca(){
			this.dadosTirados = false
			this.dobles = 0

			this.lanzarDados = function(partida, ficha, tiradaTest){
				if (!this.dadosTirados){
					var tirada
					if (tiradaTest == undefined)
						tirada = partida.solicitarLanzarDados()
					else
						tirada = tiradaTest

					if (tirada != undefined){
						console.log("   Usuario " + ficha.getUsuario().getNombre() + 
							":  DADOS - " + tirada[0] + " + " + tirada[1])						

						if (ficha.getTurnosEnCarcel() == 0){
							if (tirada[0] == tirada[1]){
								this.dobles++
								if (this.dobles == 3){
									ficha.setInfo("DADOS - " + "tres dobles, ¡A LA CÁRCEL!")
									ficha.encarcelar()
								}
								else{
									partida.moverFicha(ficha, tirada[0] + tirada[1])
									ficha.setInfo("DADOS - " + "dobles, ¡TIRA OTRA VEZ!")
								}
							}
							else{
								this.dadosTirados = true
								partida.moverFicha(ficha, tirada[0] + tirada[1])
							}							
						}
						else{
							if (tirada[0] == tirada[1]){
								ficha.setInfo("DADOS - " + "dobles, ¡SALES DE LA CÁRCEL!")
								ficha.setTurnosEnCarcel(0)
								this.dadosTirados = true
								partida.moverFicha(ficha, tirada[0] + tirada[1])
							}
							else{
								this.dadosTirados = true
								ficha.setTurnosEnCarcel(ficha.getTurnosEnCarcel() - 1)

								if (ficha.getTurnosEnCarcel() == 0){
									ficha.setInfo("SALES DE LA CÁRCEL - pagando 50 pelotis")
									ficha.pagar(50, DEUDA_REQUERIDA)
									partida.moverFicha(ficha, tirada[0] + tirada[1])
								}
								else
									ficha.setInfo("DADOS - " + "no dobles, te quedan " + ficha.getTurnosEnCarcel() + " turnos en la cárcel")								
							}
						}
						
						return tirada
					}
				}
				else
					console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  DADOS - " + "lanzados ya")
			}

			this.puedeRelizarOperacion = function(){
				if (this.dadosTirados || this.dobles > 0)
					return true

				console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  TIRA LOS DADOS ANTES")
				return false
			}

			this.usarTarjetaLibreCarcel = function(ficha){
				if (ficha.tieneTarjetaLibreCarcel() && ficha.getTurnosEnCarcel() > 0){
					ficha.setTurnosEnCarcel(0)
					ficha.setTarjetaLibreCarcel(false)
					console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  SALE DE LA CÁRCEL CON TARJETA")
				}
				else
					console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  NO PUEDE USAR TARJETA - Libre de cárcel")
			}

			TransaccionesTurno: {
				this.comprarPropiedad = function(partida, ficha){
					if (this.puedeRelizarOperacion())
						partida.comprarPropiedad(ficha)	
				}
				this.edificar = function(titulo, ficha){
					if (this.puedeRelizarOperacion())
						titulo.edificar(ficha)
				}
				this.venderEdificio = function(titulo, ficha){
					if (this.puedeRelizarOperacion())
						titulo.venderEdificio(ficha)
				}
				this.hipotecarPropiedad = function(titulo, ficha){
					if (this.puedeRelizarOperacion())
						titulo.hipotecarPropiedad(ficha)
				}
			}

			this.pasarTurno = function(partida, ficha){
				if (this.dadosTirados){
					if (ficha.getDeudas().length > 0){
						ficha.declararEnBancarrota()
						console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  DECLARADO EN BANCARROTA")
					}
					partida.cambiarTurno()
				}					
				else
					console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  TIRA LOS DADOS ANTES")
			}			
		}

		function NoMeToca(){
			this.lanzarDados = function(partida, ficha){console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  ESPERA TU TURNO")}
			this.usarTarjetaLibreCarcel = function(ficha){console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  ESPERA TU TURNO")}
			this.comprarPropiedad = function(partida, ficha){console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  ESPERA TU TURNO")}
			this.edificar = function(titulo, ficha){console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  ESPERA TU TURNO")}
			this.venderEdificio = function(titulo, ficha){console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  ESPERA TU TURNO")}
			this.hipotecarPropiedad = function(titulo, ficha){console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  ESPERA TU TURNO")}
			this.pasarTurno = function(partida, ficha){console.log("   Usuario " + ficha.getUsuario().getNombre() + ":  ESPERA TU TURNO")}		
		}
	}

	function Ficha(usuario, partida, color){
		this.usuario = usuario
		this.partida = partida

		this.info = []

		this.color = color
		this.saldo = 1500
		this.posicion = 0
		this.propiedades = []
		this.monopolios = []
		this.turno = new NoMeToca()
		this.turnosEnCarcel = 0 // Representa los turnos que le quedan en la carcel
		this.bancarrota = false
		this.deudas = [] // En caso de que el jugador pase turno con deudas pendientes se le declara en bancarrota
		this.ganador // Undefined hasta que termine la partida
		this.tarjetaLibreCarcel = false

		this.getUsuario = function(){return this.usuario}
		this.getPartida = function(){return this.partida}
		this.getInfo = function(){return this.info}
		this.setInfo = function(info){
			if (this.info.length == 8){
				this.info.shift()
			}
			this.info.push(info)
		}
		this.getColor = function(){return this.color}
		this.getSaldo = function(){return this.saldo}
		this.getPosicion = function(){return this.posicion}
		this.setPosicion = function(numCasilla){this.posicion = numCasilla}
		this.getPropiedades = function(){return this.propiedades}
		this.asignarPropiedad = function(titulo){this.propiedades.push(titulo)}
		this.getMonopolios = function(){return this.monopolios}
		this.setMonopolio = function(color){return this.monopolios.push(color)}
		this.getTurno = function(){return this.turno}
		this.setTurno = function(turno){this.turno = turno}
		this.getTurnosEnCarcel = function(){return this.turnosEnCarcel}
		this.setTurnosEnCarcel = function(turnos){this.turnosEnCarcel = turnos}
		this.setTarjetaLibreCarcel = function(valor){this.tarjetaLibreCarcel = valor}
		this.tieneTarjetaLibreCarcel = function(){return this.tarjetaLibreCarcel}
		this.getDeudas = function(){return this.deudas}
		this.declararEnBancarrota = function(){this.bancarrota = true}
		this.enBancarrota = function(){return this.bancarrota}
		this.setGanador = function(resultado){this.ganador = resultado}
		this.esGanador = function(){return this.ganador}

		this.empezarPartida = function(){this.partida.empezar()}
		// Le podemos pasar una tirada fija para las pruebas
		this.lanzarDados = function(tiradaTest){return this.turno.lanzarDados(this.partida, this, tiradaTest)}
		this.usarTarjetaLibreCarcel = function(){this.turno.usarTarjetaLibreCarcel(this)}
		this.comprarPropiedad = function(){this.turno.comprarPropiedad(this.partida, this)}
		this.edificar = function(titulo){this.turno.edificar(titulo, this)}
		this.venderEdificio = function(titulo){this.turno.venderEdificio(titulo, this)}
		this.hipotecarPropiedad = function(titulo){this.turno.hipotecarPropiedad(titulo, this)}
		//this.hipotecarPropiedad = function(titulo){this.propiedades[this.propiedades.indexOf(titulo)].hipotecar()}
		this.pasarTurno = function(){this.turno.pasarTurno(partida, this)}

		this.pagar = function(cantidad, receptorDelPago){
			var aux = this.saldo - cantidad
			if (aux >= 0){
				if (receptorDelPago && receptorDelPago.constructor.name == "Ficha")
					receptorDelPago.cobrar(cantidad)

				console.log("   Usuario " + this.getUsuario().getNombre() + ":  SALDO - " + this.saldo + " - " + cantidad + " = " + aux)
				this.saldo = aux
				return true
			}
			else{
				// Receptores:
				// -1: es un pago que no sólo se anula
				// 0: el receptor es el banco
				// ficha: el receptor es otro jugador
				if (receptorDelPago == DEUDA_NO_REQUERIDA)
					console.log("   Usuario " + this.getUsuario().getNombre() + ":  SALDO INSUFICIENTE PARA LA OPERACIÓN")
				else{
					if (receptorDelPago == DEUDA_REQUERIDA)
						console.log("   Usuario " + this.getUsuario().getNombre() + ":  SALDO INSUFICIENTE PARA LA MULTA")
					else
						console.log("   Usuario " + this.getUsuario().getNombre() + ":  SALDO INSUFICIENTE PARA ALQUILER")
					this.deudas.push({'receptor':receptorDelPago, 'cantidad':cantidad})
				}

				return false
			}				
		}

		this.pagarDeudas = function(){
			var deudasSinPagar = []
			var aux = this

			// Comprobamos si podemos pagar todas las deudas
			this.deudas.forEach(function (v,i,array){
				if (aux.saldo >= v.cantidad)
					aux.pagar(v.cantidad, v.receptor)
				else
					deudasSinPagar.push(v)
			})

			this.deudas = deudasSinPagar
		}

		this.cobrar = function(cantidad){
			var aux = this.saldo + cantidad
			console.log("   Usuario " + this.getUsuario().getNombre() + ":  SALDO - " + this.saldo + " + " + cantidad + " = " + aux)
			this.saldo = aux

			// Pagamos deudas si es posible cada vez que recibimos ingresos
			this.pagarDeudas()
		}		

		this.encarcelar = function(){			
			this.turnosEnCarcel = 3
			this.partida.moverFicha(this, 10 - this.posicion)
			this.pasarTurno()
		}	
	}
}

module.exports.Partida = Partida;
module.exports.Dado = Dado;
module.exports.Tablero = Tablero;
module.exports.Usuario = Usuario;
module.exports.Avanzar = Avanzar;
module.exports.Retroceder = Retroceder;
module.exports.Pagar = Pagar;
module.exports.Cobrar = Cobrar;
module.exports.LibreCarcel =LibreCarcel;