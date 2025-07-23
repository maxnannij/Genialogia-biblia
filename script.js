// En lugar de esperar solo a que el DOM esté listo,
// esperamos a que jsPlumb esté listo.
jsPlumb.ready(function() {

    // --- Comprobación inicial ---
    console.log("jsPlumb está listo. Iniciando el script.");

    const lienzo = document.getElementById('lienzo');
    const formasArrastrables = document.querySelectorAll('.forma-arrastrable');
    let celdaIdCounter = 0;

    // --- Comprobación de elementos ---
    if (!lienzo) {
        console.error("Error: No se encontró el elemento con id 'lienzo'.");
        return;
    }
    console.log("Lienzo encontrado:", lienzo);
    console.log("Formas encontradas:", formasArrastrables.length);

    // Inicializar jsPlumb
    // Ahora estamos seguros de que 'jsPlumb' existe.
    const instance = jsPlumb.getInstance({
        Container: lienzo,
        DragOptions: { cursor: 'pointer', zIndex: 2000 },
        ConnectionOverlays: [['Arrow', { location: 1, width: 10, length: 10 }]],
        Endpoint: ["Dot", { radius: 5 }],
        Connector: "StateMachine",
        PaintStyle: { stroke: '#facc15', strokeWidth: 3 },
        EndpointStyle: { fill: '#facc15' }
    });

    // --- LÓGICA DE ARRASTRAR Y SOLTAR ---

    formasArrastrables.forEach(forma => {
        forma.addEventListener('dragstart', (e) => {
            const shape = e.target.dataset.shape;
            e.dataTransfer.setData('text/plain', shape);
            console.log(`Arrastrando forma: ${shape}`);
        });
    });

    lienzo.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    lienzo.addEventListener('drop', (e) => {
        e.preventDefault();
        const shape = e.dataTransfer.getData('text/plain');
        console.log(`Forma soltada: ${shape}`);

        if (shape) {
            const rect = lienzo.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            crearCelda(shape, x, y);
        }
    });

    function crearCelda(shape, x, y) {
        const id = `celda_${celdaIdCounter++}`;
        const nuevaCelda = document.createElement('div');
        nuevaCelda.id = id;
        nuevaCelda.className = `celda ${shape}`;
        
        nuevaCelda.style.left = `${x - 75}px`; 
        nuevaCelda.style.top = `${y - 40}px`;

        nuevaCelda.innerHTML = `
            <div class="nombre-celda" contenteditable="true">Texto</div>
            <div class="tooltip-contenido">
                <p>Descripción:</p>
                <textarea class="descripcion" rows="4">Más info...</textarea>
                <label>Color:</label>
                <input type="color" class="color-celda" value="#2d3748">
            </div>
        `;
        
        lienzo.appendChild(nuevaCelda);
        console.log(`Celda creada con id: ${id}`);
        hacerCeldaInteractiva(id);
    }
    
    function hacerCeldaInteractiva(id) {
        const celda = document.getElementById(id);
        instance.draggable(celda, { containment: 'parent' });
        instance.makeSource(celda, { filter: '.nombre-celda', anchor: "Continuous" });
        instance.makeTarget(celda, { anchor: "Continuous", dropOptions: { hoverClass: 'dragHover' } });

        const colorInput = celda.querySelector('.color-celda');
        colorInput.addEventListener('input', (e) => {
            if (celda.classList.contains('triangulo')) {
                celda.style.borderBottomColor = e.target.value;
            } else {
                celda.style.backgroundColor = e.target.value;
            }
        });
    }

    // --- FUNCIONES DE GUARDAR, CARGAR Y LIMPIAR ---
    
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
    
    // (Estas funciones no necesitan cambios, pero las incluyo para que tengas el archivo completo)
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
            
            const colorPicker = nuevaCelda.querySelector('.color-celda');
            if (nuevaCelda.classList.contains('triangulo')) {
                nuevaCelda.style.borderBottomColor = dataCelda.color || '#e53e3e';
                colorPicker.value = dataCelda.color || '#e53e3e';
            } else {
                nuevaCelda.style.backgroundColor = dataCelda.color || '#2d3748';
                colorPicker.value = dataCelda.color || '#2d3748';
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
