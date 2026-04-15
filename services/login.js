import { supabase } from "./supabaseClient.js";

// Elementos do HTML
const resultado = document.getElementById("resultado");
const loginBox = document.getElementById("loginBox");
const dashboardButtons = document.getElementById("dashboardButtons");

// Configuração das tabelas do Supabase que queremos mostrar
const tabelas = {
  btnAtividades: { tableName: "activity", divId: "atividades", titulo: "ATIVIDADES" },
  btnRoutines: { tableName: "routine", divId: "routines", titulo: "ROTINAS" },
  btnScenarios: { tableName: "scenario", divId: "scenarios", titulo: "CENÁRIOS" },
  btnShortcuts: { tableName: "shortcut", divId: "shortcuts", titulo: "SHORTCUTS" },
  btnWearables: { tableName: "wearable", divId: "wearables", titulo: "WEARABLES" }
};

// Associar as funções aos respetivos botões
document.getElementById("loginBtn").addEventListener("click", fazerLogin);
document.getElementById("signupBtn").addEventListener("click", criarConta);
document.getElementById("logoutBtn").addEventListener("click", fazerLogout);

// Quando a página carrega, verificamos logo se já existe uma sessão ativa
iniciarPagina();

async function iniciarPagina() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return;
  }

  resultado.innerText = "Sessão iniciada automaticamente!";
  prepararDashboard(user.id);
}

async function criarConta() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    resultado.innerText = "Por favor preenche o email e a password para criar a conta.";
    return;
  }

  resultado.innerText = "A registar novo utilizador no Supabase...";

  // Registo direto com Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    resultado.innerText = "Erro ao registar: " + error.message;
    return;
  }

  if (data.session == null) {
      resultado.innerText = "Conta criada! Por favor vai ao teu email confirmar a conta antes de entrares. (Ou desativa a confirmação de email nas opções de Auth do Supabase).";
      return;
  }

  resultado.innerText = "Conta criada e sessão iniciada com sucesso!";
  prepararDashboard(data.user.id);
}

// ---> FUNÇÃO DE FAZER LOGIN <--- //
async function fazerLogin() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    resultado.innerText = "Por favor preenche o email e a password.";
    return;
  }

  resultado.innerText = "A fazer login no Supabase...";

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    resultado.innerText = "Erro no login: " + error.message;
    return;
  }

  // Garantir que o userId vem do auth
  const userId = data.user.id;
  resultado.innerText = "Login efetuado com sucesso!";
  
  prepararDashboard(userId);
}

function prepararDashboard(userId) {
  // Esconder a caixa de login e mostrar os botões do dashboard
  loginBox.style.display = "none";
  dashboardButtons.style.display = "block";

  // Associar o clique de cada botão à função de mostrar dados correspondente
  Object.entries(tabelas).forEach(([buttonId, config]) => {
    document.getElementById(buttonId).onclick = () => {
      mostrarDados(userId, config.tableName, config.divId, config.titulo);
    };
  });
}

// ---> FUNÇÃO DE FAZER LOGOUT <--- //
async function fazerLogout() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    resultado.innerText = "Erro ao fazer logout: " + error.message;
    return;
  }
  
  resultado.innerText = "Sessão terminada com sucesso!";
  
  // Esconder botões e voltar a mostrar a caixa de login
  dashboardButtons.style.display = "none";
  loginBox.style.display = "block";
  
  // Limpar os dados dos contentores para a próxima pessoa
  Object.values(tabelas).forEach(config => {
    document.getElementById(config.divId).innerHTML = "";
  });
}

// 2. Buscar dados diretamente do Supabase (sem fetch para /users/...)
async function mostrarDados(userId, tableName, divId, titulo) {
  const container = document.getElementById(divId);
  container.innerHTML = `<h3>${titulo}:</h3><p>A carregar do Supabase...</p>`;

  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .eq("user_iduser", userId); 

  if (error) {
    container.innerHTML = `<h3>${titulo}:</h3><p>Erro ao buscar dados: ${error.message}</p>`;
    return;
  }

  container.innerHTML = `<h3>${titulo}:</h3>`;

  if (!data || data.length === 0) {
    container.innerHTML += "<p>Sem dados registados.</p>";
    return;
  }

  data.forEach(item => {
    const div = document.createElement("div");
    div.className = "item";
    div.textContent = JSON.stringify(item, null, 2);
    container.appendChild(div);
  });
}
