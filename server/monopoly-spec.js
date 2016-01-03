// Comando para pasar pruebas: jasmine-node ./server/monopoly-spec.js > error

var modelo = require("./modelo.js");

describe("Monopoly",function(){

	it("Al tirar dos dados, el resultado está entre 2 y 12", function(){
		var dado = new modelo.Dado()

		for(i=0;i<10;i++){
			var tirada = dado.lanzar() + dado.lanzar()
			expect(tirada).toBeGreaterThan(1);
			expect(tirada).toBeLessThan(13);
		}
	});

	describe("Tablero",function(){
		var tab

		beforeEach(function(){
			tab = new modelo.Tablero(40)
		});

		it("Debería tener 40 casillas",function(){
			expect(tab.casillas).toBeDefined(); //debe existir la variable
			expect(tab.numeroCasillas).toEqual(40);	 //debe tener 40 casillas
		});

		it("Debería tener salida",function(){	
			expect(tab.getCasilla(0).getTipo()).toEqual("Salida");
			expect(tab.getCasilla(0).getTema().getEstado().constructor.name).toEqual("NoComprable")
		});

		it("Debería tener carcel y que mande a ella",function(){	
			expect(tab.getCasilla(10).getTipo()).toEqual("Carcel");
			expect(tab.getCasilla(10).getTema().getEstado().constructor.name).toEqual("NoComprable")
			expect(tab.getCasilla(30).getTipo()).toEqual("IrCarcel");
			expect(tab.getCasilla(30).getTema().getEstado().constructor.name).toEqual("NoComprable")
		});

		it("Debería tener 2 impuestos",function(){	
			expect(tab.getCasilla(4).getTipo()).toEqual("Impuesto");
			expect(tab.getCasilla(4).getTema().getDinero()).toEqual(200);
			expect(tab.getCasilla(4).getTema().getEstado().constructor.name).toEqual("NoComprable")

			expect(tab.getCasilla(38).getTipo()).toEqual("Impuesto");
			expect(tab.getCasilla(38).getTema().getDinero()).toEqual(100);
			expect(tab.getCasilla(38).getTema().getEstado().constructor.name).toEqual("NoComprable")
		});

		it("Debería tener parking",function(){	
			expect(tab.getCasilla(20).getTipo()).toEqual("Parking");
			expect(tab.getCasilla(20).getTema().getEstado().constructor.name).toEqual("NoComprable")
		});

		it("Debería tener 2 servicios públicos sin comprar",function(){	
			expect(tab.getCasilla(12).getTipo()).toEqual("ServicioPublico");
			expect(tab.getCasilla(12).getTema().getPrecio()).toEqual(150);
			expect(tab.getCasilla(12).getTema().getEstado().constructor.name).toEqual("Libre")
			expect(tab.getCasilla(28).getTipo()).toEqual("ServicioPublico");
			expect(tab.getCasilla(28).getTema().getPrecio()).toEqual(150);
			expect(tab.getCasilla(12).getTema().getEstado().constructor.name).toEqual("Libre")
		});

		describe("Estaciones",function(){
			it("Debería tener 4 estaciones sin comprar",function(){
				var estaciones = tab.casillas.filter(function (v,i,array){return v.getTema().getTipo() == "Estacion"})
				expect(estaciones.length).toEqual(4);
				expect(estaciones.every(function (v,i,array){return v.getTema().getEstado().constructor.name == "Libre"})).toEqual(true)
			});

			it("Nombres",function(){	
				expect(tab.getCasilla(5).getTema().getNombre()).toEqual("Estacion de Goya");
				expect(tab.getCasilla(15).getTema().getNombre()).toEqual("Estacion de las Delicias");
				expect(tab.getCasilla(25).getTema().getNombre()).toEqual("Estacion del Mediodia");
				expect(tab.getCasilla(35).getTema().getNombre()).toEqual("Estacion del Norte");
			});
		});

		describe("Calles",function(){
			it("Numero de calles por color y deben estar libres",function(){
				marron=0; azulClaro=0; rosa=0; naranja=0; rojo=0; amarillo=0; verde=0; azul=0

				for(i=0;i<tab.numeroCasillas;i++){
					casilla = tab.getCasilla(i)

					if (casilla.getTipo() == "Calle"){
						switch(casilla.getTema().getColor()){
							case "marron": marron++; break;
							case "azulClaro": azulClaro++; break;
							case "rosa": rosa++; break;
							case "naranja": naranja++; break;
							case "rojo": rojo++; break;
							case "amarillo": amarillo++; break;
							case "verde": verde++; break;
							case "azul": azul++;
						}

						expect(casilla.getTema().getEstado().constructor.name).toEqual("Libre")
					}
				}

				expect(marron).toEqual(2);
				expect(azulClaro).toEqual(3);
				expect(rosa).toEqual(3);
				expect(naranja).toEqual(3);
				expect(rojo).toEqual(3);
				expect(amarillo).toEqual(3);
				expect(verde).toEqual(3);
				expect(azul).toEqual(2);
			});

			it("Nombres",function(){	
				expect(tab.getCasilla(1).getTema().getNombre()).toEqual("Ronda de Valencia");
				expect(tab.getCasilla(3).getTema().getNombre()).toEqual("Plaza Lavapies");

				expect(tab.getCasilla(6).getTema().getNombre()).toEqual("Glorieta Cuatro Caminos");
				expect(tab.getCasilla(8).getTema().getNombre()).toEqual("Avenida Reina Victoria");
				expect(tab.getCasilla(9).getTema().getNombre()).toEqual("Calle Bravo Murillo");

				expect(tab.getCasilla(11).getTema().getNombre()).toEqual("Glorieta de Bilbao");
				expect(tab.getCasilla(13).getTema().getNombre()).toEqual("Calle Alberto Aguilera");
				expect(tab.getCasilla(14).getTema().getNombre()).toEqual("Calle Fuencarral");

				expect(tab.getCasilla(16).getTema().getNombre()).toEqual("Avenida Felipe II");
				expect(tab.getCasilla(18).getTema().getNombre()).toEqual("Calle Velazquez");
				expect(tab.getCasilla(19).getTema().getNombre()).toEqual("Calle Serrano");

				expect(tab.getCasilla(21).getTema().getNombre()).toEqual("Avenida de America");
				expect(tab.getCasilla(23).getTema().getNombre()).toEqual("Calle Maria de Molina");
				expect(tab.getCasilla(24).getTema().getNombre()).toEqual("Calle Cea Bermudez");

				expect(tab.getCasilla(26).getTema().getNombre()).toEqual("Avenida Los Reyez Catolicos");
				expect(tab.getCasilla(27).getTema().getNombre()).toEqual("Calle Bailen");
				expect(tab.getCasilla(29).getTema().getNombre()).toEqual("Plaza de España");

				expect(tab.getCasilla(31).getTema().getNombre()).toEqual("Puerta del Sol");
				expect(tab.getCasilla(32).getTema().getNombre()).toEqual("Calle Alcala");
				expect(tab.getCasilla(34).getTema().getNombre()).toEqual("Gran Via");

				expect(tab.getCasilla(37).getTema().getNombre()).toEqual("Paseo de la Castellana");
				expect(tab.getCasilla(39).getTema().getNombre()).toEqual("Paseo del Prado");
			});
		});

		describe("Tarjetas",function(){
			it("Debería tener 3 casillas de suerte",function(){
				var tSuerte = tab.casillas.filter(function (v,i,array){return v.getTema().constructor.name == "Tarjeta" && v.getTema().getClase() == "suerte"})
				expect(tSuerte.length).toEqual(3);
				expect(tSuerte.every(function (v,i,array){return v.getTema().getEstado().constructor.name == "NoComprable"})).toEqual(true)
			});

			it("Debería tener 3 casillas de caja de comunidad",function(){	
				var tComunidad = tab.casillas.filter(function (v,i,array){return v.getTema().constructor.name == "Tarjeta" && v.getTema().getClase() == "comunidad"})
				expect(tComunidad.length).toEqual(3);
				expect(tComunidad.every(function (v,i,array){return v.getTema().getEstado().constructor.name == "NoComprable"})).toEqual(true)
			});
		});
	});

	describe("Partida",function(){
		var partida

		beforeEach(function(){
			partida = new modelo.Partida("Partida 1")
		});
	
		it("La partida permite añadir hasta 6 jugadores", function(){
			for (i=0; i<6; i++){
				new modelo.Usuario("Alberto").unirseAPartida(partida)
			}
			expect(partida.fichas.length).toEqual(6)

			usr = new modelo.Usuario("Pepe")
			expect(usr.unirseAPartida(partida)).toBeUndefined()
		});		

		it("Cada nuevo jugador tiene 1500 pelotis y una ficha de diferente color en la casilla de salida", function(){
			var colorIgual = false
			var colores = []

			for (i=0; i<6; i++){
				var usr = new modelo.Usuario("Alberto")
				usr.unirseAPartida(partida)
				expect(usr.fichas.length).toEqual(1)
				expect(usr.fichas[0]).toBeDefined()
				expect(usr.fichas[0].saldo).toEqual(1500)

				var color = usr.fichas[0].color
				for (j=0; j<colores.length; j++){
			        if (colores[j] === color) {
			            colorIgual = true;
			        }
			    }
			    expect(colorIgual).toEqual(false)
				colores.push(usr.fichas[0].color)				
			}
		});

		describe("Fases de la partida",function(){
			it("La partida al crearse se encuentra en su fase inicial y sólo permite añadir jugadores", function(){
				expect(partida.getFase().constructor.name).toEqual("FaseInicial")

				var usr = new modelo.Usuario("Alberto")
				usr.unirseAPartida(partida)
				expect(partida.fichas.length).toEqual(1)

				expect(usr.fichas[0].lanzarDados()).toBeUndefined()
			});

			it("Cuando un jugador decide empezar una partida, la fase cambia a Jugar y no se permite añadir nuevos jugadores", function(){
				var usr = new modelo.Usuario("Alberto")
				usr.unirseAPartida(partida)				
				usr.fichas[0].empezarPartida()
				expect(partida.getFase().constructor.name).toEqual("FaseJugar")

				var numJugadores = partida.fichas.length
				expect(new modelo.Usuario("Pepe").unirseAPartida(partida)).toBeUndefined()
				expect(partida.fichas.length).toEqual(numJugadores)
			});			

			it("Cuando un jugador alcanza los 20.000 pelotis, se acaba la partida", function(){
				var usr = new modelo.Usuario("Alberto")
				usr.unirseAPartida(partida)
				usr.fichas[0].empezarPartida()

				usr.fichas[0].lanzarDados([1,2])
				usr.fichas[0].cobrar(20000)
				usr.fichas[0].pasarTurno()

				expect(partida.getFase().constructor.name).toEqual("FaseFinal")
				expect(usr.fichas[0].esGanador()).toEqual(true)
			});

			it("Cuando sólo queda un jugador que no está en bancarrota, se acaba la partida", function(){
				var ficha1 = (new modelo.Usuario("Alberto")).unirseAPartida(partida)
				var ficha2 = (new modelo.Usuario("Pepe")).unirseAPartida(partida)

				partida.calcularPrimerTurno(true)

				ficha1.pagar(ficha1.getSaldo(), 0)
				ficha1.lanzarDados([0,4]) // Movemos a la casilla 4 que es un impuesto
				expect(ficha1.getDeudas().length).toEqual(1)

				ficha1.pasarTurno()
				expect(ficha1.enBancarrota()).toEqual(true)

				expect(ficha1.esGanador()).toEqual(false)
				expect(partida.getFase().constructor.name).toEqual("FaseFinal")
				expect(ficha2.esGanador()).toEqual(true)
			});
		});

		describe("Turnos de jugadores",function(){
			var ficha1, ficha2

			beforeEach(function(){
				ficha1 = (new modelo.Usuario("Alberto")).unirseAPartida(partida)
				ficha2 = (new modelo.Usuario("Pepe")).unirseAPartida(partida)
			});

			it("Un jugador no puede tirar si no es su turno", function(){				
				partida.calcularPrimerTurno(true)

				expect(ficha2.getTurno().constructor.name).toEqual("NoMeToca")
				expect(ficha2.lanzarDados()).toBeUndefined()
			});

			it("Un jugador tiene que tirar antes de pasar turno", function(){				
				partida.calcularPrimerTurno(true)

				expect(ficha1.getTurno().constructor.name).toEqual("MeToca")
				ficha1.pasarTurno()
				expect(ficha1.getTurno().constructor.name).toEqual("MeToca")
			});

			it("Cuando un jugador pasa el turno, se realiza el cambio de turno.", function(){
				partida.calcularPrimerTurno(true)

				ficha1.lanzarDados([1,2])
				ficha1.pasarTurno()
				expect(partida.getTurno()).toEqual(1)

				ficha2.lanzarDados([1,2])
				ficha2.pasarTurno()
				expect(partida.getTurno()).toEqual(0)
			});			

			it("Cuando un jugador saca dobles puede volver a tirar", function(){
				partida.calcularPrimerTurno(true)

				ficha1.lanzarDados([2,2])

				expect(ficha1.lanzarDados()).toBeDefined()
			});

			describe("Cárcel",function(){
				it("Cuando un jugador va a la carcel, sale al tercer turno si no saca dobles pagando 50 pelotis", function(){
					partida.calcularPrimerTurno(true)

					ficha1.lanzarDados([0,1])
					ficha1.encarcelar()
					var saldoAnterior = ficha1.getSaldo()

					for (var i=3; i>0; i--){
						ficha2.lanzarDados([0,1])
						ficha2.pasarTurno()
						
						ficha1.lanzarDados([1,2])						
						expect(ficha1.getTurnosEnCarcel()).toEqual(i-1)
						
						if (ficha1.getTurnosEnCarcel() != 0)
							expect(ficha1.getPosicion()).toEqual(10)
						else{
							expect(ficha1.getSaldo()).toEqual(saldoAnterior - 50)
							expect(ficha1.getPosicion()).toEqual(13)
						}

						ficha1.pasarTurno()
					}
				});

				it("Cuando un jugador saca tres dobles seguidos va a la cárcel", function(){
					partida.calcularPrimerTurno(true)

					ficha1.lanzarDados([2,2])
					ficha1.lanzarDados([2,2])
					ficha1.lanzarDados([2,2])

					expect(ficha1.getTurnosEnCarcel()).toEqual(3)
					expect(ficha1.getPosicion()).toEqual(10)
				});

				it("Si un jugador está en la cárcel y saca dobles, sale de ella moviéndose lo que ha sacado pero no puede lanzar otra vez", function(){
					partida.calcularPrimerTurno(true)

					ficha1.lanzarDados([0,1])
					ficha1.encarcelar()
					ficha2.lanzarDados([0,1])
					ficha2.pasarTurno()

					var tiradaTest = [1,1]
					ficha1.lanzarDados(tiradaTest)

					expect(ficha1.getTurnosEnCarcel()).toEqual(0)
					expect(ficha1.getTurno().constructor.name).toEqual("MeToca")
					expect(ficha1.getPosicion()).toEqual(10 + tiradaTest[0] + tiradaTest[1])

					// No puede tirar otra vez aunque haya sacado dobles
					ficha1.lanzarDados()
					expect(ficha1.getPosicion()).toEqual(10 + tiradaTest[0] + tiradaTest[1])
				});

				it("Si un jugador está en la cárcel puede usar la tarjeta de 'Libre de cárcel' y salir en su turno", function(){
					var cajaTest = [new modelo.LibreCarcel()]
					partida.calcularPrimerTurno(true)
					partida.cajaTarjetasComunidad = cajaTest

					ficha1.lanzarDados([0,2])
					expect(ficha1.tarjetaLibreCarcel).toEqual(true)
					ficha1.encarcelar()
					ficha2.lanzarDados([0,1])
					ficha2.pasarTurno()

					ficha1.usarTarjetaLibreCarcel()
					expect(ficha1.getTurnosEnCarcel()).toEqual(0)
					expect(ficha1.tarjetaLibreCarcel).toEqual(false)

					ficha1.lanzarDados([1,2])
					expect(ficha1.getPosicion()).toEqual(13)
				});
			});
		});

		describe("Deudas",function(){
			var ficha1, ficha2

			beforeEach(function(){
				ficha1 = (new modelo.Usuario("Alberto")).unirseAPartida(partida)
				ficha2 = (new modelo.Usuario("Pepe")).unirseAPartida(partida)
			});

			it("Si un jugador no puede pagar, se le crea una deuda pendiente", function(){	
				var pagoTest = ficha1.getSaldo() + 100

				partida.calcularPrimerTurno(true)

				expect(ficha1.getDeudas().length).toEqual(0)
				expect(ficha1.pagar(pagoTest, 0)).toEqual(false)
				expect(ficha1.getDeudas().length).toEqual(1)
				expect(ficha1.getDeudas()[0].cantidad).toEqual(pagoTest)
				expect(ficha1.getDeudas()[0].receptor).toEqual(0)
			});

			it("Si un jugador no puede pagar una compra, no se le crea una deuda pendiente", function(){	
				var pagoTest = ficha1.getSaldo() + 100

				partida.calcularPrimerTurno(true)

				expect(ficha1.getDeudas().length).toEqual(0)
				expect(ficha1.pagar(pagoTest, 0)).toEqual(false)
				expect(ficha1.getDeudas().length).toEqual(1)
				expect(ficha1.getDeudas()[0].cantidad).toEqual(pagoTest)
				expect(ficha1.getDeudas()[0].receptor).toEqual(0)
			});

			it("Si un jugador recibe ingresos, tiene que pagar sus deudas automáticamente", function(){	
				var pagoTest = ficha1.getSaldo() + 100

				partida.calcularPrimerTurno(true)

				ficha1.pagar(ficha1.getSaldo(), 0)
				expect(ficha1.getSaldo()).toEqual(0)
				ficha1.lanzarDados([0,1])
				ficha1.comprarPropiedad()

				expect(ficha1.getPropiedades().length).toEqual(0)
				expect(ficha1.getDeudas().length).toEqual(0)
			});

			it("Un jugador tiene que pagarle a otro si le debe dinero y ha ganado suficiente para cubrir la deuda", function(){				
				var pagoTest = ficha1.getSaldo() + 100
				var alquiler = partida.tablero.getCasilla(1).getTema().getAlquiler()

				partida.calcularPrimerTurno(true)

				ficha1.lanzarDados([0,1]) // Movemos a la casilla 1 que es una calle
				ficha1.comprarPropiedad()				
				ficha1.pasarTurno()

				ficha2.pagar(ficha2.getSaldo(), 0) // Dejamos sin dinero al jugador 2
				expect(ficha2.getSaldo()).toEqual(0)

				ficha2.lanzarDados([0,1])
				expect(ficha2.getDeudas().length).toEqual(1)

				var saldoAntesAlquiler = ficha1.getSaldo()

				ficha2.cobrar(alquiler)
				expect(ficha2.getDeudas().length).toEqual(0)
				expect(ficha2.getSaldo()).toEqual(0)
				expect(ficha1.getSaldo()).toEqual(saldoAntesAlquiler + alquiler)
			});

			it("Un jugador es declarado en bancarrota si pasa el turno con deudas pendientes", function(){				
				partida.calcularPrimerTurno(true)

				ficha1.pagar(ficha1.getSaldo(), 0)
				expect(ficha1.getSaldo()).toEqual(0)
				ficha1.lanzarDados([0,4]) // Movemos a la casilla 4 que es un impuesto
				expect(ficha1.getDeudas().length).toEqual(1)

				ficha1.pasarTurno()
				expect(ficha1.enBancarrota()).toEqual(true)
			});
		});
	});

	describe("Movimiento por el tablero",function(){
		describe("Pruebas anteriores",function(){
			var partida, usr1, usr2

			beforeEach(function(){
				partida = new modelo.Partida("Partida 1")

				usr1 = new modelo.Usuario("Alberto");
				usr1.unirseAPartida(partida);
				usr2 = new modelo.Usuario("Jesus")
				usr2.unirseAPartida(partida)
				partida.calcularPrimerTurno(true) // El turno es de usr1, no aleatorio
			});

			it("La posicion de una ficha cambia al tirar los dados", function(){
				var posInicial = usr1.fichas[0].getPosicion()
				var tirada = usr1.fichas[0].lanzarDados([0,1])
				expect(usr1.fichas[0].getPosicion()).toEqual(posInicial + tirada[0] + tirada[1])
			});

			it("La posicion de una ficha se encuentra dentro de los limites del tablero al tirar los dados", function(){
				partida.moverFicha(usr1.fichas[0], 39)
				partida.moverFicha(usr1.fichas[0], 2)
				expect(usr1.fichas[0].getPosicion()).toEqual(1)
			});

			it("Cuando un jugador cae en la salida cobra 200 pelotis", function(){
				var antiguoSaldo = usr1.fichas[0].getSaldo()
				partida.moverFicha(usr1.fichas[0], 40)
				expect(usr1.fichas[0].getPosicion()).toEqual(0)
				expect(antiguoSaldo + 200).toEqual(usr1.fichas[0].getSaldo())
			});

			it("Cuando un jugador pasa por la salida cobra 200 pelotis", function(){
				var antiguoSaldo = usr1.fichas[0].getSaldo()
				partida.moverFicha(usr1.fichas[0], 39)
				partida.moverFicha(usr1.fichas[0], 2)
				expect(usr1.fichas[0].getPosicion()).toEqual(1)
				expect(antiguoSaldo + 200).toEqual(usr1.fichas[0].getSaldo())
			});

			it("Cuando un jugador cae en un impuesto se le cobra la cantidad correspondiente", function(){
				var impuesto = partida.tablero.getCasilla(4).getTema()
				var saldoInicial = usr1.fichas[0].getSaldo()

				partida.moverFicha(usr1.fichas[0], 4)

				expect(saldoInicial - impuesto.getDinero()).toEqual(usr1.fichas[0].saldo)
			});

			it("Cuando un jugador cae en la casilla de Ir a la Cárcel, debe ir a la cárcel", function(){
				partida.moverFicha(usr1.fichas[0], 30)
				expect(usr1.fichas[0].getPosicion()).toEqual(10)
				expect(usr1.fichas[0].getTurnosEnCarcel()).toEqual(3)
			});

			describe("Propiedades",function(){

				it("Cuando un jugador compra una propiedad, adquiere su título de propiedad, realiza el pago y la propiedad se marca como comprada", function(){
					var calle = partida.tablero.getCasilla(1).getTema()
					var saldoInicial = usr1.fichas[0].getSaldo()

					usr1.fichas[0].lanzarDados([0,1]) // Movemos a la casilla 1 que es una calle
					usr1.fichas[0].comprarPropiedad()

					expect(usr1.fichas[0].propiedades[0]).toBeDefined()
					expect(usr1.fichas[0].propiedades[0].propiedad).toEqual(calle)
					expect(saldoInicial - calle.getPrecio()).toEqual(usr1.fichas[0].getSaldo())
					expect(calle.getPropietario()).toEqual(usr1.fichas[0])
					expect(calle.getEstado().constructor.name).toEqual("Comprada")
				});

				it("Cuando un jugador cae en una propiedad comprada, no puede volver a comprarla", function(){
					usr1.fichas[0].lanzarDados([0,1])
					usr1.fichas[0].comprarPropiedad()
					usr1.fichas[0].pasarTurno()
					usr2.fichas[0].lanzarDados([0,1])
					usr2.fichas[0].comprarPropiedad()
					var calle = partida.tablero.getCasilla(usr2.fichas[0].getPosicion()).getTema()

					expect(usr2.fichas[0].getPropiedades().length).toEqual(0)
					expect(calle.getPropietario()).toEqual(usr1.fichas[0])
				});

				it("Cuando un jugador cae en una propiedad comprada, se le cobra el alquiler y se le da al propietario", function(){
					usr1.fichas[0].lanzarDados([0,1])
					usr1.fichas[0].comprarPropiedad()
					usr1.fichas[0].pasarTurno()
					var saldoAntesAlquiler1 = usr1.fichas[0].getSaldo()

					var alquiler = partida.tablero.getCasilla(1).getTema().getAlquiler()

					var saldoAntesAlquiler2 = usr2.fichas[0].getSaldo()
					usr2.fichas[0].lanzarDados([0,1])

					expect(saldoAntesAlquiler1 + alquiler).toEqual(usr1.fichas[0].getSaldo())
					expect(saldoAntesAlquiler2 - alquiler).toEqual(usr2.fichas[0].getSaldo())
				});

				describe("Calles",function(){

					it("Un jugador puede comprar las 22 calles existentes",function(){
						var calles = []

						expect(usr1.fichas[0].getPropiedades().length).toEqual(0);

						partida.tablero.casillas.forEach(function (v,i,array){
							if (v.getTipo() == "Calle"){
								var precio = v.getTema().getPrecio()
								var saldoInicial = usr1.fichas[0].getSaldo()

								usr1.fichas[0].lanzarDados([0,i-usr1.fichas[0].getPosicion()])
								usr1.fichas[0].comprarPropiedad()

								expect(saldoInicial - precio).toEqual(usr1.fichas[0].getSaldo())

								usr1.fichas[0].cobrar(precio) // Recuperamos el dinero para poder comprar todas las calles
								calles.push(v.getTema()) // Almacenamos las calles para comprobaciones posteriores

								usr1.fichas[0].pasarTurno()
								usr2.fichas[0].lanzarDados([0,40])
								usr2.fichas[0].pasarTurno()
							}					
						})

						expect(usr1.fichas[0].getPropiedades().length).toEqual(calles.length);
						expect(calles.every(function (v,i,array){return v.getEstado().constructor.name == "Comprada"})).toEqual(true)
					});

					it("Un jugador puede comprar todas las calles y si otro cae en ellas tiene que pagar",function(){
						partida.tablero.casillas.forEach(function (v,i,array){
							if (v.getTipo() == "Calle"){
								var precio = v.getTema().getPrecio()						
								
								usr1.fichas[0].lanzarDados([0,i-usr1.fichas[0].getPosicion()])
								usr1.fichas[0].comprarPropiedad()
								usr1.fichas[0].pasarTurno()
								var saldoAntesAlquiler1 = usr1.fichas[0].getSaldo()

								var alquiler = v.getTema().getAlquiler()

								var saldoAntesAlquiler2 = usr2.fichas[0].getSaldo()
								usr2.fichas[0].lanzarDados([0,i-usr2.fichas[0].getPosicion()])
								usr2.fichas[0].pasarTurno()

								expect(saldoAntesAlquiler1 + alquiler).toEqual(usr1.fichas[0].getSaldo())
								expect(saldoAntesAlquiler2 - alquiler).toEqual(usr2.fichas[0].getSaldo())

								usr1.fichas[0].cobrar(precio) // Recuperamos el dinero para poder comprar todas las calles
								usr2.fichas[0].cobrar(alquiler) // Recuperamos el dinero para poder pagar todos los alquileres
							}					
						})
					});	
				});

				describe("Estaciones",function(){

					it("Cuantas más estaciones tiene un jugador, más alquiler cobra por ellas",function(){
						var alquilerAntiguo = 0

						partida.tablero.casillas.forEach(function (v,i,array){
							if (v.getTipo() == "Estacion"){
								var precio = v.getTema().getPrecio()
								
								usr1.fichas[0].lanzarDados([0,i-usr1.fichas[0].getPosicion()])
								usr1.fichas[0].comprarPropiedad()

								var alquilerNuevo = v.getTema().getAlquiler()
								expect(alquilerNuevo > alquilerAntiguo).toEqual(true)

								usr1.fichas[0].cobrar(precio) // Recuperamos el dinero para poder comprar todas las estaciones
								alquilerAntiguo = alquilerNuevo

								usr1.fichas[0].pasarTurno()
								usr2.fichas[0].lanzarDados([0,40])
								usr2.fichas[0].pasarTurno()
							}					
						})
					});

					it("Un jugador puede comprar las 4 estaciones",function(){
						var estaciones = []

						expect(usr1.fichas[0].getPropiedades().length).toEqual(0);

						partida.tablero.casillas.forEach(function (v,i,array){
							if (v.getTipo() == "Estacion"){
								var precio = v.getTema().getPrecio()
								var saldoInicial = usr1.fichas[0].getSaldo()

								usr1.fichas[0].lanzarDados([0,i-usr1.fichas[0].getPosicion()])
								usr1.fichas[0].comprarPropiedad()

								expect(saldoInicial - precio).toEqual(usr1.fichas[0].getSaldo())

								usr1.fichas[0].cobrar(precio) // Recuperamos el dinero para poder comprar todas las estaciones
								estaciones.push(v.getTema()) // Almacenamos las estaciones para comprobaciones posteriores

								usr1.fichas[0].pasarTurno()
								usr2.fichas[0].lanzarDados([0,40])
								usr2.fichas[0].pasarTurno()
							}					
						})

						expect(usr1.fichas[0].getPropiedades().length).toEqual(estaciones.length);
						expect(estaciones.every(function (v,i,array){return v.getEstado().constructor.name == "Comprada"})).toEqual(true)
					});

					it("Un jugador puede comprar todas las estaciones y si otro cae en ellas tiene que paga más cada vez",function(){
						partida.tablero.casillas.forEach(function (v,i,array){
							if (v.getTipo() == "Estacion"){
								var precio = v.getTema().getPrecio()						
								
								usr1.fichas[0].lanzarDados([0,i-usr1.fichas[0].getPosicion()])
								usr1.fichas[0].comprarPropiedad()
								usr1.fichas[0].pasarTurno()
								var saldoAntesAlquiler1 = usr1.fichas[0].getSaldo()

								var alquiler = v.getTema().getAlquiler()

								var saldoAntesAlquiler2 = usr2.fichas[0].getSaldo()
								usr2.fichas[0].lanzarDados([0,i-usr2.fichas[0].getPosicion()])
								usr2.fichas[0].pasarTurno()

								expect(saldoAntesAlquiler1 + alquiler).toEqual(usr1.fichas[0].getSaldo())
								expect(saldoAntesAlquiler2 - alquiler).toEqual(usr2.fichas[0].getSaldo())

								usr1.fichas[0].cobrar(precio) // Recuperamos el dinero para poder comprar todas las calles
								usr2.fichas[0].cobrar(alquiler) // Recuperamos el dinero para poder pagar todos los alquileres
							}					
						})
					});	
				});					
			});
		});

		describe("Tarjetas",function(){
			var partida, ficha1

			beforeEach(function(){
				partida = new modelo.Partida("Partida 1")
				ficha1 = (new modelo.Usuario("Alberto")).unirseAPartida(partida)				
			});

			it("Al iniciar una partida se crear dos cajas de 5 tarjetas cada una", function(){
				partida.calcularPrimerTurno()

				expect(partida.cajaTarjetasComunidad.length).toEqual(5)
				expect(partida.cajaTarjetasSuerte.length).toEqual(5)
			});

			it("Cuando un jugador cae en la casilla tarjeta coge la tarjeta y la vuelve a meter la última", function(){
				var cajaTest = [new modelo.LibreCarcel(), new modelo.Avanzar(5), new modelo.Retroceder(5), new modelo.Pagar(50), new modelo.Cobrar(50)]
				partida.calcularPrimerTurno(true)
				partida.cajaTarjetasComunidad = cajaTest

				ficha1.lanzarDados([0,2]) // Casilla de caja de comunidad

				expect(partida.cajaTarjetasComunidad.length).toEqual(5)
				expect(partida.cajaTarjetasComunidad[0].constructor.name).toEqual("Avanzar")
				expect(partida.cajaTarjetasComunidad[4].constructor.name).toEqual("LibreCarcel")
			});

			it("Tarjeta LibreCarcel ", function(){
				var cajaTest = [new modelo.LibreCarcel()]
				partida.calcularPrimerTurno(true)
				partida.cajaTarjetasComunidad = cajaTest

				expect(ficha1.tarjetaLibreCarcel).toEqual(false)

				ficha1.lanzarDados([0,2]) // Casilla de caja de comunidad

				expect(ficha1.tarjetaLibreCarcel).toEqual(true)
			});

			it("Tajeta Retroceder", function(){
				var cajaTest = [new modelo.Retroceder(5)]
				partida.calcularPrimerTurno(true)
				partida.cajaTarjetasComunidad = cajaTest

				ficha1.lanzarDados([0,2]) // Casilla de caja de comunidad

				expect(ficha1.posicion).toEqual(37)
			});
		});

		describe("Pruebas nuevas",function(){
			var partida, ficha1

			beforeEach(function(){
				partida = new modelo.Partida("Partida 1")
				ficha1 = (new modelo.Usuario("Alberto")).unirseAPartida(partida)
				partida.calcularPrimerTurno(true) // El turno es de Alberto, no aleatorio
			});

			describe("Propiedades",function(){

				it("Cuando un jugador compra todas las propiedades del mismo color, obtiene el monopolio", function(){
					var color = partida.tablero.getCasilla(1).getTema().getColor()

					ficha1.lanzarDados([0,1])
					ficha1.comprarPropiedad()
					ficha1.pasarTurno()
					ficha1.lanzarDados([0,2])
					ficha1.comprarPropiedad()

					expect(ficha1.getPropiedades().length).toEqual(2)
					expect(ficha1.getMonopolios().length).toEqual(1)
					expect(ficha1.getMonopolios()[0]).toEqual(color)
				});

				it("Cuando un jugador hipoteca una propiedad, recibe el dinero y la propiedad cambia de estado", function(){
					ficha1.lanzarDados([0,1])
					ficha1.comprarPropiedad()

					var saldoAnterior = ficha1.getSaldo()	
					var titulo = ficha1.getPropiedades()[0]

					ficha1.hipotecarPropiedad(titulo)
					expect(ficha1.getPropiedades().length).toEqual(1)
					expect(ficha1.getSaldo()).toEqual(saldoAnterior + titulo.getPropiedad().getPrecio() * 0.5)
					expect(titulo.getPropiedad().getEstado().constructor.name).toEqual("Hipotecada")
				});

				it("Cuando un jugador hipoteca una propiedad pierde el monopolio si lo tenía", function(){
					ficha1.lanzarDados([0,1])
					ficha1.comprarPropiedad()
					ficha1.pasarTurno()
					ficha1.lanzarDados([0,2])
					ficha1.comprarPropiedad()

					var titulo = ficha1.getPropiedades()[0]

					expect(ficha1.getMonopolios().length).toEqual(1)
					ficha1.hipotecarPropiedad(titulo)
					expect(ficha1.getMonopolios().length).toEqual(0)
				});

				it("Un jugador no puede hipotecar una calle si esta tiene edificaciones", function(){
					ficha1.lanzarDados([0,1])
					ficha1.comprarPropiedad()
					ficha1.pasarTurno()
					ficha1.lanzarDados([0,2])
					ficha1.comprarPropiedad()	
					
					var titulo = ficha1.getPropiedades()[0]
					ficha1.edificar(titulo)
					var saldoAnterior = ficha1.getSaldo()	

					ficha1.hipotecarPropiedad(titulo)
					expect(ficha1.getSaldo()).toEqual(saldoAnterior)
					expect(titulo.getPropiedad().getEstado().constructor.name).toEqual("Comprada")
				});

				describe("Edificaciones",function(){					

					it("Cuando un jugador no tiene el monopolio de un color no puede edificar", function(){
						ficha1.lanzarDados([0,1])
						ficha1.comprarPropiedad()

						var titulo = ficha1.getPropiedades()[0]
						var saldoAnterior = ficha1.getSaldo()

						ficha1.edificar(titulo)

						expect(titulo.getPropiedad().getNumCasas()).toEqual(0)
						expect(ficha1.getSaldo()).toEqual(saldoAnterior)
					});

					it("Cuando un jugador tiene el monopolio de un color puede edificar", function(){
						var precio_edificar = 50

						ficha1.lanzarDados([0,1])
						ficha1.comprarPropiedad()

						var titulo = ficha1.getPropiedades()[0]

						ficha1.pasarTurno()
						ficha1.lanzarDados([0,2])
						ficha1.comprarPropiedad()

						var saldoAnterior = ficha1.getSaldo()

						ficha1.edificar(titulo)

						expect(titulo.getPropiedad().getNumCasas()).toEqual(1)
						expect(ficha1.getSaldo()).toEqual(saldoAnterior - precio_edificar)
					});

					it("Un jugador no puede edificar fuera de orden", function(){
						var precio_edificar = 50

						ficha1.lanzarDados([0,1])
						ficha1.comprarPropiedad()

						var titulo = ficha1.getPropiedades()[0]

						ficha1.pasarTurno()
						ficha1.lanzarDados([0,2])
						ficha1.comprarPropiedad()

						var saldoAnterior = ficha1.getSaldo()

						ficha1.edificar(titulo)
						ficha1.edificar(titulo)

						expect(titulo.getPropiedad().getNumCasas()).toEqual(1)
						expect(ficha1.getSaldo()).toEqual(saldoAnterior - precio_edificar)
					});

					it("Un jugador puede construir 4 casas y un hotel en cada propiedad, nada más", function(){
						var precio_edificar = 50

						ficha1.lanzarDados([0,1])
						ficha1.comprarPropiedad()

						var titulo1 = ficha1.getPropiedades()[0]

						ficha1.pasarTurno()
						ficha1.lanzarDados([0,2])
						ficha1.comprarPropiedad()

						var titulo2 = ficha1.getPropiedades()[1]
						var saldoAnterior = ficha1.getSaldo()

						for(var i=0; i<5; i++){
							ficha1.edificar(titulo1)
							ficha1.edificar(titulo2)
						}

						expect(titulo1.getPropiedad().getNumCasas()).toEqual(5)
						expect(titulo2.getPropiedad().getNumCasas()).toEqual(5)
						expect(ficha1.getSaldo()).toEqual(saldoAnterior - (precio_edificar * 10))
						
						ficha1.edificar(titulo1)
						expect(titulo1.getPropiedad().getNumCasas()).toEqual(5)
						expect(ficha1.getSaldo()).toEqual(saldoAnterior - (precio_edificar * 10))
					});

					it("Un jugador puede vender las casas de una calle", function(){
						var precio_edificar = 50

						ficha1.lanzarDados([0,1])
						ficha1.comprarPropiedad()
						ficha1.pasarTurno()
						ficha1.lanzarDados([0,2])
						ficha1.comprarPropiedad()

						var titulo = ficha1.getPropiedades()[0]
						ficha1.edificar(titulo)

						var saldoAnterior = ficha1.getSaldo()
						ficha1.venderEdificio(titulo)

						expect(titulo.getPropiedad().getNumCasas()).toEqual(0)
						expect(ficha1.getSaldo()).toEqual(saldoAnterior + precio_edificar * 0.5)

						// No se puede vender si no hay
						ficha1.venderEdificio(titulo)

						expect(titulo.getPropiedad().getNumCasas()).toEqual(0)
						expect(ficha1.getSaldo()).toEqual(saldoAnterior + precio_edificar * 0.5)
					});

				});

			});
		});
	});
})