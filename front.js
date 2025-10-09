
// Datos simulados para productos (sin empleados quemados para login)
const productos = [
	{ nombre: 'Laptop', precio: 800, stock: 5 },
	{ nombre: 'Mouse', precio: 20, stock: 15 },
	{ nombre: 'Teclado', precio: 35, stock: 10 }
];

let trabajadorActivo = null;

// Redirigir a login.html al hacer clic en el botón de login
window.onload = function() {
	// Leer trabajador activo de localStorage
	trabajadorActivo = localStorage.getItem('trabajadorActivo');
	// Mostrar usuario en sesión en la barra superior
	const usuarioSesion = document.getElementById('usuarioSesion');
	const logoutBtn = document.getElementById('logoutBtn');
	const goLoginBtn = document.getElementById('goLoginBtn');
	if (trabajadorActivo && usuarioSesion) {
		usuarioSesion.textContent = `Sesión: ${trabajadorActivo}`;
		if (logoutBtn) logoutBtn.style.display = 'inline-block';
		if (goLoginBtn) goLoginBtn.style.display = 'none';
	} else if (usuarioSesion) {
		usuarioSesion.textContent = '';
		if (logoutBtn) logoutBtn.style.display = 'none';
		if (goLoginBtn) goLoginBtn.style.display = 'inline-block';
	}
	// Mostrar estado de sesión si existe
	if (trabajadorActivo) {
		const empSel = document.getElementById('empleado');
		empSel.innerHTML = '';
		const opt = document.createElement('option');
		opt.value = trabajadorActivo;
		opt.textContent = trabajadorActivo;
		empSel.appendChild(opt);
		empSel.disabled = false;
	}
	const prodSel = document.getElementById('producto');
	productos.forEach((p, i) => {
		const opt = document.createElement('option');
		opt.value = i;
		opt.textContent = `${p.nombre} ($${p.precio}) - Stock: ${p.stock}`;
		prodSel.appendChild(opt);
	});
	if (goLoginBtn) {
		goLoginBtn.addEventListener('click', function() {
			window.location.href = 'login.html';
		});
	}
	if (logoutBtn) {
		logoutBtn.addEventListener('click', function() {
			localStorage.removeItem('trabajadorActivo');
			window.location.reload();
		});
	}
};


// Carrito de productos
let carrito = [];

function renderCarrito() {
	const carritoLista = document.getElementById('carritoLista');
	carritoLista.innerHTML = '';
	if (carrito.length === 0) {
		carritoLista.innerHTML = '<li>El carrito está vacío.</li>';
		return;
	}
	carrito.forEach((item, idx) => {
		const li = document.createElement('li');
		li.innerHTML = `${item.nombre} (x${item.cantidad}) <button type="button" class="quitar-btn" data-idx="${idx}">Quitar</button>`;
		carritoLista.appendChild(li);
	});
	// Listeners para quitar
	document.querySelectorAll('.quitar-btn').forEach(btn => {
		btn.addEventListener('click', function() {
			const idx = parseInt(this.getAttribute('data-idx'));
			carrito.splice(idx, 1);
			renderCarrito();
		});
	});
}

document.getElementById('agregarCarritoBtn').addEventListener('click', function() {
	const prodIdx = parseInt(document.getElementById('producto').value);
	const cantidad = parseInt(document.getElementById('cantidad').value);
	if (isNaN(prodIdx) || prodIdx < 0 || prodIdx >= productos.length) return;
	if (isNaN(cantidad) || cantidad < 1) return;
	// Verificar stock disponible considerando el carrito
	const enCarrito = carrito.filter(item => item.idx === prodIdx).reduce((acc, item) => acc + item.cantidad, 0);
	if (productos[prodIdx].stock - enCarrito < cantidad) {
		alert('No hay suficiente stock del producto para agregar al carrito.');
		return;
	}
	// Si ya está en el carrito, sumar cantidad
	const existente = carrito.find(item => item.idx === prodIdx);
	if (existente) {
		existente.cantidad += cantidad;
	} else {
		carrito.push({ idx: prodIdx, nombre: productos[prodIdx].nombre, precio: productos[prodIdx].precio, cantidad });
	}
	renderCarrito();
});

// Registrar venta con todos los productos del carrito
document.getElementById('ventaForm').addEventListener('submit', function(e) {
	e.preventDefault();
	const cliente = document.getElementById('cliente').value.trim();
	const empleado = document.getElementById('empleado').value;
	const resultadoDiv = document.getElementById('resultadoVenta');

	// Validaciones previas
	if (!trabajadorActivo) {
		resultadoDiv.textContent = 'Debes iniciar sesión como trabajador para registrar una venta.';
		return;
	}
	if (!cliente) {
		resultadoDiv.textContent = 'Debe ingresar el nombre del cliente.';
		return;
	}
	if (!empleado || empleado !== trabajadorActivo) {
		resultadoDiv.textContent = 'El empleado debe ser el trabajador logueado.';
		return;
	}
	if (carrito.length === 0) {
		resultadoDiv.textContent = 'Agrega al menos un producto al carrito.';
		return;
	}
	// Validar stock de todos los productos
	for (const item of carrito) {
		if (productos[item.idx].stock < item.cantidad) {
			resultadoDiv.textContent = `No hay suficiente stock de ${productos[item.idx].nombre}.`;
			return;
		}
	}

	// Ejecución de la transacción
	let total = 0;
	carrito.forEach(item => {
		productos[item.idx].stock -= item.cantidad;
		total += item.cantidad * item.precio;
	});
	const venta = {
		cliente,
		productos: carrito.map(item => ({ nombre: item.nombre, cantidad: item.cantidad })),
		empleado,
		total
	};

	// Actualizar select de productos (stock)
	const prodSel = document.getElementById('producto');
	productos.forEach((p, i) => {
		prodSel.options[i].textContent = `${p.nombre} ($${p.precio}) - Stock: ${p.stock}`;
	});

	// Salida: mostrar registro de venta
	resultadoDiv.innerHTML = `
		<strong>Venta registrada exitosamente:</strong><br>
		Cliente: ${venta.cliente}<br>
		Productos:<br>
		<ul>${venta.productos.map(p => `<li>${p.nombre} (x${p.cantidad})</li>`).join('')}</ul>
		Empleado: ${venta.empleado}<br>
		<strong>Total: $${venta.total}</strong>
		<br><em>Ingreso generado correctamente.</em>
	`;
	carrito = [];
	renderCarrito();
	this.reset();
});

// Inicializar carrito vacío al cargar
window.addEventListener('DOMContentLoaded', renderCarrito);
