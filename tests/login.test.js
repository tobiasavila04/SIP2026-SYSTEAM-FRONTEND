import { createDriver, BASE_URL, assert } from './setup.js';
import { By, until } from 'selenium-webdriver';

describe('Login / Registro', function () {
  this.timeout(30000);
  let driver;

  beforeEach(async () => {
    driver = await createDriver();
    await driver.get(BASE_URL);
    await driver.sleep(1500);
  });

  afterEach(async () => {
    await driver.quit();
  });

  it('La página de login carga correctamente', async () => {
    const body = await driver.findElement(By.tagName('body')).getText();
    assert.ok(body.includes('IDEAFY') || body.includes('Bienvenido'), 'Debería mostrar contenido de IDEAFY');
  });

  it('Se puede cambiar a modo registro y volver a login', async () => {
    await driver.executeScript('window.scrollTo(0, document.body.scrollHeight);');
    await driver.sleep(500);

    const botonToggle = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(text(), 'Registrate')]")),
      5000
    );
    await driver.wait(until.elementIsVisible(botonToggle), 5000);
    await driver.sleep(300);
    await botonToggle.click();

    await driver.sleep(2000);

    const inputNombre = await driver.findElements(By.css('input[name="name"]'));
    assert.ok(inputNombre.length > 0, 'Modo registro debería tener input de nombre');

    await driver.sleep(500);

    const botonVolver = await driver.findElement(By.xpath("//button[contains(text(), 'Iniciá')]"));
    await driver.executeScript("arguments[0].scrollIntoView(true);", botonVolver);
    await driver.sleep(300);
    await botonVolver.click();

    await driver.sleep(2000);

    const body = await driver.findElement(By.tagName('body')).getText();
    assert.ok(body.includes('Bienvenido de vuelta'), 'Modo login debería mostrar "Bienvenido de vuelta"');
  });

  it('Los inputs de email y password existen en la página', async () => {
    const emailInput = await driver.wait(
      until.elementLocated(By.css('input[name="email"]')),
      5000
    );
    assert.ok(emailInput, 'Debería existir input de email');

    const passInput = await driver.findElement(By.css('input[name="password"]'));
    assert.ok(passInput, 'Debería existir input de password');
  });

  it('Botón de Google OAuth está presente', async () => {
    const googleBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(text(), 'Google')]")),
      5000
    );
    assert.ok(googleBtn, 'Debería existir botón de Google');
  });

  it('El sidebar no se muestra sin estar logueado', async () => {
    const body = await driver.findElement(By.tagName('body')).getText();
    assert.ok(!body.includes('Mi Perfil'), 'Sin login no debería mostrar sidebar');
  });
});
