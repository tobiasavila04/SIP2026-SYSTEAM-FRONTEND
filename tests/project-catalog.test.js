import { createDriver, BASE_URL, assert } from './setup.js';
import { By } from 'selenium-webdriver';

describe('Proyectos', function () {
  this.timeout(30000);
  let driver;

  beforeEach(async () => {
    driver = await createDriver();
  });

  afterEach(async () => {
    await driver.quit();
  });

  it('Botón de Google está presente en el login', async () => {
    await driver.get(BASE_URL);
    await driver.sleep(1500);

    const body = await driver.findElement(By.tagName('body')).getText();
    assert.ok(body.includes('Google'), 'Debería mencionar Google');
  });

  it('Sin login la app muestra la página de login, no el sidebar', async () => {
    await driver.get(BASE_URL);
    await driver.sleep(1500);

    const body = await driver.findElement(By.tagName('body')).getText();
    const tieneSidebar = body.includes('Mi Perfil') || body.includes('Cerrar sesión');
    assert.ok(!tieneSidebar, 'Sin login no debería mostrarse el sidebar');
  });

  it('Hay inputs de email y contraseña en la página', async () => {
    await driver.get(BASE_URL);
    await driver.sleep(1500);

    const inputs = await driver.findElements(By.css('input'));
    let encontreEmail = false;
    let encontrePass = false;

    for (const input of inputs) {
      const type = await input.getAttribute('type');
      if (type === 'email') encontreEmail = true;
      if (type === 'password') encontrePass = true;
    }

    assert.ok(encontreEmail, 'Debería haber un input de tipo email');
    assert.ok(encontrePass, 'Debería haber un input de tipo password');
  });
});
