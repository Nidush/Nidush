const { createClient } = require('@supabase/supabase-js');

// Configuração Supabase
const supabaseUrl = 'https://jawmnnwdxfoiirzsyobv.supabase.co';
const supabaseKey = 'sb_publishable_jnY2SOyOCCyWVHIGNPrG7Q_Wsq60E1Q';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createActivity() {
  const emailToFind = 'nidush7@gmail.com'; 
  
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', emailToFind)
    .single();

  if (userError) {
    console.error('Error finding user:', userError);
    return;
  }

  const userId = userData.id;

  const { error: insertError } = await supabase
    .from('activities')
    .insert({
      title: 'te teste1',
      description: 'Testing spotify',
      room_id: 'Living Room',
      type: 'meditation',
      category: 'My creations',
      user_id: userId
    });

  if (insertError) {
    console.error('Error inserting activity:', insertError);
  } else {
    console.log('Activity created successfully!');
  }
}

createActivity();
