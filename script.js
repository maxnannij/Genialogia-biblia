document.addEventListener('DOMContentLoaded', () => {

    const panel = document.getElementById('panel-izquierdo');
    const lienzo = document.getElementById('lienzo');
    let formaArrastrada = null;
    let celdaIdCounter = 0;

    // Inicializar jsPlumb
    const instance = jsPlumb.getInstance({
        Container: lienzo,
        DragOptions: { cursor: 'pointer', zIndex: 2000 },
        ConnectionOverlays: [
            ['Arrow', { location: 1, width: 10, length: 10 }]
        ],
        Endpoint: ["Dot", { radius: 5 }],
        Connector: "StateMachine", // Opciones: "Straight", "Flowchart", "Bezier"
        PaintStyle: { stroke: '#facc15', strokeWidth: 3 }, // Color de la flecha
        EndpointStyle: { fill: '#facc15' }
    });

    // --- FUNCIONALIDAD DE ARRASTRAR Y SOLTAR ---

    panel.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('forma-arrastrable')) {
            formaArrastrada = e.target.dataset.shape;
        }
    });

    lienzo.addEventListener('dragover', (e) => {
        e.preventDefault(); // Permite que se pueda soltar el elemento aquí
    });

    lienzo.addEventListener('drop', (e) => {
        e.preventDefault();
        if (formaArrastrada) {
            crearCelda(formaArrastrada, e.clientX, e.clientY);
            formaArrastrada = null;
        }
    });

    // --- FUNCIÓN PARA CREAR UNA NUEVA CELDA ---

    function crearCelda(shape, x, y) {
        const id = `celda_${celdaIdCounter++}`;
        const nuevaCelda = document.createElement('div');
        nuevaCelda.id = id;
        nuevaCelda.className = `celda ${shape}`;
        
        const rect = lienzo.getBoundingClientRect();
        nuevaCelda.style.left = `${x - rect.left - 75}px`; // Centrar la celda en el cursor
        nuevaCelda.style.top = `${y - rect.top - 35}px`;

        // Contenido de la celda (nombre editable, color, tooltip)
        nuevaCelda.innerHTML = `
            <div class="nombre-celda" contenteditable="true">Texto</div>
            <div class="tooltip-contenido">
                <p>Descripción detallada:</p>
                <textarea class="descripcion" rows="4">Más información aquí...</textarea>
                <label>Color de fondo:</label>
                <input type="color" class="color-celda" value="#2d3748">
            </div>
        `;
        
        lienzo.appendChild(nuevaCelda);
        hacerCeldaInteractiva(id);
    }
    
    // --- HACER LAS CELDAS INTERACTIVAS CON JSPLUMB ---

    function hacerCeldaInteractiva(id) {
        const celda = document.getElementById(id);

        // Hacerla arrastrable dentro del lienzo
        instance.draggable(celda, {
            containment: 'parent'
        });

        // Definir como origen y destino de conexiones
        instance.makeSource(celda, {
            filter: '.nombre-celda', // Solo se puede arrastrar desde el nombre para crear una conexión
            anchor: "Continuous",
            connectorStyle: { stroke: '#facc15', strokeWidth: 3 },
        });

        instance.makeTarget(celda, {
            anchor: "Continuous",
            dropOptions: { hoverClass: 'dragHover' }
        });

        // Eventos para cambiar el color
        const colorInput = celda.querySelector('.color-celda');
        colorInput.addEventListener('input', (e) => {
            if (celda.classList.contains('triangulo')) {
                celda.style.borderBottomColor = e.target.value;
            } else {
                celda.style.backgroundColor = e.target.value;
            }
        });
    }

    // --- GUARDAR, CARGAR Y LIMPIAR ---

    document.getElementById('guardar').addEventListener('click', guardarDiagrama);
    document.getElementById('cargar').addEventListener('click', cargarDiagrama);
    document.getElementById('limpiar').addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres borrar todo el lienzo?')) {
            lienzo.innerHTML = '';
            instance.deleteEveryConnection();
            instance.deleteEveryEndpoint();
            celdaIdCounter = 0;
        }
    });

    function guardarDiagrama() {
        const celdas = [];
        document.querySelectorAll('.celda').forEach(celda => {
            celdas.push({
                id: celda.id,
                clases: celda.className,
                posicion: { top: celda.style.top, left: celda.style.left },
                nombre: celda.querySelector('.nombre-celda').innerHTML,
                descripcion: celda.querySelector('.descripcion').value,
                color: celda.classList.contains('triangulo') ? celda.style.borderBottomColor : celda.style.backgroundColor
            });
        });

        const conexiones = instance.getAllConnections().map(conn => ({
            sourceId: conn.sourceId,
            targetId: conn.targetId
        }));

        const diagrama = {
            celdas: celdas,
            conexiones: conexiones,
            contador: celdaIdCounter
        };

        // Guardamos en localStorage como un string JSON
        localStorage.setItem('miDiagrama', JSON.stringify(diagrama));
        alert('¡Diagrama guardado localmente!');
    }
    
    function cargarDiagrama() {
        const dataGuardada = localStorage.getItem('miDiagrama');
        if (!dataGuardada) {
            alert('No hay ningún diagrama guardado.');
            return;
        }

        // Limpiar el estado actual antes de cargar
        lienzo.innerHTML = '';
        instance.deleteEveryConnection();
        instance.deleteEveryEndpoint();

        const diagrama = JSON.parse(dataGuardada);
        celdaIdCounter = diagrama.contador || 0;

        // 1. Re-crear todas las celdas
        diagrama.celdas.forEach(dataCelda => {
            const nuevaCelda = document.createElement('div');
            nuevaCelda.id = dataCelda.id;
            nuevaCelda.className = dataCelda.clases;
            nuevaCelda.style.left = dataCelda.posicion.left;
            nuevaCelda.style.top = dataCelda.posicion.top;

            nuevaCelda.innerHTML = `
                <div class="nombre-celda" contenteditable="true">${dataCelda.nombre}</div>
                <div class="tooltip-contenido">
                    <p>Descripción detallada:</p>
                    <textarea class="descripcion" rows="4">${dataCelda.descripcion}</textarea>
                    <label>Color de fondo:</label>
                    <input type="color" class="color-celda">
                </div>
            `;
            
            if (nuevaCelda.classList.contains('triangulo')) {
                nuevaCelda.style.borderBottomColor = dataCelda.color || '#e53e3e';
                nuevaCelda.querySelector('.color-celda').value = dataCelda.color || '#e53e3e';
            } else {
                nuevaCelda.style.backgroundColor = dataCelda.color || '#2d3748';
                nuevaCelda.querySelector('.color-celda').value = dataCelda.color || '#2d3748';
            }
            
            lienzo.appendChild(nuevaCelda);
            hacerCeldaInteractiva(dataCelda.id);
        });

        // 2. Re-crear todas las conexiones
        diagrama.conexiones.forEach(conn => {
            instance.connect({
                source: conn.sourceId,
                target: conn.targetId
            });
        });

        alert('¡Diagrama cargado!');
    }
});
