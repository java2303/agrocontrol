const { validarLimiteHectareas } = require('../utils/validators');

describe('Pruebas Unitarias - Motor de Reglas (Validación de Parcelas)', () => {
  
  test('Debería aprobar una parcela que está dentro del límite permitido por el CIAT (menor o igual a 50 ha)', () => {
    const resultado = validarLimiteHectareas(35);
    expect(resultado).toBe(true);
  });

  test('Debería rechazar una parcela que excede las 50 hectáreas reglamentarias', () => {
    const resultado = validarLimiteHectareas(50.1);
    expect(resultado).toBe(false);
  });

  test('Debería rechazar valores inválidos, negativos o iguales a cero', () => {
    expect(validarLimiteHectareas(0)).toBe(false);
    expect(validarLimiteHectareas(-10)).toBe(false);
    expect(validarLimiteHectareas("cincuenta")).toBe(false);
  });

});