const { createClient } = require('@supabase/supabase-js');

// Configuração Supabase
const supabaseUrl = 'https://jawmnnwdxfoiirzsyobv.supabase.co';
const supabaseKey = 'sb_publishable_jnY2SOyOCCyWVHIGNPrG7Q_Wsq60E1Q';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createActivity() {
  // try auth_uid directly or auth user
  const { data: users, error: selectError } = await supabase
    .from('users')
    .select('id, auth_uid, email')
    .limit(10);
    
  console.log("Users:", users);
  
  if (users && users.length > 0) {
      // Find the one matching id 83 or the first one if we can't find it
      const user = users.find(u => u.id === 83) || users[0];
      console.log("Using user:", user);
      
      const { error: insertError } = await supabase
        .from('activities')
        .insert({
          title: 'te teste1',
          description: 'Testing spotify',
          room_id: 'Living Room',
          type: 'meditation',
          category: 'My creations',
          user_id: user.auth_uid // Assuming it uses auth_uid based on schema
        });
    
      if (insertError) {
        console.error('Error inserting activity:', insertError);
      } else {
        console.log('Activity created successfully!');
      }
  }
}

createActivity();
