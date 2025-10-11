CREATE TABLE empleados (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    nombre VARCHAR(100) NOT NULL
);

INSERT INTO empleados (usuario, password, nombre) VALUES
('alejo1459', '1459', 'Alejo Castaño');