let productos = [];
let carrito = [];
let trabajadorActivo = null;

// Inicialización de la aplicación
async function inicializarApp() {
	trabajadorActivo = localStorage.getItem('trabajadorActivo');
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
		const resp = await fetch('http://localhost:3000/api/productos');
		if (!resp.ok) throw new Error(`Error HTTP ${resp.status}`);
		productos = await resp.json();
		console.log("Productos cargados:", productos);
	} catch (e) {
		console.error('Error cargando productos:', e);
		alert('No se pudo cargar el inventario de productos desde el servidor.');
		productos = [];
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
		localStorage.removeItem('trabajadorActivo');
		window.location.reload();
	});

	// Botón de agregar al carrito
	document.getElementById('agregarCarritoBtn').addEventListener('click', agregarAlCarrito);

	renderCarrito();
}

window.onload = inicializarApp;

// Función para agregar productos al carrito
function agregarAlCarrito() {
	const prodSel = document.getElementById('producto');
	const cantidadInput = document.getElementById('cantidad');
	const index = parseInt(prodSel.value);
	const cantidad = parseInt(cantidadInput.value);

	if (isNaN(index) || index < 0) return alert('Seleccione un producto válido.');
	if (!cantidad || cantidad <= 0) return alert('Ingrese una cantidad válida.');

	const producto = productos[index];

	if (cantidad > producto.stock) {
		return alert(`No hay suficiente stock de ${producto.nombre}.`);
	}

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
}

// Mostrar carrito visualmente
function renderCarrito() {
	const lista = document.getElementById('carritoLista');
	lista.innerHTML = '';

	carrito.forEach((item, i) => {
		const li = document.createElement('li');
		li.textContent = `${item.nombre} (x${item.cantidad}) - $${item.precio * item.cantidad}`;
		const btn = document.createElement('button');
		btn.textContent = '❌';
		btn.onclick = () => {
			carrito.splice(i, 1);
			renderCarrito();
		};
		li.appendChild(btn);
		lista.appendChild(li);
	});
}

// Registrar venta con backend
document.getElementById('ventaForm').addEventListener('submit', async function(e) {
	e.preventDefault();
	const cliente = document.getElementById('cliente').value.trim();
	const empleado = document.getElementById('empleado').value;
	const resultadoDiv = document.getElementById('resultadoVenta');

	if (!trabajadorActivo) return resultadoDiv.textContent = 'Debes iniciar sesión.';
	if (!cliente) return resultadoDiv.textContent = 'Debe ingresar el nombre del cliente.';
	if (carrito.length === 0) return resultadoDiv.textContent = 'Agrega al menos un producto.';

	const venta = { cliente, empleado, productos: carrito };

	try {
		const resp = await fetch('http://localhost:3000/api/venta', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(venta)
		});

		const data = await resp.json();
		if (resp.ok && data.success) {
			resultadoDiv.innerHTML = `
				<strong>${data.message}</strong><br>
				Cliente: ${cliente}<br>
				Empleado: ${empleado}<br>
				Productos:<ul>${venta.productos.map(p => `<li>${p.nombre} (x${p.cantidad})</li>`).join('')}</ul>
			`;
			carrito = [];
			renderCarrito();
			this.reset();

			// Recargar productos (para actualizar stock)
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
	}
});


