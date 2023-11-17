class Futbolista extends Persona {
    constructor(id, nombre, apellido, edad, equipo, posicion, cantidadGoles) {
        super(id, nombre, apellido, edad);

        this.equipo = equipo;
        this.posicion = posicion;
        this.cantidadGoles = cantidadGoles;
    }
}