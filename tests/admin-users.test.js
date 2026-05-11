import { createDriver, BASE_URL, findByTestId, findEl, typeIn, clickEl, getText, assert } from './setup.js';
import { By, until } from 'selenium-webdriver';

const ADMIN_EMAIL = 'admin@ideafy.com';
const ADMIN_PASS = 'Admin123!';

async function loginAsAdmin(driver) {
  await driver.get(BASE_URL);
  await driver.sleep(1500);

  await typeIn(driver, 'input[name="email"]', ADMIN_EMAIL);
  await typeIn(driver, 'input[name="password"]', ADMIN_PASS);
  await clickEl(driver, 'button[type="submit"]');
  await driver.sleep(2000);
}

describe('Administración de Usuarios', function () {
  this.timeout(30000);
  let driver;

  beforeEach(async () => {
    driver = await createDriver();
  });

  afterEach(async () => {
    await driver.quit();
  });

  it('MU-01: La página de usuarios carga con tabla y buscador', async () => {
    await loginAsAdmin(driver);
    await driver.get(`${BASE_URL}/admin/usuarios`);
    await driver.sleep(2000);

    const body = await driver.findElement(By.tagName('body')).getText();

    assert.ok(body.includes('Usuarios'), 'Debería mostrar el título Usuarios');
    assert.ok(body.includes('Buscar'), 'Debería mostrar el buscador');

    const rows = await driver.findElements(By.css('table tbody tr'));
    assert.ok(rows.length >= 1, 'Debería haber al menos una fila en la tabla');
  });

  it('MU-02: El Switch de estado activo/inactivo está presente', async () => {
    await loginAsAdmin(driver);
    await driver.get(`${BASE_URL}/admin/usuarios`);
    await driver.sleep(2000);

    const switches = await driver.findElements(By.css('[data-slot="switch"]'));
    assert.ok(switches.length > 0, 'Debería haber al menos un switch de estado');
  });

  it('MU-03: Se puede abrir el diálogo de crear usuario', async () => {
    await loginAsAdmin(driver);
    await driver.get(`${BASE_URL}/admin/usuarios`);
    await driver.sleep(2000);

    const nuevoBtn = await findEl(driver, 'button:has(svg.lucide-plus)');
    await nuevoBtn.click();
    await driver.sleep(500);

    const body = await driver.findElement(By.tagName('body')).getText();
    assert.ok(body.includes('Crear usuario'), 'Debería mostrar el diálogo de crear usuario');
  });

  it('MU-04: El botón de editar usuario está presente en las filas', async () => {
    await loginAsAdmin(driver);
    await driver.get(`${BASE_URL}/admin/usuarios`);
    await driver.sleep(2000);

    const editBtns = await driver.findElements(By.css('button:has(svg.lucide-pencil)'));
    assert.ok(editBtns.length > 0, 'Debería haber al menos un botón de editar');
  });

  it('MU-05: El select de roles está presente en las filas', async () => {
    await loginAsAdmin(driver);
    await driver.get(`${BASE_URL}/admin/usuarios`);
    await driver.sleep(2000);

    const roleSelects = await driver.findElements(By.css('[data-slot="select-trigger"]'));
    assert.ok(roleSelects.length > 0, 'Debería haber al menos un select de roles');
  });

  it('MU-06: Usuarios no-admin no pueden acceder a /admin/usuarios', async () => {
    await driver.get(`${BASE_URL}/`);
    await driver.sleep(1500);

    await typeIn(driver, 'input[name="email"]', 'user@ideafy.com');
    await typeIn(driver, 'input[name="password"]', 'User123!');
    await clickEl(driver, 'button[type="submit"]');
    await driver.sleep(2000);

    await driver.get(`${BASE_URL}/admin/usuarios`);
    await driver.sleep(2000);

    const currentUrl = await driver.getCurrentUrl();
    assert.ok(!currentUrl.includes('/admin/usuarios'), 'No-admin debería ser redirigido');
  });
});
