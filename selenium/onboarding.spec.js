const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function runOnboardingTest() {
    let options = new chrome.Options();
    // Ativa modo headless no CI (GitHub Actions)
    if (process.env.GITHUB_ACTIONS) {
        options.addArguments('--headless');
    }

    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');

    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        console.log('Iniciando Teste Selenium: Onboarding...');
        
        await driver.get('http://localhost:8081/onboarding');

        console.log('A aguardar estabilização do App...');
        await driver.sleep(5000);

        console.log('A procurar botão Discover...');
        let discoverBtn = await driver.findElement(By.css('[data-testid="discover-button"]'));
        await driver.executeScript("arguments[0].click();", discoverBtn);
        console.log(' Discover clicado!');

        await driver.sleep(2000); 
        // 2. Clicar em Skip
        console.log('🔍 A procurar botão Skip...');
        let skipBtn = await driver.findElement(By.css('[data-testid="skip-button"]'));
        await driver.executeScript("arguments[0].click();", skipBtn);
        console.log('Skip clicado!');

        await driver.sleep(2000);
        console.log('este de Onboarding finalizado com sucesso!');

    } catch (error) {
        console.error('Erro no teste:', error.message);
    } finally {
        await driver.quit();
        console.log('Navegador fechado.');
    }
}

runOnboardingTest();
