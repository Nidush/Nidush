const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const app = express();
const PORT = 3000;

// Carregar o ficheiro openapi.yaml
const swaggerDocument = YAML.load(path.join(__dirname, 'openapi.yaml'));

// Rota para o Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rota inicial redireciona para o swagger
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

app.listen(PORT, () => {
  console.log(`\n🚀 Swagger UI disponível em: http://localhost:${PORT}/api-docs`);
  console.log(`💡 Podes ver o contrato da API e testar os endpoints aqui.`);
});
