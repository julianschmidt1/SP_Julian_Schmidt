// Defino cols tanto en html como en js
const COLUMNAS = ["id", "nombre", "apellido", "edad", "equipo", "posicion", "cantidadGoles", "titulo", "facultad", "añoGraduacion", "modificar", "eliminar"];

const $ = (elemento) => {
    return document.getElementById(elemento);
}

const ENDPOINT = 'http://localhost/PersonasFutbolitasProfesionales.php';

const tabla = $('contenedor-tabla');
const formulario = $('abm-form');
const loader = $('loader');
formulario.style.display = 'none';
const contentCover = $('content-cover');
let listaPersonas;

//helper
const contenedorCheckboxes = $('checkbox-columnas');
COLUMNAS.map(columna => {
    const nombre = document.createElement('label');
    const checkbox = document.createElement('input');
    nombre.textContent = columna;
    nombre.style.marginLeft = '10px';
    checkbox.setAttribute('type', 'checkbox');
    checkbox.setAttribute('checked', 'true');
    checkbox.setAttribute('id', `checkbox-${columna}`);

    if (columna !== 'modificar' && columna !== 'eliminar') {
        contenedorCheckboxes.appendChild(nombre);
        contenedorCheckboxes.appendChild(checkbox);
    }
});

//helper
const cambiarVisibilidadColumnas = () => {
    COLUMNAS.map(columna => {
        const filas = document.querySelectorAll(`#celda-${columna}`);
        const cabeceraColumna = $(`cabecera-${columna}`);
        const checkboxes = document.querySelectorAll(`#checkbox-${columna}`);
        checkboxes.forEach(checkbox => {
            checkbox.onclick = () => {
                const visibilidad = checkbox?.checked ? 'table-cell' : 'none';
                filas?.forEach(col => {
                    col.style.display = visibilidad;
                });
                cabeceraColumna.style.display = visibilidad;
            }
        })
    });
}

//helper
const generarStatusPorDefecto = (prop) => {
    const checkbox = document.querySelector(`#checkbox-${prop}`);
    const columna = document.querySelector(`#cabecera-${prop}`);
    if (checkbox && columna) {
        checkbox.checked = true;
        columna.style.display = 'table-cell';
    }
}

//helper
const generarFilas = (lista) => {
    const filasAnteriores = tabla.querySelectorAll('tr');
    const filasTabla = $('filas-tabla');

    for (let i = 1; i < filasAnteriores.length; i++) {
        filasTabla.removeChild(filasAnteriores[i]);
    }

    lista.map((item, index) => {
        const fila = document.createElement("tr");
        fila.setAttribute("id-fila", index);
        fila.setAttribute("class", "fila-generada")

        COLUMNAS.map(columna => {
            const celda = document.createElement("td");
            celda.setAttribute('id', `celda-${columna}`);

            generarStatusPorDefecto(columna);

            if (columna !== 'modificar' && columna !== 'eliminar') {
                // Tuve que hacer esto porque cuando habia cantidad de puertas 0, mostraba N/A porque 0 cuenta como valor falsy. Magia Javascriptera :) (igual que en el primer parcial)
                celda.textContent = item[columna] !== undefined && item[columna] !== null && item[columna] !== '' ? item[columna] : 'N/A';
                fila.appendChild(celda);
            } else {
                const celdaBotones = document.createElement("td");
                const boton = document.createElement('button');
                boton.textContent = columna;

                boton.onclick = (e) => {
                    const fila = e.target.closest('tr');
                    const idFila = fila?.getAttribute('id-fila');

                    if (fila && idFila) {
                        const datosCelda = fila?.querySelectorAll('td');

                        if (columna === 'eliminar') {

                            const idPersona = parseInt(datosCelda[0].textContent);

                            manejarLoader();
                            fetch(ENDPOINT, {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ id: idPersona })
                            })
                                .then(response => {
                                    manejarLoader('none');

                                    if (response.ok) {
                                        return response;
                                    } else {
                                        abrirTabla();
                                        throw new Error('No se pudo realizar la operación');
                                    }
                                })
                                .then(() => {
                                    listaPersonas = listaPersonas.filter(persona => persona.id !== parseInt(idPersona));
                                    generarFilas(listaPersonas);
                                    abrirTabla();
                                })
                                .catch(error => {
                                    abrirTabla();
                                    manejarLoader('none');
                                    console.log(error);
                                    alert("Ocurrio un error: ", error + 'dada')
                                });

                        } else {
                            let datos = {};
                            datosCelda.forEach((_, index) => {
                                const columna = COLUMNAS[index];
                                const valor = datosCelda[index].textContent;
                                datos[columna] = valor;
                            });

                            $('id-input').value = datos.id || '';
                            $('nombre-input').value = datos.nombre || '';
                            $('apellido-input').value = datos.apellido || '';
                            $('edad-input').value = datos.edad || '';

                            $('equipo-input').value = datos.equipo || '';
                            $('posicion-input').value = datos.posicion || '';
                            $('cantidadGoles-input').value = datos.cantidadGoles || '';

                            $('titulo-input').value = datos.titulo || '';
                            $('facultad-input').value = datos.facultad || '';
                            $('añoGraduacion-input').value = datos.añoGraduacion || '';

                            $('tipo-input').value = datos?.posicion !== 'N/A' ? '1' : '2';

                            abrirFormulario(true, datos?.posicion);
                        }
                    }
                };

                celdaBotones.appendChild(boton);
                fila.appendChild(celdaBotones);
            }
        });
        filasTabla.appendChild(fila);
    });

    cambiarVisibilidadColumnas();
}

// Convierto a tipo
const convertirObjetoATipoPersona = (datos) => {
    return datos.map(persona => {
        const esFutbolista = persona?.posicion;
        const { id, nombre, apellido, edad } = persona;
        if (esFutbolista) {
            const { equipo, posicion, cantidadGoles } = persona;
            return new Futbolista(id, nombre, apellido, edad, equipo, posicion, cantidadGoles);
        } else {
            const { titulo, facultad, añoGraduacion } = persona;
            return new Profesional(id, nombre, apellido, edad, titulo, facultad, añoGraduacion);
        }
    });
}

const manejarLoader = (estado = 'block') => {
    loader.style.display = estado;
    contentCover.style.display = estado;
}

const cargarDatosDesdeAPI = () => {
    const xhr = new XMLHttpRequest();

    xhr.open('GET', ENDPOINT);
    xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            manejarLoader('none');
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                listaPersonas = convertirObjetoATipoPersona(response);
                generarFilas(listaPersonas);
            } else {
                alert("Ocurrio un error");
            }
        }
    };

    manejarLoader();
    xhr.send();
}

cargarDatosDesdeAPI();

const abrirFormulario = (estaEditando, tipoFutbolista) => {
    seleccionarTipoPersona(estaEditando, tipoFutbolista);
    formulario.style.display = 'flex';
    tabla.style.display = 'none';
    $('tipo-input').style.display = estaEditando ? 'none' : 'block';
}

const seleccionarTipoPersona = (estaEditando, tipoFutbolista) => {
    const esFutbolista = $('tipo-input').value == '1';

    if ((esFutbolista && !estaEditando || (estaEditando && tipoFutbolista != 'N/A'))) {
        $('equipo-input').style.display = 'block';
        $('posicion-input').style.display = 'block';
        $('cantidadGoles-input').style.display = 'block';
        $('titulo-input').style.display = 'none';
        $('facultad-input').style.display = 'none';
        $('añoGraduacion-input').style.display = 'none';
    } else {
        $('equipo-input').style.display = 'none';
        $('posicion-input').style.display = 'none';
        $('cantidadGoles-input').style.display = 'none';
        $('titulo-input').style.display = 'block';
        $('facultad-input').style.display = 'block';
        $('añoGraduacion-input').style.display = 'block';
    }
}


const abrirTabla = () => {
    formulario.style.display = 'none';
    tabla.style.display = 'block';
    $('id-input').value = '';
    $('nombre-input').value = '';
    $('apellido-input').value = '';
    $('edad-input').value = '';
    $('equipo-input').value = '';
    $('posicion-input').value = '';
    $('cantidadGoles-input').value = '';
    $('titulo-input').value = '';
    $('facultad-input').value = '';
    $('añoGraduacion-input').value = '';
}

// alta/modif
const aceptarAccion = async () => {
    const idPersona = $('id-input').value;
    const nombre = $('nombre-input').value.trim();
    const apellido = $('apellido-input').value.trim();
    const edad = parseInt($('edad-input').value);

    // opc 1
    const equipo = $('equipo-input').value;
    const posicion = $('posicion-input').value;
    const cantidadGoles = parseInt($('cantidadGoles-input').value);

    // opc2
    const titulo = $('titulo-input').value;
    const facultad = $('facultad-input').value;
    const añoGraduacion = parseInt($('añoGraduacion-input').value);

    const esFutbolista = $('tipo-input').value === '1';
    const idPersonaGenerado = idPersona ? parseInt(idPersona) : 0;
    let nuevaPersona;

    if (esFutbolista) {
        nuevaPersona = new Futbolista(
            idPersonaGenerado,
            nombre,
            apellido,
            edad,
            equipo,
            posicion,
            cantidadGoles
        );
    } else {
        nuevaPersona = new Profesional(
            idPersonaGenerado,
            nombre,
            apellido,
            edad,
            titulo,
            facultad,
            añoGraduacion
        );
    }

    if (nombre.length > 0 && apellido.length > 0 && edad > 15 &&
        ((nuevaPersona instanceof Futbolista && equipo.length > 0 && posicion.length > 0 && cantidadGoles > -1) ||
            (nuevaPersona instanceof Profesional && titulo.length > 0 && facultad.length > 0 && añoGraduacion > 1950))
    ) {

        manejarLoader();
        if (idPersonaGenerado) {

            // response = await fetch(ENDPOINT, {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json'
            //     },
            //     body: JSON.stringify(nuevaPersona)
            // });

            // if (response.ok) {
            //     data = await response;
            //     console.log('data', data);

            //     listaPersonas = [...listaPersonas.filter(p => p.id !== idPersonaGenerado), nuevaPersona];

            //     generarFilas(listaPersonas);
            //     manejarLoader('none');
            //     abrirTabla();
            // } else {
            //     abrirTabla();
            //     manejarLoader('none');
            //     alert("Ocurrió un error al actualizar los datos");
            // }

            modificarPersona(nuevaPersona, idPersonaGenerado)
                .then(() => {
                    abrirTabla();
                })
                .catch(error => {
                    abrirTabla();
                    manejarLoader('none');
                    alert("Ocurrió un error al actualizar los datos: " + error.message);
                });

        } else {

            try {
                const response = await fetch(ENDPOINT, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(nuevaPersona)
                });

                manejarLoader('none');

                if (!response.ok) {
                    abrirTabla();
                    throw new Error('No se pudo realizar la operación');
                }

                const data = await response.json();
                const nuevoID = data.id;
                nuevaPersona = {
                    ...nuevaPersona,
                    id: nuevoID
                };
                listaPersonas = [...listaPersonas, nuevaPersona];

                generarFilas(listaPersonas);
                abrirTabla();
            } catch (error) {
                abrirTabla();
                manejarLoader('none');
                alert("Ocurrio un error: " + error);
            }
        }


    } else {
        alert("Uno de los valores no es valido");
    }

}


const modificarPersona = (nuevaPersona, idPersonaGenerado) => {
    return new Promise((resolve, reject) => {
        fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevaPersona)
        })
            .then(response => {
                if (!response.ok) {
                    reject(new Error('No se pudo realizar la operación'));
                }
                return response;
            })
            .then(data => {
                listaPersonas = [...listaPersonas.filter(p => p.id !== idPersonaGenerado), nuevaPersona];
                generarFilas(listaPersonas);
                manejarLoader('none');
                resolve();
            })
            .catch(error => {
                reject(error);
            });
    });
};