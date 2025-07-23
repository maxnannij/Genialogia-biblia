document.addEventListener('DOMContentLoaded', () => {
    // --- Comprobación inicial ---
    console.log("El script se ha cargado correctamente.");

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
        e.preventDefault(); // MUY IMPORTANTE: Permite que se pueda soltar
    });

    lienzo.addEventListener('drop', (e) => {
        e.preventDefault(); // Previene que el navegador abra el dato como un archivo
        const shape = e.dataTransfer.getData('text/plain');
        console.log(`Forma soltada: ${shape}`);

        if (shape) {
            const rect = lienzo.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            crearCelda(shape, x, y);
        } else {
            console.warn("Se intentó soltar algo sin datos de forma.");
        }
    });

    function crearCelda(shape, x, y) {
        const id = `celda_${celdaIdCounter++}`;
        const nuevaCelda = document.createElement('div');
        nuevaCelda.id = id;
        nuevaCelda.className = `celda ${shape}`;
        
        // Centrar la celda donde se soltó
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
        console.log(`Celda creada con id: ${id} en (${x}, ${y})`);
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

    // El resto de funciones (guardar/cargar) se mantienen igual que en la respuesta anterior
    // ... (puedes copiar y pegar la sección de guardar/cargar/limpiar de la respuesta anterior aquí)
});
