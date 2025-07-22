document.addEventListener('DOMContentLoaded', () => {

    const lienzo = document.getElementById('lienzo');
    const formasArrastrables = document.querySelectorAll('.forma-arrastrable');
    let celdaIdCounter = 0;

    // Inicializar jsPlumb
    const instance = jsPlumb.getInstance({
        Container: lienzo,
        DragOptions: { cursor: 'pointer', zIndex: 2000 },
        ConnectionOverlays: [
            ['Arrow', { location: 1, width: 10, length: 10 }]
        ],
        Endpoint: ["Dot", { radius: 5 }],
        Connector: "StateMachine",
        PaintStyle: { stroke: '#facc15', strokeWidth: 3 },
        EndpointStyle: { fill: '#facc15' }
    });

    // --- FUNCIONALIDAD DE ARRASTRAR Y SOLTAR (VERSIÓN CORREGIDA) ---

    // 1. Añadir un listener a cada forma que se puede arrastrar
    formasArrastrables.forEach(forma => {
        forma.addEventListener('dragstart', (e) => {
            // Guardamos el tipo de forma en el objeto de transferencia de datos
            e.dataTransfer.setData('text/plain', e.target.dataset.shape);
        });
    });

    // 2. Prevenir el comportamiento por defecto cuando un elemento se arrastra sobre el lienzo
    // ESTE ES EL PASO MÁS IMPORTANTE PARA QUE 'DROP' FUNCIONE
    lienzo.addEventListener('dragover', (e) => {
        e.preventDefault(); 
    });

    // 3. Manejar el evento cuando se suelta la forma en el lienzo
    lienzo.addEventListener('drop', (e) => {
        e.preventDefault(); // También es buena práctica aquí
        const forma = e.dataTransfer.getData('text/plain');
        if (forma) {
            // Obtenemos las coordenadas relativas al lienzo
            const rect = lienzo.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            crearCelda(forma, x, y);
        }
    });

    // --- FUNCIÓN PARA CREAR UNA NUEVA CELDA ---

    function crearCelda(shape, x, y) {
        const id = `celda_${celdaIdCounter++}`;
        const nuevaCelda = document.createElement('div');
        nuevaCelda.id = id;
        nuevaCelda.className = `celda ${shape}`;
        
        // Centramos la celda donde se soltó el cursor
        nuevaCelda.style.left = `${x - 75}px`; 
        nuevaCelda.style.top = `${y - 40}px`;

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
    // (Esta parte no cambia)
    function hacerCeldaInteractiva(id) {
        const celda = document.getElementById(id);

        instance.draggable(celda, {
            containment: 'parent'
        });

        instance.makeSource(celda, {
            filter: '.nombre-celda',
            anchor: "Continuous",
            connectorStyle: { stroke: '#facc15', strokeWidth: 3 },
        });

        instance.makeTarget(celda, {
            anchor: "Continuous",
            dropOptions: { hoverClass: 'dragHover' }
        });

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
    // (Esta parte no cambia)
    document.getElementById('guardar').addEventListener('click', guardarDiagrama);
    document.getElementById('cargar').addEventListener('click', cargarDiagrama);
    document.getElementById('limpiar').addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres borrar todo el lienzo?')) {
            lienzo.innerHTML = '';
            instance.deleteEveryConnection();
            instance.deleteEveryEndpoint();
            celdaIdCounter = 0;
            localStorage.removeItem('miDiagrama');
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
        
        localStorage.setItem('miDiagrama', JSON.stringify(diagrama));
        alert('¡Diagrama guardado localmente!');
    }
    
    function cargarDiagrama() {
        const dataGuardada = localStorage.getItem('miDiagrama');
        if (!dataGuardada) {
            alert('No hay ningún diagrama guardado.');
            return;
        }

        lienzo.innerHTML = '';
        instance.deleteEveryConnection();
        instance.deleteEveryEndpoint();

        const diagrama = JSON.parse(dataGuardada);
        celdaIdCounter = diagrama.contador || 0;

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

        diagrama.conexiones.forEach(conn => {
            instance.connect({
                source: conn.sourceId,
                target: conn.targetId
            });
        });

        alert('¡Diagrama cargado!');
    }
});
