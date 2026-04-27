const fetch = require('node:fetch');

async function test() {
  const url = 'https://jawmnnwdxfoiirzsyobv.supabase.co/functions/v1/welcome-user';
  const anonKey = 'sb_publishable_jnY2SOyOCCyWVHIGNPrG7Q_Wsq60E1Q';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Gabriel Test',
        email: 'nidush7@gmail.com'
      })
    });
    
    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Body:", text);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
