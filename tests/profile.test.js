import { createDriver, BASE_URL, assert } from './setup.js';
import { By } from 'selenium-webdriver';

describe('Completar Perfil', function () {
  this.timeout(30000);
  let driver;

  beforeEach(async () => {
    driver = await createDriver();
  });

  afterEach(async () => {
    await driver.quit();
  });

  it('Acceder a /completar-perfil sin token redirige a login', async () => {
    await driver.get(`${BASE_URL}/completar-perfil`);
    await driver.sleep(1500);

    const url = await driver.getCurrentUrl();
    assert.ok(url === BASE_URL + '/' || url === BASE_URL + '/?', 'Sin token debería redirigir al home');
  });

  it('El título de Bienvenido aparece en la raíz', async () => {
    await driver.get(BASE_URL);
    await driver.sleep(1500);

    const body = await driver.findElement(By.tagName('body')).getText();
    assert.ok(
      body.includes('Bienvenido') || body.includes('IDEAFY'),
      'Debería mostrar contenido de bienvenida o IDEAFY'
    );
  });
});
