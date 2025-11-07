let productos = [];
let carrito = [];
let trabajadorActivo = {};

// funciones del loader

function mostrarLoader() {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'flex';
}

function ocultarLoader() {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'none';
}

// Inicialización de la aplicación

window.onload = inicializarApp;

async function inicializarApp() {
	trabajadorActivo = sessionStorage.getItem('trabajadorActivo');
	const usuarioSesion = document.getElementById('usuarioSesion');
	const logoutBtn = document.getElementById('logoutBtn');
	const goLoginBtn = document.getElementById('goLoginBtn');

	// Mostrar sesión actual 
	if (trabajadorActivo && usuarioSesion) {
		usuarioSesion.textContent = `Sesión: ${trabajadorActivo}`;
		logoutBtn.style.display = 'inline-block';
		goLoginBtn.style.display = 'none';
	} else {
		usuarioSesion.textContent = '';
		logoutBtn.style.display = 'none';
		goLoginBtn.style.display = 'inline-block';
	}

	// Mostrar empleado activo
	if (trabajadorActivo) {
		const empSel = document.getElementById('empleado');
		empSel.innerHTML = '';
		const opt = document.createElement('option');
		opt.value = trabajadorActivo;
		opt.textContent = trabajadorActivo;
		empSel.appendChild(opt);
		empSel.disabled = false;
	}

	// Cargar productos desde el backend Node.js
	try {
		mostrarLoader();
		const resp = await fetch('http://localhost:3000/api/productos');
		if (!resp.ok) throw new Error(`Error HTTP ${resp.status}`);
		productos = await resp.json();
		console.log("Productos cargados:", productos);
	} catch (e) {
		console.error('Error cargando productos:', e);
		alert('No se pudo cargar el inventario de productos desde el servidor.');
		productos = [];
	} finally {
		ocultarLoader();
	}

	// Rellenar el selector de productos
	const prodSel = document.getElementById('producto');
	prodSel.innerHTML = '';
	productos.forEach((p, i) => {
		const opt = document.createElement('option');
		opt.value = i;
		opt.textContent = `${p.nombre} ($${p.precio}) - Stock: ${p.stock}`;
		prodSel.appendChild(opt);
	});

	// Botones de sesión
	goLoginBtn.addEventListener('click', () => window.location.href = 'login.html');
	logoutBtn.addEventListener('click', () => {
		sessionStorage.removeItem('trabajadorActivo');
		window.location.reload();
	});

	// Botón de agregar al carrito
	document.getElementById('agregarCarritoBtn').addEventListener('click', agregarAlCarrito);

	renderCarrito();
}

// Función para agregar productos al carrito

function agregarAlCarrito() {
  const prodSel = document.getElementById('producto');
  const cantidadInput = document.getElementById('cantidad');
  const mensajeDiv = document.getElementById('mensajeCarrito');

  if (mensajeDiv) {
    mensajeDiv.textContent = '';
  }

  const rawIndex = prodSel?.value;
  const rawCantidad = cantidadInput?.value;

  if (rawIndex === undefined || rawIndex === null || rawIndex === '') {
    if (mensajeDiv) {
      mensajeDiv.textContent = 'Seleccione un producto válido.';
      mensajeDiv.style.color = 'red';
    }
    return;
  }

  const index = Number(rawIndex);
  const cantidad = Number(rawCantidad);

  if (!Number.isInteger(index) || index < 0 || index >= productos.length) {
    if (mensajeDiv) {
      mensajeDiv.textContent = 'Seleccione un producto válido.';
      mensajeDiv.style.color = 'red';
    }
    return;
  }

  // validar cantidad
  if (rawCantidad === null || rawCantidad === undefined || rawCantidad.toString().trim() === '') {
    if (mensajeDiv) {
      mensajeDiv.textContent = 'Ingrese una cantidad válida.';
      mensajeDiv.style.color = 'red';
    }
    return;
  }
  if (!Number.isFinite(cantidad) || !Number.isInteger(cantidad) || cantidad <= 0) {
    if (mensajeDiv) {
      mensajeDiv.textContent = 'Ingrese una cantidad válida.';
      mensajeDiv.style.color = 'red';
    }
    return;
  }

  const producto = productos[index];
  if (!producto) {
    if (mensajeDiv) {
      mensajeDiv.textContent = 'Producto no encontrado.';
      mensajeDiv.style.color = 'red';
    }
    return;
  }

  // validar stock
  if (cantidad > producto.stock) {
    if (mensajeDiv) {
      mensajeDiv.textContent = `No hay suficiente stock de ${producto.nombre} (disponibles: ${producto.stock}).`;
      mensajeDiv.style.color = 'red';
    }
    return;
  }

  // agregar o actualizar en carrito
  const itemExistente = carrito.find(item => item.id === producto.id);
  if (itemExistente) {
    itemExistente.cantidad += cantidad;
  } else {
    carrito.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad
    });
  }

  renderCarrito();
  cantidadInput.value = ''; 

  if (mensajeDiv) {
    mensajeDiv.textContent = ` ${producto.nombre} agregado correctamente al carrito.`;
    mensajeDiv.style.color = 'green';
    setTimeout(() => { mensajeDiv.textContent = ''; }, 2500);
  }
}


// Mostrar carrito visualmente

function renderCarrito() {
	const lista = document.getElementById('carritoLista');
	const totalDiv = document.getElementById('totalCarrito');
	if (!lista) return; 
	lista.innerHTML = '';

	let total = 0;

	carrito.forEach((item, i) => {
		const li = document.createElement('li');
		const subtotal = item.precio * item.cantidad;
		total += subtotal;

		// Construir contenido con subtotal formateado
		li.innerHTML = `${item.nombre} (x${item.cantidad}) - $${subtotal.toLocaleString()}`;

		const btn = document.createElement('button');
		btn.textContent = 'X';
		btn.onclick = () => {
			carrito.splice(i, 1);
			renderCarrito();
		};

		li.appendChild(btn);
		lista.appendChild(li);
	});

	if (totalDiv) {
		totalDiv.textContent = carrito.length > 0 ? ` Total: $${total.toLocaleString()}` : '';
	}
}

// Registrar venta con backend 

document.getElementById('ventaForm').addEventListener('submit', async function(e) {
	e.preventDefault();
	mostrarLoader();

	const cliente = document.getElementById('cliente').value.trim();
	const empleado = document.getElementById('empleado').value;
	const resultadoDiv = document.getElementById('resultadoVenta');

	if (!trabajadorActivo) {
		resultadoDiv.textContent = 'Debes iniciar sesión para registrar una venta.';
		ocultarLoader();
		return;
	}

	if (!cliente) {
		resultadoDiv.textContent = 'Debe ingresar el nombre del cliente.';
		ocultarLoader();
		return;
	}

	if (carrito.length === 0) {
		resultadoDiv.textContent = 'Agrega al menos un producto.';
		ocultarLoader();
		return;
	}

	const venta = { cliente, empleado, productos: carrito };

	try {
		const resp = await fetch('http://localhost:3000/api/venta', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(venta)
		});

		const data = await resp.json();

		if (resp.ok && data.success) {
			// Calcular total de la venta
			const totalVenta = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);

			resultadoDiv.innerHTML = `
				<strong>${data.message}</strong><br>
				Cliente: ${cliente}<br>
				Empleado: ${empleado}<br>
				Productos:<ul>
					${venta.productos.map(p => `<li>${p.nombre} (x${p.cantidad}) - $${(p.precio * p.cantidad).toLocaleString()}</li>`).join('')}
				</ul>
				<hr>
				<h3>Total de la venta:  $${totalVenta.toLocaleString()}</h3>
			`;

			// Limpiar carrito y formulario
			carrito = [];
			renderCarrito();
			this.reset();

			// Actualizar productos desde backend
			const respProd = await fetch('http://localhost:3000/api/productos');
			productos = await respProd.json();

			const prodSel = document.getElementById('producto');
			prodSel.innerHTML = '';
			productos.forEach((p, i) => {
				const opt = document.createElement('option');
				opt.value = i;
				opt.textContent = `${p.nombre} ($${p.precio}) - Stock: ${p.stock}`;
				prodSel.appendChild(opt);
			});
		} else {
			resultadoDiv.textContent = data.message || 'Error al registrar la venta.';
		}
	} catch (err) {
		console.error(err);
		resultadoDiv.textContent = 'Error de conexión con el servidor.';
	} finally {
		ocultarLoader();
	}
});
